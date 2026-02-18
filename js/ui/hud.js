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
        
        // Animation
        this.lastDamageTime = 0;
        this.damageFlashDuration = 300;

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

            // Render floating damage numbers and impact effects
            this.renderDamageNumbers(player, gameEngine);
            this.renderImpactSparks(player, gameEngine);

            // Render particle effects
            this.updateAndRenderParticles(player, gameEngine);

            // Apply screen shake
            this.updateScreenShake();

            // Render damage flash effect
            this.renderDamageFlash(player);

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
        
        // Muzzle flash effect
        if (weaponInfo.muzzleFlash) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
    }
    
    renderWeaponSprite(player) {
        if (!this.showWeaponSprite) return;
        
        const weaponInfo = player.weaponManager.getHUDInfo();
        const weaponName = weaponInfo.weaponName;
        
        // Position in bottom center of screen
        const centerX = this.canvas.width / 2;
        const bottomY = this.canvas.height - 80;
        const spriteWidth = 120;
        const spriteHeight = 60;
        const x = centerX - spriteWidth / 2;
        const y = bottomY - spriteHeight;
        
        // Background for weapon sprite area
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(x - 5, y - 5, spriteWidth + 10, spriteHeight + 10);
        
        // Border
        this.ctx.strokeStyle = this.textColor;
        this.ctx.strokeRect(x - 5, y - 5, spriteWidth + 10, spriteHeight + 10);
        
        // Weapon-specific visual representation
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
    
    renderDamageFlash(player) {
        const now = Date.now();
        const timeSinceDamage = now - this.lastDamageTime;
        
        if (timeSinceDamage < this.damageFlashDuration) {
            const alpha = 1 - (timeSinceDamage / this.damageFlashDuration);
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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

    // Called when player takes damage
    onPlayerDamage() {
        this.lastDamageTime = Date.now();
    }

    // Add a floating damage number
    addDamageNumber(worldX, worldY, damage, isCritical) {
        this.damageNumbers.push({
            worldX, worldY, damage, isCritical,
            spawnTime: Date.now(),
            duration: 1000,
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

            const screenX = this.canvas.width / 2 + (angleDiff / renderer.fov) * this.canvas.width;
            const wallHeight = (renderer.wallHeight * renderer.projectionDistance) / distance;
            const baseY = renderer.halfHeight - wallHeight / 2;
            const screenY = baseY - 20 - (progress * 40); // Float upward

            const alpha = 1 - progress;
            const fontSize = dn.isCritical ? 20 : 14;

            this.ctx.font = `bold ${fontSize}px monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = dn.isCritical
                ? `rgba(255, 255, 0, ${alpha})`
                : `rgba(255, 100, 100, ${alpha})`;
            this.ctx.fillText(dn.damage.toString(), screenX, screenY);
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
    
    // Toggle functions
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