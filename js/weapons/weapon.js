/**
 * Weapon System - Player weapons and combat
 */
class Weapon {
    constructor(type = 'pistol') {
        this.type = type;
        this.damage = this.getWeaponStats(type).damage;
        this.range = this.getWeaponStats(type).range;
        this.fireRate = this.getWeaponStats(type).fireRate; // shots per second
        this.accuracy = this.getWeaponStats(type).accuracy; // 0-1
        this.ammo = this.getWeaponStats(type).ammo;
        this.maxAmmo = this.getWeaponStats(type).maxAmmo;
        
        // Firing state
        this.lastFireTime = 0;
        this.isReloading = false;
        this.reloadTime = this.getWeaponStats(type).reloadTime;
        this.reloadStartTime = 0;
        
        // Visual effects
        this.muzzleFlash = false;
        this.muzzleFlashDuration = 100; // ms
        this.muzzleFlashStart = 0;
    }
    
    getWeaponStats(type) {
        const stats = {
            pistol: {
                damage: 25,
                range: 400,
                fireRate: 2, // 2 shots per second
                accuracy: 0.9,
                ammo: 12,
                maxAmmo: 60,
                reloadTime: 2000 // 2 seconds
            },
            shotgun: {
                damage: 60,
                range: 200,
                fireRate: 0.8, // slower fire rate
                accuracy: 0.7,
                ammo: 8,
                maxAmmo: 40,
                reloadTime: 3000 // 3 seconds
            },
            rifle: {
                damage: 35,
                range: 600,
                fireRate: 4, // 4 shots per second
                accuracy: 0.95,
                ammo: 30,
                maxAmmo: 120,
                reloadTime: 2500 // 2.5 seconds
            }
        };
        
        return stats[type] || stats.pistol;
    }
    
    canFire() {
        const now = Date.now();
        const timeSinceLastShot = now - this.lastFireTime;
        const fireInterval = 1000 / this.fireRate; // ms between shots
        
        return !this.isReloading && 
               this.ammo > 0 && 
               timeSinceLastShot >= fireInterval;
    }
    
    fire(player, enemies, map) {
        if (!this.canFire()) return false;
        
        const now = Date.now();
        this.lastFireTime = now;
        this.ammo--;
        
        // Muzzle flash effect
        this.muzzleFlash = true;
        this.muzzleFlashStart = now;
        
        // Play weapon sound
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playWeaponFire(this.type);
        }
        
        // Perform raycast to find target
        const hit = this.performRaycast(player, map);
        
        if (hit.enemy) {
            // Calculate damage with accuracy
            let actualDamage = this.damage;
            if (Math.random() > this.accuracy) {
                actualDamage *= 0.3; // Partial damage on inaccurate shots
            }
            
            hit.enemy.takeDamage(actualDamage);
            console.log(`Hit enemy for ${actualDamage.toFixed(0)} damage! Enemy health: ${hit.enemy.health}`);
        }
        
        // Auto-reload when empty
        if (this.ammo === 0) {
            this.startReload();
        }
        
        return true; // Shot fired successfully
    }
    
    performRaycast(player, map) {
        // Cast ray from player position in player's facing direction
        const rayX = player.x;
        const rayY = player.y;
        const rayAngle = player.angle;
        const rayDirX = Math.cos(rayAngle);
        const rayDirY = Math.sin(rayAngle);
        
        let currentX = rayX;
        let currentY = rayY;
        let distance = 0;
        const stepSize = 2;
        
        let closestEnemy = null;
        let closestDistance = this.range;
        
        // Cast ray until we hit a wall or reach max range
        while (distance < this.range) {
            currentX += rayDirX * stepSize;
            currentY += rayDirY * stepSize;
            distance += stepSize;
            
            // Check for wall collision
            if (map.isWallAtPosition(currentX, currentY)) {
                break; // Ray blocked by wall
            }
            
            // Check for enemy collisions
            map.enemies.forEach(enemy => {
                if (!enemy.active) return;
                
                const enemyDistance = Math.sqrt(
                    (enemy.x - currentX) * (enemy.x - currentX) +
                    (enemy.y - currentY) * (enemy.y - currentY)
                );
                
                // Enemy hit radius (approximate)
                const hitRadius = 20;
                
                if (enemyDistance < hitRadius && distance < closestDistance) {
                    closestEnemy = enemy;
                    closestDistance = distance;
                }
            });
        }
        
        return {
            enemy: closestEnemy,
            distance: closestDistance,
            hitPoint: { x: currentX, y: currentY }
        };
    }
    
    startReload() {
        if (this.isReloading || this.ammo === this.getWeaponStats(this.type).ammo) {
            return false; // Already reloading or full
        }
        
        this.isReloading = true;
        this.reloadStartTime = Date.now();
        console.log(`Reloading ${this.type}...`);
        
        // Play reload sound
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playReload();
        }
        
        return true;
    }
    
    update() {
        const now = Date.now();
        
        // Update reload
        if (this.isReloading) {
            if (now - this.reloadStartTime >= this.reloadTime) {
                // Reload complete
                const stats = this.getWeaponStats(this.type);
                const bulletsToReload = Math.min(stats.ammo - this.ammo, this.maxAmmo);
                this.ammo += bulletsToReload;
                this.maxAmmo -= bulletsToReload;
                this.isReloading = false;
                
                console.log(`Reload complete! Ammo: ${this.ammo}/${this.maxAmmo}`);
            }
        }
        
        // Update muzzle flash
        if (this.muzzleFlash && now - this.muzzleFlashStart >= this.muzzleFlashDuration) {
            this.muzzleFlash = false;
        }
    }
    
    getAmmoString() {
        return `${this.ammo}/${this.maxAmmo}`;
    }
    
    getReloadProgress() {
        if (!this.isReloading) return 1;
        
        const elapsed = Date.now() - this.reloadStartTime;
        return Math.min(elapsed / this.reloadTime, 1);
    }
}

// Weapon manager for handling multiple weapons
class WeaponManager {
    constructor() {
        this.weapons = {
            pistol: new Weapon('pistol'),
            shotgun: new Weapon('shotgun'),
            rifle: new Weapon('rifle')
        };
        
        this.currentWeapon = 'pistol';
    }
    
    getCurrentWeapon() {
        return this.weapons[this.currentWeapon];
    }
    
    switchWeapon(weaponType) {
        if (this.weapons[weaponType]) {
            this.currentWeapon = weaponType;
            console.log(`Switched to ${weaponType}`);
            return true;
        }
        return false;
    }
    
    fire(player, enemies, map) {
        return this.getCurrentWeapon().fire(player, enemies, map);
    }
    
    reload() {
        return this.getCurrentWeapon().startReload();
    }
    
    update() {
        // Update all weapons (for reload timers, etc.)
        Object.values(this.weapons).forEach(weapon => weapon.update());
    }
    
    getHUDInfo() {
        const weapon = this.getCurrentWeapon();
        return {
            weaponName: weapon.type.toUpperCase(),
            ammo: weapon.getAmmoString(),
            isReloading: weapon.isReloading,
            reloadProgress: weapon.getReloadProgress(),
            muzzleFlash: weapon.muzzleFlash
        };
    }
}

// Export to global scope
window.Weapon = Weapon;
window.WeaponManager = WeaponManager;