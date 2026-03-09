/**
 * Projectile System - Enemy projectiles that travel through the world
 */
class Projectile {
    constructor(x, y, targetX, targetY, damage, speed, color, owner) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.color = color || '#FF4400';
        this.owner = owner; // Reference to the enemy that fired it
        this.active = true;
        this.radius = 6;
        this.lifetime = 5000; // Max 5 seconds
        this.spawnTime = Date.now();

        // Calculate velocity toward target
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.velX = (dx / dist) * speed;
            this.velY = (dy / dist) * speed;
        } else {
            this.velX = 0;
            this.velY = 0;
        }
    }

    update(deltaTime, map, player) {
        if (!this.active) return;

        // Check lifetime
        if (Date.now() - this.spawnTime > this.lifetime) {
            this.active = false;
            return;
        }

        // Move projectile
        const newX = this.x + this.velX * deltaTime;
        const newY = this.y + this.velY * deltaTime;

        // Check wall collision
        if (map.isWallAtPosition(newX, newY)) {
            this.active = false;
            return;
        }

        this.x = newX;
        this.y = newY;

        // Check player collision
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.radius + this.radius) {
            if (player.takeDamage(this.damage)) {
                // Trigger HUD damage flash from projectile direction
                if (window.game && window.game.hud) {
                    window.game.hud.onPlayerDamageFrom(this.x, this.y, this.damage);
                }
                if (window.soundEngine && window.soundEngine.isInitialized) {
                    window.soundEngine.playPlayerHit();
                }
            }
            this.active = false;
        }
    }
}

class ProjectileManager {
    constructor() {
        this.projectiles = [];
    }

    spawn(x, y, targetX, targetY, damage, speed, color, owner) {
        this.projectiles.push(new Projectile(x, y, targetX, targetY, damage, speed, color, owner));
    }

    update(deltaTime, map, player) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(deltaTime, map, player);
            if (!this.projectiles[i].active) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    getActiveProjectiles() {
        return this.projectiles;
    }

    clear() {
        this.projectiles = [];
    }
}

// Export to global scope
window.Projectile = Projectile;
window.ProjectileManager = ProjectileManager;
