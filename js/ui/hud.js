/**
 * HUD System - Heads-up display for game information
 */
class HUD {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // HUD styling
        this.font = '16px monospace';
        this.smallFont = '12px monospace';
        this.largeFont = '24px monospace';
        
        this.textColor = '#FFFFFF';
        this.healthColor = '#00FF00';
        this.dangerHealthColor = '#FF0000';
        this.ammoColor = '#FFFF00';
        this.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        
        // HUD elements state
        this.showFPS = true;
        this.showDebugInfo = false;
        this.showCrosshair = true;
        this.showWeaponSprite = true;
        this.showMinimap = true;
        
        // Animation
        this.lastDamageTime = 0;
        this.damageFlashDuration = 200;

        // Floating damage numbers
        this.damageNumbers = [];

        // Impact sparks
        this.impactSparks = [];

        // Particle system
        this.particles = [];
        this.maxParticles = 200;

        // Screen shake
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;

        // Kill feed
        this.killFeed = [];
        this.killFeedMax = 4;
        this.killFeedDuration = 3000; // 3 seconds

        // Weapon recoil animation
        this.weaponRecoilOffset = 0;
        this.weaponRecoilDecay = 0.85;

        // Weapon bob animation
        this.weaponBobPhase = 0;
        this.weaponBobX = 0;
        this.weaponBobY = 0;

        // Damage direction indicators
        this.damageIndicators = [];
        this.damageIndicatorDuration = 1000; // 1 second

        // Fog of war
        this.revealedTiles = new Set();
        this.fogRevealRadius = 4; // tiles

        // Hazard zone warning
        this.inHazardZone = false;
        this.hazardType = null; // 'acid' or 'lava'

        // Hit markers
        this.hitMarkerTime = 0;
        this.hitMarkerDuration = 150; // ms
        this.hitMarkerType = 'normal'; // 'normal', 'headshot', 'critical'

        // Low health heartbeat tracking
        this.lastHeartbeatTime = 0;

        // Load weapon sprite images (from FPS Starter Kit, CC0)
        this.weaponImages = {};
        this.loadWeaponImages();

