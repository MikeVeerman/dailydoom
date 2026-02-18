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
        
        // Animation
        this.lastDamageTime = 0;
        this.damageFlashDuration = 300;
        
        console.log('HUD system initialized');
    }
    
    render(player, gameEngine) {
        // Set up HUD rendering
        this.ctx.save();
        this.ctx.font = this.font;
        this.ctx.fillStyle = this.textColor;
        this.ctx.strokeStyle = this.textColor;
        this.ctx.lineWidth = 1;
        
        // Clear any previous HUD content (transparent areas only)
        // We don't clear the whole screen since that's done by the renderer
        
        // Render HUD elements
        this.renderHealthBar(player);
        this.renderWeaponInfo(player);
        this.renderAmmoCounter(player);
        this.renderCrosshair();
        
        if (this.showFPS && gameEngine) {
            this.renderFPSCounter(gameEngine);
        }
        
        if (this.showDebugInfo && gameEngine) {
            this.renderDebugInfo(player, gameEngine);
        }
        
        // Render damage flash effect
        this.renderDamageFlash(player);
        
        this.ctx.restore();
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
    
    // Called when player takes damage
    onPlayerDamage() {
        this.lastDamageTime = Date.now();
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
}

// Export to global scope
window.HUD = HUD;