        console.log('HUD system initialized');
    }
    
    render(player, gameEngine) {
        // CRITICAL: Multiple safeguards to ensure HUD always renders
        try {
            // Verify canvas context is valid
            if (!this.ctx || !this.canvas) {
                console.error('HUD: Invalid canvas context');
                return;
            }
            
            // Force canvas context reset with maximum compatibility
            this.ctx.save();
            
            // Comprehensive canvas state reset
            this.ctx.globalAlpha = 1.0;
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.font = this.font;
            this.ctx.fillStyle = this.textColor;
            this.ctx.strokeStyle = this.textColor;
            this.ctx.lineWidth = 1;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'alphabetic';
            this.ctx.lineCap = 'butt';
            this.ctx.lineJoin = 'miter';
            this.ctx.miterLimit = 10;
            
            // Clear any transform matrices
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Clear any previous HUD content (transparent areas only)
        // We don't clear the whole screen since that's done by the renderer
        
            // Render HUD elements with comprehensive error handling
            this.renderHealthBar(player);
            this.renderWeaponInfo(player);
            this.renderAmmoCounter(player);
            this.renderWeaponSprite(player);
            this.renderCrosshair();
            
            if (this.showFPS && gameEngine) {
                this.renderFPSCounter(gameEngine);
            }
            
            if (this.showDebugInfo && gameEngine) {
                this.renderDebugInfo(player, gameEngine);
            }
            
            // Render active power-up indicators
            this.renderPowerupIndicators(player);

            // Render XP bar and level
            this.renderProgressionHUD(player);

            // Render minimap
            if (this.showMinimap && gameEngine && gameEngine.map) {
                this.renderMinimap(player, gameEngine);
            }

            // Render secrets counter
            if (gameEngine && gameEngine.map && gameEngine.map.totalSecrets > 0) {
                this.renderSecretsCounter(gameEngine.map);
            }

            // Render dash cooldown indicator
            this.renderDashIndicator(player);

            // Render kill combo display
            this.renderComboDisplay(player);

            // Render wave indicator
            if (gameEngine && gameEngine.waveSystem && gameEngine.waveSystem.active) {
                this.renderWaveIndicator(gameEngine.waveSystem);
            }

            // Render kill feed
            this.renderKillFeed();

            // Render floating damage numbers and impact effects
            this.renderDamageNumbers(player, gameEngine);
            this.renderImpactSparks(player, gameEngine);

            // Render particle effects
            this.updateAndRenderParticles(player, gameEngine);

            // Apply screen shake
            this.updateScreenShake();

            // Render damage direction indicators
            this.renderDamageIndicators(player);

            // Render low ammo warning
            this.renderLowAmmoWarning(player);

            // Render damage flash effect
            this.renderDamageFlash(player);

            // Render hazard zone warning
            this.renderHazardWarning();

            this.ctx.restore();
        } catch (error) {
            console.error('HUD: Critical rendering error:', error);
            
            // Emergency fallback - attempt to restore canvas state even after failure
            try {
                this.ctx.restore();
            } catch (restoreError) {
                console.error('HUD: Failed to restore canvas state:', restoreError);
            }
        }
    }
    
    renderHealthBar(player) {
        const x = 20;
        const y = this.canvas.height - 80;
        const width = 200;
        const height = 20;
        
        // Background
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(x - 5, y - 5, width + 10, height + 10);
        
        // Health bar background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x, y, width, height);
        
        // Health bar fill
        const healthPercent = player.health / player.maxHealth;
        const healthWidth = width * healthPercent;
        
        if (healthPercent > 0.3) {
            this.ctx.fillStyle = this.healthColor;
        } else {
            this.ctx.fillStyle = this.dangerHealthColor;
        }
        
        this.ctx.fillRect(x, y, healthWidth, height);
        
        // Health text
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = this.font;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`HEALTH: ${player.health}/${player.maxHealth}`, x, y - 10);
        
        // Border
        this.ctx.strokeStyle = this.textColor;
        this.ctx.strokeRect(x, y, width, height);
    }
    
    renderWeaponInfo(player) {
        const weaponInfo = player.weaponManager.getHUDInfo();
        const x = this.canvas.width - 250;
        const y = this.canvas.height - 100;
        
        // Background
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(x - 10, y - 40, 240, 80);
        
        // Weapon name
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = this.largeFont;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(weaponInfo.weaponName, this.canvas.width - 20, y - 15);

        // Active mods display
        if (weaponInfo.mods && weaponInfo.mods.length > 0) {
            this.ctx.font = '10px monospace';
            const modLabels = { armor_piercing: 'AP', rapid_fire: 'RF', extended_mag: 'EXT' };
            const modColors = { armor_piercing: '#FF4444', rapid_fire: '#22FF88', extended_mag: '#4488FF' };
            let modX = this.canvas.width - 20;
            for (let i = weaponInfo.mods.length - 1; i >= 0; i--) {
                const mod = weaponInfo.mods[i];
                const label = modLabels[mod] || mod.toUpperCase();
                const color = modColors[mod] || '#FFFFFF';
                const tw = this.ctx.measureText(label).width + 8;
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                this.ctx.fillRect(modX - tw, y - 6, tw, 14);
                this.ctx.fillStyle = color;
                this.ctx.fillText(label, modX - 4, y + 5);
                modX -= tw + 4;
            }
        }

        // Reload indicator
        if (weaponInfo.isReloading) {
            const progress = weaponInfo.reloadProgress;
            const reloadBarWidth = 200;
            const reloadBarHeight = 8;
            const reloadX = this.canvas.width - 220;
            const reloadY = y + 5;
            
            // Reload bar background
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(reloadX, reloadY, reloadBarWidth, reloadBarHeight);
            
            // Reload progress
            this.ctx.fillStyle = this.ammoColor;
            this.ctx.fillRect(reloadX, reloadY, reloadBarWidth * progress, reloadBarHeight);
            
            // Reload text
            this.ctx.fillStyle = this.textColor;
            this.ctx.font = this.smallFont;
            this.ctx.fillText('RELOADING...', this.canvas.width - 20, y + 25);
        }
        
        // Muzzle flash effect (weapon-specific colors)
        if (weaponInfo.muzzleFlash) {
            const flashColors = {
                PISTOL: 'rgba(255, 200, 50, 0.25)',
                SHOTGUN: 'rgba(255, 150, 30, 0.35)',
                RIFLE: 'rgba(200, 220, 255, 0.2)',
                ROCKET: 'rgba(255, 100, 0, 0.4)',
                CHAINGUN: 'rgba(255, 255, 100, 0.15)'
            };
            this.ctx.fillStyle = flashColors[weaponInfo.weaponName] || 'rgba(255, 255, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Alt-fire mode indicator
        if (weaponInfo.altFireLabel) {
            const altX = this.canvas.width - 20;
            const altY = y - 42;
            this.ctx.font = '10px monospace';
            this.ctx.textAlign = 'right';
            const label = `RMB: ${weaponInfo.altFireLabel}`;
            const tw = this.ctx.measureText(label).width + 8;
            this.ctx.fillStyle = weaponInfo.canAltFire ? 'rgba(0, 180, 255, 0.3)' : 'rgba(80, 80, 80, 0.3)';
            this.ctx.fillRect(altX - tw, altY - 10, tw + 4, 14);
            this.ctx.fillStyle = weaponInfo.canAltFire ? '#00BBFF' : '#666666';
            this.ctx.fillText(label, altX, altY);
        }
    }

    renderAmmoCounter(player) {
        const weaponInfo = player.weaponManager.getHUDInfo();
        const x = this.canvas.width - 20;
        const y = this.canvas.height - 40;
        
        this.ctx.fillStyle = this.ammoColor;
        this.ctx.font = this.largeFont;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(weaponInfo.ammo, x, y);
        
        // Current ammo count (larger)
        const ammoText = weaponInfo.ammo.split('/');
        if (ammoText.length === 2) {
            this.ctx.font = '32px monospace';
            this.ctx.fillText(ammoText[0], x - 80, y);
            
            this.ctx.font = this.font;
            this.ctx.fillStyle = this.textColor;
            this.ctx.fillText(`/ ${ammoText[1]}`, x - 20, y);
        }
    }
    
    renderCrosshair() {
        if (!this.showCrosshair) return;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const size = 10;
        const gap = 3;

        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;

        // Crosshair lines
        this.ctx.beginPath();
        // Top line
        this.ctx.moveTo(centerX, centerY - gap - size);
        this.ctx.lineTo(centerX, centerY - gap);
        // Bottom line
        this.ctx.moveTo(centerX, centerY + gap);
        this.ctx.lineTo(centerX, centerY + gap + size);
        // Left line
        this.ctx.moveTo(centerX - gap - size, centerY);
        this.ctx.lineTo(centerX - gap, centerY);
        // Right line
        this.ctx.moveTo(centerX + gap, centerY);
        this.ctx.lineTo(centerX + gap + size, centerY);
        this.ctx.stroke();

        // Center dot
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(centerX - 1, centerY - 1, 2, 2);

        // Hit marker overlay
        const now = Date.now();
        const elapsed = now - this.hitMarkerTime;
        if (elapsed < this.hitMarkerDuration) {
            const progress = elapsed / this.hitMarkerDuration;
            const alpha = 1 - progress;
            const expand = progress * 4; // slight expansion over time
            const markerSize = 8 + expand;
            const markerGap = 4 + expand;

            // Color based on hit type
            let color;
            if (this.hitMarkerType === 'headshot') {
                color = `rgba(255, 215, 0, ${alpha})`; // gold
            } else if (this.hitMarkerType === 'critical') {
                color = `rgba(255, 100, 0, ${alpha})`; // orange
            } else {
                color = `rgba(255, 255, 255, ${alpha})`; // white
            }

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            // Top-left to center
            this.ctx.moveTo(centerX - markerGap - markerSize, centerY - markerGap - markerSize);
            this.ctx.lineTo(centerX - markerGap, centerY - markerGap);
            // Top-right to center
            this.ctx.moveTo(centerX + markerGap + markerSize, centerY - markerGap - markerSize);
            this.ctx.lineTo(centerX + markerGap, centerY - markerGap);
            // Bottom-left to center
            this.ctx.moveTo(centerX - markerGap - markerSize, centerY + markerGap + markerSize);
            this.ctx.lineTo(centerX - markerGap, centerY + markerGap);
            // Bottom-right to center
            this.ctx.moveTo(centerX + markerGap + markerSize, centerY + markerGap + markerSize);
            this.ctx.lineTo(centerX + markerGap, centerY + markerGap);
            this.ctx.stroke();
        }
    }

    triggerHitMarker(type = 'normal') {
        this.hitMarkerTime = Date.now();
        this.hitMarkerType = type;

        // Play hit marker sound
        if (window.soundEngine && window.soundEngine.isInitialized && window.soundEngine.playHitMarker) {
            window.soundEngine.playHitMarker(type);
        }
    }
    
    loadWeaponImages() {
        // Map weapon names to sprite image paths
        const weaponImageMap = {
            'PISTOL': 'assets/sprites/weapons/fps_handgun.png',
            'SHOTGUN': 'assets/sprites/weapons/shotgun_pickup.png',
            'RIFLE': 'assets/sprites/weapons/rifle_pickup.png',
            'ROCKET': 'assets/sprites/weapons/rocket_pickup.png',
            'CHAINGUN': 'assets/sprites/weapons/chaingun_pickup.png',
            'PUNCH': 'assets/sprites/weapons/knife_pickup.png'
        };

        // First-person gun sprite (used for pistol/rifle/shotgun)
        this.fpsGunSprite = new Image();
        this.fpsGunSprite.src = 'assets/sprites/weapons/fps_gun_idle.png';

        this.fpsMeleeSprite = new Image();
        this.fpsMeleeSprite.src = 'assets/sprites/weapons/fps_melee_idle.png';

        for (const [name, path] of Object.entries(weaponImageMap)) {
            const img = new Image();
            img.src = path;
            this.weaponImages[name] = img;
        }
    }

    renderWeaponSprite(player) {
        if (!this.showWeaponSprite) return;

        const weaponInfo = player.weaponManager.getHUDInfo();
        const weaponName = weaponInfo.weaponName;

        // Decay weapon recoil
        this.weaponRecoilOffset *= this.weaponRecoilDecay;
        if (Math.abs(this.weaponRecoilOffset) < 0.5) this.weaponRecoilOffset = 0;

        // Weapon bob calculation
        const speed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
        const isMoving = speed > 5;

        if (isMoving) {
            const bobSpeed = player.isCrouching ? 4 : (player.isRunning ? 10 : 7);
            const bobAmplitudeX = player.isCrouching ? 2 : (player.isRunning ? 6 : 4);
            const bobAmplitudeY = player.isCrouching ? 1.5 : (player.isRunning ? 4 : 3);
            this.weaponBobPhase += bobSpeed * 0.016; // ~60fps
            this.weaponBobX = Math.sin(this.weaponBobPhase) * bobAmplitudeX;
            this.weaponBobY = Math.abs(Math.cos(this.weaponBobPhase)) * bobAmplitudeY;
        } else {
            // Smoothly return to center
            this.weaponBobX *= 0.85;
            this.weaponBobY *= 0.85;
            if (Math.abs(this.weaponBobX) < 0.3) this.weaponBobX = 0;
            if (Math.abs(this.weaponBobY) < 0.3) this.weaponBobY = 0;
        }

        // First-person weapon view (larger, bottom-right of screen)
        const fpsWeaponSize = 200;
        const fpsX = this.canvas.width / 2 + 50 + this.weaponBobX;
        const fpsY = this.canvas.height - fpsWeaponSize + 20 - this.weaponRecoilOffset + this.weaponBobY;

        // Choose between gun and melee first-person sprite
        const fpsSprite = (weaponName === 'PUNCH') ? this.fpsMeleeSprite : this.fpsGunSprite;
        if (fpsSprite && fpsSprite.complete && fpsSprite.naturalWidth > 0) {
            this.ctx.drawImage(fpsSprite, fpsX, fpsY, fpsWeaponSize, fpsWeaponSize);
        }

        // Small weapon icon in bottom center HUD area
        const centerX = this.canvas.width / 2;
        const bottomY = this.canvas.height - 80;
        const spriteWidth = 50;
        const spriteHeight = 50;
        const x = centerX - spriteWidth / 2;
        const y = bottomY - spriteHeight;

        // Background for weapon icon
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(x - 5, y - 5, spriteWidth + 10, spriteHeight + 10);
        this.ctx.strokeStyle = this.textColor;
        this.ctx.strokeRect(x - 5, y - 5, spriteWidth + 10, spriteHeight + 10);

        // Try image-based weapon icon
        const weaponImg = this.weaponImages[weaponName];
        if (weaponImg && weaponImg.complete && weaponImg.naturalWidth > 0) {
            const prevSmoothing = this.ctx.imageSmoothingEnabled;
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.drawImage(weaponImg, x, y, spriteWidth, spriteHeight);
            this.ctx.imageSmoothingEnabled = prevSmoothing;
        } else {
            // Fallback to procedural weapon sprites
            this.ctx.fillStyle = this.textColor;
            this.ctx.strokeStyle = this.textColor;
            this.ctx.lineWidth = 2;

            switch(weaponName) {
                case 'PISTOL':
                    this.drawPistolSprite(x, y, spriteWidth, spriteHeight);
                    break;
                case 'SHOTGUN':
                    this.drawShotgunSprite(x, y, spriteWidth, spriteHeight);
                    break;
                case 'RIFLE':
                    this.drawRifleSprite(x, y, spriteWidth, spriteHeight);
                    break;
                case 'ROCKET':
                    this.drawRocketSprite(x, y, spriteWidth, spriteHeight);
                    break;
                case 'CHAINGUN':
                    this.drawChaingunSprite(x, y, spriteWidth, spriteHeight);
                    break;
                default:
                    this.drawDefaultWeaponSprite(x, y, spriteWidth, spriteHeight);
            }
        }

        // Weapon name label
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = this.smallFont;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(weaponName, centerX, bottomY + 15);
    }
    
    drawPistolSprite(x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // Pistol barrel
        this.ctx.fillRect(centerX - 3, centerY - 25, 6, 30);
        
        // Pistol grip
        this.ctx.fillRect(centerX - 8, centerY - 5, 16, 20);
        
        // Trigger guard
        this.ctx.strokeRect(centerX - 5, centerY + 5, 10, 8);
        
        // Sight
        this.ctx.fillRect(centerX - 1, centerY - 28, 2, 3);
    }
    
    drawShotgunSprite(x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // Shotgun barrel (wider and longer)
        this.ctx.fillRect(centerX - 4, centerY - 30, 8, 35);
        
        // Stock
        this.ctx.fillRect(centerX - 6, centerY + 5, 12, 15);
        
        // Pump action
        this.ctx.fillRect(centerX - 8, centerY - 15, 16, 8);
        
        // Front sight
        this.ctx.fillRect(centerX - 1, centerY - 33, 2, 3);
    }
    
    drawRifleSprite(x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // Rifle barrel (longest)
        this.ctx.fillRect(centerX - 3, centerY - 35, 6, 40);
        
        // Stock
        this.ctx.fillRect(centerX - 8, centerY + 5, 16, 18);
        
        // Magazine
        this.ctx.fillRect(centerX - 5, centerY - 10, 10, 15);
        
        // Scope/sight
        this.ctx.fillRect(centerX - 2, centerY - 38, 4, 6);
        
        // Muzzle
        this.ctx.strokeRect(centerX - 4, centerY - 38, 8, 3);
    }
    
    drawRocketSprite(x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        // Rocket tube (wide barrel)
        this.ctx.fillRect(centerX - 6, centerY - 30, 12, 35);

        // Exhaust bell at bottom
        this.ctx.fillRect(centerX - 10, centerY + 5, 20, 8);

        // Grip/handle
        this.ctx.fillRect(centerX - 4, centerY + 13, 8, 10);

        // Warhead tip
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - 35);
        this.ctx.lineTo(centerX - 6, centerY - 25);
        this.ctx.lineTo(centerX + 6, centerY - 25);
        this.ctx.closePath();
        this.ctx.fill();

        // Sight rail
        this.ctx.fillRect(centerX - 1, centerY - 38, 2, 5);
    }

    drawChaingunSprite(x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        // Multiple barrels
        for (let i = -2; i <= 2; i++) {
            this.ctx.fillRect(centerX + i * 4 - 1, centerY - 35, 2, 30);
        }

        // Barrel housing
        this.ctx.fillRect(centerX - 12, centerY - 10, 24, 10);

        // Body/receiver
        this.ctx.fillRect(centerX - 8, centerY, 16, 15);

        // Handle
        this.ctx.fillRect(centerX - 5, centerY + 15, 10, 8);

        // Ammo belt stub
        this.ctx.fillRect(centerX + 10, centerY - 5, 8, 12);
    }

    drawDefaultWeaponSprite(x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // Generic weapon shape
        this.ctx.fillRect(centerX - 4, centerY - 20, 8, 25);
        this.ctx.fillRect(centerX - 6, centerY + 5, 12, 10);
    }
    
    renderFPSCounter(gameEngine) {
        const x = 20;
        const y = 30;
        
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(x - 5, y - 20, 120, 30);
        
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = this.font;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${gameEngine.fps}`, x, y);
    }
    
    renderDebugInfo(player, gameEngine) {
        const x = 20;
        let y = 60;
        const lineHeight = 18;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x - 5, y - 15, 300, 150);
        
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = this.smallFont;
        this.ctx.textAlign = 'left';
        
        // Player info
        this.ctx.fillText(`Position: (${player.x.toFixed(1)}, ${player.y.toFixed(1)})`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Angle: ${(player.angle * 180 / Math.PI).toFixed(1)}°`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Velocity: (${player.velocityX.toFixed(2)}, ${player.velocityY.toFixed(2)})`, x, y);
        y += lineHeight;
        
        // Weapon info
        const weaponInfo = player.weaponManager.getHUDInfo();
        this.ctx.fillText(`Weapon: ${weaponInfo.weaponName}`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Ammo: ${weaponInfo.ammo}`, x, y);
        y += lineHeight;
        
        // Enemy count
        const activeEnemies = gameEngine.map.enemies.filter(e => e.active).length;
        this.ctx.fillText(`Active Enemies: ${activeEnemies}`, x, y);
        y += lineHeight;
        
        // Performance
        this.ctx.fillText(`Frame Time: ${gameEngine.getAverageFrameTime().toFixed(2)}ms`, x, y);
    }
    
    renderLowAmmoWarning(player) {
        const weapon = player.weaponManager.getCurrentWeapon();
        const stats = weapon.getWeaponStats(weapon.type);
        const maxMag = stats.ammo;

        // Warn when magazine ammo is below 20% of max magazine capacity
        if (weapon.ammo > 0 && weapon.ammo <= maxMag * 0.2 && !weapon.isReloading) {
            const now = Date.now();
            const pulseAlpha = (Math.sin(now * 0.008) * 0.5 + 0.5) * 0.25;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const edgeSize = 40;

            // Amber/yellow border pulse
            const color = `rgba(255, 160, 0, ${pulseAlpha})`;

            // Top
            const gradTop = this.ctx.createLinearGradient(0, 0, 0, edgeSize);
            gradTop.addColorStop(0, color);
            gradTop.addColorStop(1, 'rgba(255, 160, 0, 0)');
            this.ctx.fillStyle = gradTop;
            this.ctx.fillRect(0, 0, w, edgeSize);

            // Bottom
            const gradBottom = this.ctx.createLinearGradient(0, h, 0, h - edgeSize);
            gradBottom.addColorStop(0, color);
            gradBottom.addColorStop(1, 'rgba(255, 160, 0, 0)');
            this.ctx.fillStyle = gradBottom;
            this.ctx.fillRect(0, h - edgeSize, w, edgeSize);

            // Left
            const gradLeft = this.ctx.createLinearGradient(0, 0, edgeSize, 0);
            gradLeft.addColorStop(0, color);
            gradLeft.addColorStop(1, 'rgba(255, 160, 0, 0)');
            this.ctx.fillStyle = gradLeft;
            this.ctx.fillRect(0, 0, edgeSize, h);

            // Right
            const gradRight = this.ctx.createLinearGradient(w, 0, w - edgeSize, 0);
            gradRight.addColorStop(0, color);
            gradRight.addColorStop(1, 'rgba(255, 160, 0, 0)');
            this.ctx.fillStyle = gradRight;
            this.ctx.fillRect(w - edgeSize, 0, edgeSize, h);
        }
    }

    renderDamageFlash(player) {
        const now = Date.now();
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Damage flash: brief red overlay on hit (~200ms)
        const timeSinceDamage = now - this.lastDamageTime;
        if (timeSinceDamage < this.damageFlashDuration) {
            const alpha = 1 - (timeSinceDamage / this.damageFlashDuration);
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.4})`;
            this.ctx.fillRect(0, 0, w, h);
        }

        // Low-health pulse: vignette red border when health < 25%
        // Intensity scales inversely with health (lower health = stronger effect)
        if (player.health > 0 && player.health < player.maxHealth * 0.25) {
            const healthRatio = player.health / (player.maxHealth * 0.25); // 1.0 at 25%, 0.0 at 0%
            const intensity = 1 - healthRatio; // 0.0 at 25%, 1.0 near 0%
            const pulseSpeed = 0.004 + intensity * 0.006; // Faster pulse at lower health
            const pulseAlpha = (Math.sin(now * pulseSpeed) * 0.5 + 0.5) * (0.2 + intensity * 0.4);
            const edgeSize = 80 + intensity * 40; // Larger vignette at lower health

            // Trigger heartbeat sound
            this.playLowHealthHeartbeat(player, now);

            // Top edge
            const gradTop = this.ctx.createLinearGradient(0, 0, 0, edgeSize);
            gradTop.addColorStop(0, `rgba(255, 0, 0, ${pulseAlpha})`);
            gradTop.addColorStop(1, 'rgba(255, 0, 0, 0)');
            this.ctx.fillStyle = gradTop;
            this.ctx.fillRect(0, 0, w, edgeSize);

            // Bottom edge
            const gradBottom = this.ctx.createLinearGradient(0, h, 0, h - edgeSize);
            gradBottom.addColorStop(0, `rgba(255, 0, 0, ${pulseAlpha})`);
            gradBottom.addColorStop(1, 'rgba(255, 0, 0, 0)');
            this.ctx.fillStyle = gradBottom;
            this.ctx.fillRect(0, h - edgeSize, w, edgeSize);

            // Left edge
            const gradLeft = this.ctx.createLinearGradient(0, 0, edgeSize, 0);
            gradLeft.addColorStop(0, `rgba(255, 0, 0, ${pulseAlpha})`);
            gradLeft.addColorStop(1, 'rgba(255, 0, 0, 0)');
            this.ctx.fillStyle = gradLeft;
            this.ctx.fillRect(0, 0, edgeSize, h);

            // Right edge
            const gradRight = this.ctx.createLinearGradient(w, 0, w - edgeSize, 0);
            gradRight.addColorStop(0, `rgba(255, 0, 0, ${pulseAlpha})`);
            gradRight.addColorStop(1, 'rgba(255, 0, 0, 0)');
            this.ctx.fillStyle = gradRight;
            this.ctx.fillRect(w - edgeSize, 0, edgeSize, h);
        }
    }
    
    playLowHealthHeartbeat(player, now) {
        const healthRatio = player.health / (player.maxHealth * 0.25);
        // Heartbeat interval: 800ms at 25% health, 400ms near death
        const interval = 400 + healthRatio * 400;

        if (now - this.lastHeartbeatTime >= interval) {
            this.lastHeartbeatTime = now;
            if (window.soundEngine && window.soundEngine.isInitialized) {
                window.soundEngine.playHeartbeat(1 - healthRatio);
            }
        }
    }

    renderHazardWarning() {
        if (!this.inHazardZone) return;

        const now = Date.now();
        const w = this.canvas.width;
        const h = this.canvas.height;
        const pulse = 0.15 + 0.1 * Math.sin(now * 0.008);

        // Screen edge tint (green for acid, orange for lava)
        const color = this.hazardType === 'lava' ? '255, 100, 0' : '0, 200, 0';
        const edgeSize = 40;

        // Bottom edge warning glow
        const grad = this.ctx.createLinearGradient(0, h, 0, h - edgeSize);
        grad.addColorStop(0, `rgba(${color}, ${pulse})`);
        grad.addColorStop(1, `rgba(${color}, 0)`);
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, h - edgeSize, w, edgeSize);

        // Warning text
        const label = this.hazardType === 'lava' ? 'LAVA' : 'TOXIC';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'center';
        const textAlpha = 0.6 + 0.4 * Math.sin(now * 0.006);
        this.ctx.fillStyle = `rgba(${color}, ${textAlpha})`;
        this.ctx.fillText(`WARNING: ${label} ZONE`, w / 2, h - 52);
        this.ctx.textAlign = 'left';
    }

    renderDamageIndicators(player) {
        const now = Date.now();
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // Remove expired indicators
        this.damageIndicators = this.damageIndicators.filter(
            ind => now - ind.time < this.damageIndicatorDuration
        );

        for (const ind of this.damageIndicators) {
            const elapsed = now - ind.time;
            const alpha = 1 - (elapsed / this.damageIndicatorDuration);

            // Calculate angle from player to damage source
            const angleToSource = Math.atan2(
                ind.sourceY - player.y,
                ind.sourceX - player.x
            );

            // Relative angle (accounting for player facing direction)
            let relAngle = angleToSource - player.angle;
            // Normalize to -PI to PI
            while (relAngle > Math.PI) relAngle -= Math.PI * 2;
            while (relAngle < -Math.PI) relAngle += Math.PI * 2;

            // Draw a red wedge/arc on screen edge pointing toward damage source
            const radius = Math.min(w, h) * 0.42;
            const arcWidth = 0.4; // radians (~23 degrees)

            this.ctx.save();
            this.ctx.translate(cx, cy);
            // Rotate so 0 = "forward" (up on screen), matching player perspective
            // In the game, angle 0 = right. On screen, forward = up (-PI/2)
            this.ctx.rotate(relAngle);

            // Draw wedge pointing right (toward source), at edge of screen
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, -arcWidth / 2, arcWidth / 2);
            this.ctx.arc(0, 0, radius - 20, arcWidth / 2, -arcWidth / 2, true);
            this.ctx.closePath();

            this.ctx.fillStyle = `rgba(255, 30, 0, ${alpha * 0.7})`;
            this.ctx.fill();

            this.ctx.restore();
        }
    }

    renderPowerupIndicators(player) {
        if (!player.getActivePowerups) return;

        const powerups = player.getActivePowerups();
        if (powerups.length === 0) return;

        const startX = 20;
        const startY = this.canvas.height - 130;

        powerups.forEach((powerup, i) => {
            const y = startY - (i * 22);
            const secondsLeft = Math.ceil(powerup.remaining / 1000);

            // Background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(startX - 2, y - 12, 120, 18);

            // Power-up name and timer
            this.ctx.fillStyle = powerup.color;
            this.ctx.font = this.smallFont;
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${powerup.name} ${secondsLeft}s`, startX, y);

            // Timer bar
            const maxDuration = powerup.name === 'INVULN' ? 5000 : powerup.name === 'RAPID' ? 8000 : 15000;
            const barWidth = 80 * (powerup.remaining / maxDuration);
            this.ctx.fillStyle = powerup.color;
            this.ctx.fillRect(startX, y + 2, barWidth, 3);
        });
    }

    // Particle system
    addParticle(worldX, worldY, vx, vy, color, size, lifetime) {
        if (this.particles.length >= this.maxParticles) return;
        this.particles.push({
            worldX, worldY, vx, vy, color, size, lifetime,
            spawnTime: Date.now(),
            gravity: 0.5
        });
    }

    // Emit blood particles at enemy position
    emitBloodParticles(worldX, worldY, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 40;
            this.addParticle(
                worldX, worldY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                `rgba(${150 + Math.floor(Math.random() * 100)}, 0, 0, 1)`,
                2 + Math.random() * 3,
                400 + Math.random() * 300
            );
        }
    }

    // Emit muzzle flash particles
    emitMuzzleParticles(worldX, worldY, angle) {
        for (let i = 0; i < 5; i++) {
            const spread = (Math.random() - 0.5) * 0.5;
            const speed = 60 + Math.random() * 40;
            this.addParticle(
                worldX, worldY,
                Math.cos(angle + spread) * speed,
                Math.sin(angle + spread) * speed,
                `rgba(255, ${200 + Math.floor(Math.random() * 55)}, 0, 1)`,
                2 + Math.random() * 2,
                150 + Math.random() * 100
            );
        }
    }

    // Emit explosion debris
    emitExplosionParticles(worldX, worldY, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 60;
            const colors = ['#FF4400', '#FF8800', '#FFCC00', '#FF2200', '#AA4400'];
            this.addParticle(
                worldX, worldY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                colors[Math.floor(Math.random() * colors.length)],
                3 + Math.random() * 4,
                500 + Math.random() * 500
            );
        }
    }

    // Trigger screen shake
    triggerScreenShake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    triggerWeaponRecoil(amount) {
        this.weaponRecoilOffset = Math.max(this.weaponRecoilOffset, amount);
    }

    updateScreenShake() {
        if (this.shakeIntensity > 0.5) {
            this.shakeIntensity *= this.shakeDecay;
        } else {
            this.shakeIntensity = 0;
        }
    }

    getScreenShakeOffset() {
        if (this.shakeIntensity <= 0) return { x: 0, y: 0 };
        return {
            x: (Math.random() - 0.5) * this.shakeIntensity * 2,
            y: (Math.random() - 0.5) * this.shakeIntensity * 2
        };
    }

    updateAndRenderParticles(player, gameEngine) {
        const now = Date.now();
        this.particles = this.particles.filter(p => now - p.spawnTime < p.lifetime);

        if (!player || !gameEngine || !gameEngine.renderer) return;
        const renderer = gameEngine.renderer;

        for (const p of this.particles) {
            const elapsed = (now - p.spawnTime) / 1000;
            const progress = (now - p.spawnTime) / p.lifetime;

            // Update position
            const currentX = p.worldX + p.vx * elapsed;
            const currentY = p.worldY + p.vy * elapsed;

            // Project to screen
            const dx = currentX - player.x;
            const dy = currentY - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > renderer.maxRenderDistance || distance < 1) continue;

            let angle = Math.atan2(dy, dx);
            let angleDiff = angle - player.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            if (Math.abs(angleDiff) > renderer.fov / 2) continue;

            const screenX = this.canvas.width / 2 + (angleDiff / renderer.fov) * this.canvas.width;
            const wallHeight = (renderer.wallHeight * renderer.projectionDistance) / distance;
            const screenY = renderer.halfHeight - wallHeight / 4; // Slightly above center

            const alpha = 1 - progress;
            const size = p.size * (1 - progress * 0.5);

            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1.0;
    }

    renderProgressionHUD(player) {
        if (!player.level) return;

        const barWidth = 150;
        const barHeight = 8;
        const x = 20;
        const y = this.canvas.height - 50;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(x - 2, y - 14, barWidth + 4, 28);

        // Level label
        this.ctx.fillStyle = '#AAAAFF';
        this.ctx.font = this.smallFont;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`LV ${player.level}`, x, y - 2);

        // XP bar background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x + 40, y - 6, barWidth - 40, barHeight);

        // XP bar fill
        const progress = player.getXPProgress ? player.getXPProgress() : 0;
        this.ctx.fillStyle = '#6666FF';
        this.ctx.fillRect(x + 40, y - 6, (barWidth - 40) * progress, barHeight);

        // Kills counter
        const kills = player.stats ? player.stats.enemiesKilled : 0;
        this.ctx.fillStyle = '#FF8888';
        this.ctx.fillText(`K:${kills}`, x + barWidth - 30, y + 10);
    }

    renderDashIndicator(player) {
        if (!player.getDashCooldownProgress) return;

        const progress = player.getDashCooldownProgress();
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2 + 25;
        const radius = 8;

        // Only show when on cooldown or dashing
        if (progress >= 1 && !player.isDashing) return;

        // Cooldown arc
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        this.ctx.strokeStyle = player.isDashing ? '#00FFFF' : 'rgba(0, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Background circle
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    renderComboDisplay(player) {
        if (!player.getComboInfo) return;
        const combo = player.getComboInfo();
        if (!combo.active) return;

        const cx = this.canvas.width / 2;
        const baseY = this.canvas.height - 140;

        // Combo count and tier name
        const tier = combo.tier;
        if (tier) {
            // Pulsing glow effect
            const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.01);

            // Tier name
            this.ctx.save();
            this.ctx.textAlign = 'center';
            this.ctx.font = 'bold 20px monospace';
            this.ctx.globalAlpha = pulse;
            this.ctx.fillStyle = tier.color;
            this.ctx.fillText(tier.name, cx, baseY);

            // Multiplier
            this.ctx.font = 'bold 16px monospace';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.globalAlpha = 0.9;
            this.ctx.fillText(`x${combo.count} COMBO`, cx, baseY + 20);
            this.ctx.restore();
        }

        // Timer bar
        const barWidth = 80;
        const barHeight = 3;
        const barX = cx - barWidth / 2;
        const barY = baseY + 28;

        // Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Progress
        const timerColor = combo.timerProgress > 0.3 ? '#FFD700' : '#FF4444';
        this.ctx.fillStyle = timerColor;
        this.ctx.fillRect(barX, barY, barWidth * combo.timerProgress, barHeight);
    }

    renderWaveIndicator(waveSystem) {
        const w = this.canvas.width;
        const ctx = this.ctx;

        // Wave number display (top-right area, below FPS)
        const x = w - 20;
        const y = 45;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x - 110, y - 14, 112, 20);

        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FF4444';
        ctx.fillText(`WAVE ${waveSystem.currentWave}`, x, y);

        // "WAVE INCOMING" center-screen announcement
        if (waveSystem.state === 'announcing') {
            const elapsed = performance.now() - waveSystem.announceTime;
            const alpha = Math.min(1, 1 - (elapsed / waveSystem.announceDuration) * 0.5);
            const pulse = 1 + 0.05 * Math.sin(elapsed * 0.01);
            const fontSize = Math.round(32 * pulse);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${fontSize}px monospace`;
            ctx.textAlign = 'center';

            // Shadow
            ctx.fillStyle = '#000000';
            ctx.fillText(`WAVE ${waveSystem.currentWave}`, w / 2 + 2, 182);

            // Text
            ctx.fillStyle = '#FF4444';
            ctx.fillText(`WAVE ${waveSystem.currentWave}`, w / 2, 180);

            ctx.font = 'bold 18px monospace';
            ctx.fillStyle = '#FFAA00';
            ctx.fillText('INCOMING!', w / 2, 210);

            ctx.restore();
        }
    }

    renderSecretsCounter(map) {
        const x = 20;
        const y = this.canvas.height - 25;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(x - 2, y - 12, 100, 18);

        const found = map.secretsFound;
        const total = map.totalSecrets;
        this.ctx.fillStyle = found === total ? '#FFD700' : '#AAAAAA';
        this.ctx.font = this.smallFont;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SECRETS: ${found}/${total}`, x, y);
    }

    // Kill feed system
    addKillFeedMessage(text, color = '#FF4444') {
        this.killFeed.unshift({
            text,
            color,
            time: Date.now()
        });
        // Keep only max messages
        if (this.killFeed.length > this.killFeedMax * 2) {
            this.killFeed.length = this.killFeedMax * 2;
        }
    }

    renderKillFeed() {
        const now = Date.now();
        // Remove expired messages
        this.killFeed = this.killFeed.filter(m => now - m.time < this.killFeedDuration);

        const visible = this.killFeed.slice(0, this.killFeedMax);
        if (visible.length === 0) return;

        const x = this.canvas.width - 160;
        const startY = 175; // Below minimap (which is 150+10 padding)

        for (let i = 0; i < visible.length; i++) {
            const msg = visible[i];
            const age = now - msg.time;
            const alpha = Math.max(0, 1 - (age / this.killFeedDuration));
            const y = startY + i * 18;

            // Background
            this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
            this.ctx.fillRect(x - 5, y - 11, 170, 16);

            // Text
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = msg.color;
            this.ctx.font = this.smallFont;
            this.ctx.textAlign = 'right';
            this.ctx.fillText(msg.text, this.canvas.width - 15, y);
            this.ctx.globalAlpha = 1.0;
        }
    }

    // Called when player takes damage
    onPlayerDamage() {
        this.lastDamageTime = Date.now();
    }

    // Called when player takes damage from a known source position
    onPlayerDamageFrom(sourceX, sourceY) {
        this.lastDamageTime = Date.now();
        this.damageIndicators.push({
            sourceX,
            sourceY,
            time: Date.now()
        });
    }

    // Add a floating damage number
    addDamageNumber(worldX, worldY, damage, isCritical, isHeadshot) {
        this.damageNumbers.push({
            worldX, worldY, damage, isCritical, isHeadshot: isHeadshot || false,
            spawnTime: Date.now(),
            duration: 1000,
            offsetX: (Math.random() - 0.5) * 30, // Random horizontal offset to prevent overlap
            offsetY: 0
        });
    }

    // Add a wall impact spark
    addImpactSpark(worldX, worldY) {
        this.impactSparks.push({
            worldX, worldY,
            spawnTime: Date.now(),
            duration: 300
        });
    }

    renderDamageNumbers(player, gameEngine) {
        const now = Date.now();

        // Remove expired numbers
        this.damageNumbers = this.damageNumbers.filter(dn => now - dn.spawnTime < dn.duration);

        if (!player || !gameEngine || !gameEngine.renderer) return;
        const renderer = gameEngine.renderer;

        for (const dn of this.damageNumbers) {
            const elapsed = now - dn.spawnTime;
            const progress = elapsed / dn.duration;

            // Calculate screen position from world position
            const dx = dn.worldX - player.x;
            const dy = dn.worldY - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > renderer.maxRenderDistance || distance < 1) continue;

            let angle = Math.atan2(dy, dx);
            let angleDiff = angle - player.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            if (Math.abs(angleDiff) > renderer.fov / 2) continue;

            const baseScreenX = this.canvas.width / 2 + (angleDiff / renderer.fov) * this.canvas.width;
            const screenX = baseScreenX + (dn.offsetX || 0);
            const wallHeight = (renderer.wallHeight * renderer.projectionDistance) / distance;
            const baseY = renderer.halfHeight - wallHeight / 2;
            const screenY = baseY - 20 - (progress * 50); // Float upward

            const alpha = 1 - progress * progress; // Ease-out fade (stays visible longer)
            // Scale font size: bigger for high damage, headshots, crits
            let fontSize = dn.isHeadshot ? 22 : (dn.isCritical ? 20 : 14);
            if (dn.damage >= 80) fontSize += 4;
            else if (dn.damage >= 50) fontSize += 2;
            // Pop-in scale effect: start large and settle
            const scale = progress < 0.15 ? 1 + (1 - progress / 0.15) * 0.3 : 1;
            const scaledSize = Math.round(fontSize * scale);

            this.ctx.font = `bold ${scaledSize}px monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
            const text = dn.damage.toString();
            if (dn.isHeadshot) {
                this.ctx.strokeText(text, screenX, screenY);
                this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
                this.ctx.fillText(text, screenX, screenY);
                this.ctx.font = `bold ${Math.round(10 * scale)}px monospace`;
                this.ctx.strokeText('HEADSHOT', screenX, screenY - scaledSize);
                this.ctx.fillText('HEADSHOT', screenX, screenY - scaledSize);
            } else {
                this.ctx.fillStyle = dn.isCritical
                    ? `rgba(255, 255, 0, ${alpha})`
                    : `rgba(255, 100, 100, ${alpha})`;
                this.ctx.strokeText(text, screenX, screenY);
                this.ctx.fillText(text, screenX, screenY);
            }
        }
    }

    renderImpactSparks(player, gameEngine) {
        const now = Date.now();
        this.impactSparks = this.impactSparks.filter(s => now - s.spawnTime < s.duration);

        if (!player || !gameEngine || !gameEngine.renderer) return;
        const renderer = gameEngine.renderer;

        for (const spark of this.impactSparks) {
            const elapsed = now - spark.spawnTime;
            const progress = elapsed / spark.duration;

            const dx = spark.worldX - player.x;
            const dy = spark.worldY - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > renderer.maxRenderDistance || distance < 1) continue;

            let angle = Math.atan2(dy, dx);
            let angleDiff = angle - player.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            if (Math.abs(angleDiff) > renderer.fov / 2) continue;

            const screenX = this.canvas.width / 2 + (angleDiff / renderer.fov) * this.canvas.width;
            const screenY = renderer.halfHeight;

            const alpha = 1 - progress;
            const size = 4 * (1 - progress);

            this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    updateFogOfWar(player, map) {
        const tileX = Math.floor(player.x / map.tileSize);
        const tileY = Math.floor(player.y / map.tileSize);
        const r = this.fogRevealRadius;

        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    const gx = tileX + dx;
                    const gy = tileY + dy;
                    if (gx >= 0 && gx < map.width && gy >= 0 && gy < map.height) {
                        this.revealedTiles.add(gx + ',' + gy);
                    }
                }
            }
        }
    }

    resetFog() {
        this.revealedTiles = new Set();
    }

    isTileRevealed(gx, gy) {
        return this.revealedTiles.has(gx + ',' + gy);
    }

    renderMinimap(player, gameEngine) {
        const map = gameEngine.map;
        const size = 150;
        const radius = size / 2;
        const padding = 10;
        const centerX = this.canvas.width - radius - padding;
        const centerY = radius + padding;

        // Update fog of war
        this.updateFogOfWar(player, map);

        this.ctx.save();

        // Circular clip region
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.clip();

        // Dark background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(centerX - radius, centerY - radius, size, size);

        // Scale: pixels per world unit (show ~10 tiles around player)
        const viewRange = 10; // tiles visible in each direction
        const scale = radius / (viewRange * map.tileSize);

        // Rotate so player's facing direction points up on screen
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(-player.angle - Math.PI / 2);

        // Player world position as origin offset
        const playerTileX = player.x / map.tileSize;
        const playerTileY = player.y / map.tileSize;

        // Determine tile range to render (with margin for rotation)
        const tileRadius = Math.ceil(viewRange * 1.5);
        const startGX = Math.max(0, Math.floor(playerTileX - tileRadius));
        const endGX = Math.min(map.width - 1, Math.ceil(playerTileX + tileRadius));
        const startGY = Math.max(0, Math.floor(playerTileY - tileRadius));
        const endGY = Math.min(map.height - 1, Math.ceil(playerTileY + tileRadius));

        const cellSize = map.tileSize * scale;

        // Draw walls and floors
        for (let gy = startGY; gy <= endGY; gy++) {
            for (let gx = startGX; gx <= endGX; gx++) {
                const rx = (gx * map.tileSize - player.x) * scale;
                const ry = (gy * map.tileSize - player.y) * scale;

                if (!this.isTileRevealed(gx, gy)) {
                    this.ctx.fillStyle = 'rgba(10, 10, 10, 0.8)';
                    this.ctx.fillRect(rx, ry, Math.ceil(cellSize) + 1, Math.ceil(cellSize) + 1);
                    continue;
                }
                if (map.grid[gy][gx] > 0) {
                    const wallType = map.grid[gy][gx];
                    switch (wallType) {
                        case 1: this.ctx.fillStyle = '#555555'; break;
                        case 2: this.ctx.fillStyle = '#884444'; break;
                        case 3: this.ctx.fillStyle = '#448888'; break;
                        case 4: this.ctx.fillStyle = '#446688'; break;
                        case 5: this.ctx.fillStyle = '#888866'; break;
                        case 6: this.ctx.fillStyle = '#666644'; break;
                        case 9: this.ctx.fillStyle = '#886600'; break;
                        case 10: this.ctx.fillStyle = '#AA7733'; break;
                        default: this.ctx.fillStyle = '#444444'; break;
                    }
                    this.ctx.fillRect(rx, ry, Math.ceil(cellSize) + 1, Math.ceil(cellSize) + 1);
                }
            }
        }

        // Draw acid tiles
        if (map.acidTiles) {
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
            for (const key of map.acidTiles) {
                const [ax, ay] = key.split(',').map(Number);
                if (!this.isTileRevealed(ax, ay)) continue;
                const rx = (ax * map.tileSize - player.x) * scale;
                const ry = (ay * map.tileSize - player.y) * scale;
                this.ctx.fillRect(rx, ry, Math.ceil(cellSize) + 1, Math.ceil(cellSize) + 1);
            }
        }

        // Draw lava tiles
        if (map.lavaTiles) {
            this.ctx.fillStyle = 'rgba(255, 100, 0, 0.4)';
            for (const key of map.lavaTiles) {
                const [lx, ly] = key.split(',').map(Number);
                if (!this.isTileRevealed(lx, ly)) continue;
                const rx = (lx * map.tileSize - player.x) * scale;
                const ry = (ly * map.tileSize - player.y) * scale;
                this.ctx.fillRect(rx, ry, Math.ceil(cellSize) + 1, Math.ceil(cellSize) + 1);
            }
        }

        // Draw barrels
        if (map.barrels) {
            for (const barrel of map.barrels) {
                if (!barrel.active) continue;
                const bgx = Math.floor(barrel.x / map.tileSize);
                const bgy = Math.floor(barrel.y / map.tileSize);
                if (!this.isTileRevealed(bgx, bgy)) continue;
                const rx = (barrel.x - player.x) * scale;
                const ry = (barrel.y - player.y) * scale;
                this.ctx.fillStyle = '#CC4400';
                this.ctx.beginPath();
                this.ctx.arc(rx, ry, Math.max(cellSize * 0.4, 2), 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Draw weapon pickups
        if (gameEngine.pickupManager) {
            const pickups = gameEngine.pickupManager.getActivePickups();
            for (const pickup of pickups) {
                if (!pickup.type.startsWith('weapon_')) continue;
                const pgx = Math.floor(pickup.x / map.tileSize);
                const pgy = Math.floor(pickup.y / map.tileSize);
                if (!this.isTileRevealed(pgx, pgy)) continue;
                const rx = (pickup.x - player.x) * scale;
                const ry = (pickup.y - player.y) * scale;
                this.ctx.fillStyle = pickup.properties.color;
                this.ctx.beginPath();
                this.ctx.arc(rx, ry, Math.max(cellSize * 0.4, 2), 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Draw enemies
        for (const enemy of map.enemies) {
            if (!enemy.active) continue;
            const egx = Math.floor(enemy.x / map.tileSize);
            const egy = Math.floor(enemy.y / map.tileSize);
            if (!this.isTileRevealed(egx, egy)) continue;
            const rx = (enemy.x - player.x) * scale;
            const ry = (enemy.y - player.y) * scale;
            this.ctx.fillStyle = enemy.type === 'boss' ? '#FFD700' : '#FF4444';
            this.ctx.beginPath();
            this.ctx.arc(rx, ry, Math.max(cellSize * 0.4, 2.5), 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Player is always at center, facing up
        // Draw FOV cone (pointing up = forward in rotated space)
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.08)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.arc(0, 0, radius * 0.8, -Math.PI / 2 - Math.PI / 6, -Math.PI / 2 + Math.PI / 6);
        this.ctx.closePath();
        this.ctx.fill();

        // Player direction indicator (triangle pointing up = forward)
        this.ctx.fillStyle = '#00FF00';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -6);
        this.ctx.lineTo(-4, 4);
        this.ctx.lineTo(4, 4);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();

        // Draw circular border (after restore so it's not rotated)
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();

        // North indicator (north = -Y in world space)
        const northScreenAngle = -(Math.PI + player.angle);
        const northX = centerX + Math.cos(northScreenAngle) * (radius - 8);
        const northY = centerY + Math.sin(northScreenAngle) * (radius - 8);
        this.ctx.font = 'bold 10px monospace';
        this.ctx.fillStyle = '#FF4444';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('N', northX, northY + 4);

        this.ctx.lineWidth = 1;
    }

    // Toggle functions
    toggleMinimap() {
        this.showMinimap = !this.showMinimap;
    }

    toggleFPS() {
        this.showFPS = !this.showFPS;
    }
    
    toggleDebugInfo() {
        this.showDebugInfo = !this.showDebugInfo;
    }
    
    toggleCrosshair() {
        this.showCrosshair = !this.showCrosshair;
    }
    
    toggleWeaponSprite() {
        this.showWeaponSprite = !this.showWeaponSprite;
    }
}

// Export to global scope
window.HUD = HUD;