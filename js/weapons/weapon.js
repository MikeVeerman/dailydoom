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

        // Weapon mods (upgrades)
        this.mods = [];
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
            },
            rocket: {
                damage: 120,
                range: 500,
                fireRate: 0.5, // Very slow
                accuracy: 1.0,
                ammo: 5,
                maxAmmo: 20,
                reloadTime: 4000,
                splashRadius: 80, // Area damage
                selfDamageMultiplier: 0.5 // Reduced self damage
            },
            chaingun: {
                damage: 15,
                range: 350,
                fireRate: 10, // Very fast
                accuracy: 0.6,
                ammo: 50,
                maxAmmo: 200,
                reloadTime: 3500
            }
        };
        
        return stats[type] || stats.pistol;
    }
    
    canFire() {
        const now = Date.now();
        const timeSinceLastShot = now - this.lastFireTime;
        let fireInterval = 1000 / this.getModdedFireRate();

        // Rapid fire power-up doubles fire rate
        if (window.game && window.game.player && window.game.player.hasRapidFire()) {
            fireInterval *= 0.5;
        }

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

        // Muzzle flash particles and screen shake
        if (window.game && window.game.hud) {
            const muzzleX = player.x + Math.cos(player.angle) * 20;
            const muzzleY = player.y + Math.sin(player.angle) * 20;
            window.game.hud.emitMuzzleParticles(muzzleX, muzzleY, player.angle);

            // Screen shake based on weapon power
            const shakeMap = { pistol: 2, shotgun: 6, rifle: 1.5, rocket: 10, chaingun: 1 };
            window.game.hud.triggerScreenShake(shakeMap[this.type] || 3);

            // Weapon recoil animation
            const recoilMap = { pistol: 8, shotgun: 18, rifle: 5, rocket: 25, chaingun: 3 };
            window.game.hud.triggerWeaponRecoil(recoilMap[this.type] || 6);
        }

        // Play weapon sound
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playWeaponFire(this.type);
        }
        
        // Track shot stats
        if (player.stats) player.stats.shotsFired++;

        // Perform raycast to find target
        const hit = this.performRaycast(player, map);

        if (hit.enemy) {
            // Track hit
            if (player.stats) player.stats.shotsHit++;

            // Calculate damage with accuracy (including mods)
            let actualDamage = this.getModdedDamage();
            if (Math.random() > this.accuracy) {
                actualDamage *= 0.3; // Partial damage on inaccurate shots
            }

            // Critical hit (10% chance for 2x damage)
            let isCritical = Math.random() < 0.1;
            if (isCritical) {
                actualDamage *= 2;
            }

            // Apply damage boost if active
            if (player.hasDamageBoost && player.hasDamageBoost()) {
                actualDamage *= 1.5;
            }

            // Apply level damage multiplier
            if (player.levelBonuses) {
                actualDamage *= player.levelBonuses.damageMultiplier;
            }

            actualDamage = Math.round(actualDamage);
            const wasAlive = !hit.enemy.dying;
            hit.enemy.takeDamage(actualDamage);

            // Track damage dealt and kills
            if (player.stats) player.stats.damageDealt += actualDamage;
            if (wasAlive && (hit.enemy.dying || !hit.enemy.active)) {
                if (player.stats) player.stats.enemiesKilled++;
                // Grant XP based on enemy type
                const xpReward = this.getKillXP(hit.enemy);
                if (player.addXP) player.addXP(xpReward);

                // Kill feed message
                if (window.game && window.game.hud && window.game.hud.addKillFeedMessage) {
                    const typeName = (hit.enemy.type || 'enemy').charAt(0).toUpperCase() + (hit.enemy.type || 'enemy').slice(1);
                    const prefix = isCritical ? 'CRITICAL! Killed' : 'Killed';
                    const color = isCritical ? '#FFD700' : '#FF4444';
                    window.game.hud.addKillFeedMessage(`${prefix} ${typeName} +${xpReward} XP`, color);
                }
            }

            // Trigger enemy hit flash and blood particles
            hit.enemy.hitFlashTime = Date.now();
            if (window.game && window.game.hud) {
                window.game.hud.emitBloodParticles(hit.enemy.x, hit.enemy.y, wasAlive && hit.enemy.dying ? 12 : 5);
            }

            // Show floating damage number
            if (window.game && window.game.hud) {
                window.game.hud.addDamageNumber(hit.enemy.x, hit.enemy.y, actualDamage, isCritical);
            }

            console.log(`${isCritical ? 'CRITICAL! ' : ''}Hit enemy for ${actualDamage} damage! Enemy health: ${hit.enemy.health}`);
        }

        // Barrel hit — damage barrel, explode if destroyed
        if (hit.barrel && hit.barrel.active) {
            hit.barrel.health -= this.damage;
            if (hit.barrel.health <= 0) {
                map.explodeBarrel(hit.barrel);
            }
        }

        // Crate hit — damage crate, destroy and drop item if broken
        if (hit.crate && hit.crate.active) {
            hit.crate.health -= this.damage;
            if (hit.crate.health <= 0) {
                map.destroyCrate(hit.crate);
            }
        }

        // Secret wall hit — damage destructible wall
        if (hit.secretWall) {
            map.damageSecretWall(hit.secretWall.mapX, hit.secretWall.mapY, this.damage);
        }

        if (!hit.enemy && !hit.barrel && !hit.crate && hit.hitWall) {
            // Wall impact effect
            if (window.game && window.game.hud) {
                window.game.hud.addImpactSpark(hit.hitPoint.x, hit.hitPoint.y);
            }
        }

        // Rocket launcher splash damage
        const stats = this.getWeaponStats(this.type);
        if (stats.splashRadius && hit.hitPoint) {
            // Explosion particles
            if (window.game && window.game.hud) {
                window.game.hud.emitExplosionParticles(hit.hitPoint.x, hit.hitPoint.y, 15);
                window.game.hud.triggerScreenShake(12);
            }

            const splashRadius = stats.splashRadius;
            const splashDamage = this.damage * 0.5;

            // Damage all enemies in splash radius
            map.enemies.forEach(enemy => {
                if (!enemy.active || enemy.dying) return;
                if (enemy === hit.enemy) return; // Already took direct hit
                const dx = enemy.x - hit.hitPoint.x;
                const dy = enemy.y - hit.hitPoint.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < splashRadius) {
                    const falloff = 1 - (dist / splashRadius);
                    const dmg = Math.round(splashDamage * falloff);
                    enemy.takeDamage(dmg);
                    if (window.game && window.game.hud) {
                        window.game.hud.addDamageNumber(enemy.x, enemy.y, dmg, false);
                    }
                }
            });

            // Self damage if player is too close
            const playerDist = Math.sqrt(
                (player.x - hit.hitPoint.x) ** 2 + (player.y - hit.hitPoint.y) ** 2
            );
            if (playerDist < splashRadius) {
                const selfDmg = Math.round(splashDamage * (1 - playerDist / splashRadius) * (stats.selfDamageMultiplier || 1));
                if (selfDmg > 0) {
                    player.takeDamage(selfDmg);
                    if (window.game && window.game.hud) {
                        window.game.hud.onPlayerDamageFrom(hit.hitPoint.x, hit.hitPoint.y);
                    }
                }
            }
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
                if (!enemy.active || enemy.dying) return;
                
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
        
        // Check for barrel collisions
        let closestBarrel = null;
        let closestBarrelDistance = this.range;
        if (map.barrels) {
            let bCheckX = rayX, bCheckY = rayY, bDist = 0;
            const bStepSize = 2;
            while (bDist < this.range) {
                bCheckX += rayDirX * bStepSize;
                bCheckY += rayDirY * bStepSize;
                bDist += bStepSize;
                if (map.isWallAtPosition(bCheckX, bCheckY)) break;
                for (const barrel of map.barrels) {
                    if (!barrel.active) continue;
                    const bdx = barrel.x - bCheckX;
                    const bdy = barrel.y - bCheckY;
                    if (Math.sqrt(bdx * bdx + bdy * bdy) < barrel.radius && bDist < closestBarrelDistance) {
                        closestBarrel = barrel;
                        closestBarrelDistance = bDist;
                    }
                }
            }
        }

        // Check for crate collisions
        let closestCrate = null;
        let closestCrateDistance = this.range;
        if (map.crates) {
            let cCheckX = rayX, cCheckY = rayY, cDist = 0;
            const cStepSize = 2;
            while (cDist < this.range) {
                cCheckX += rayDirX * cStepSize;
                cCheckY += rayDirY * cStepSize;
                cDist += cStepSize;
                if (map.isWallAtPosition(cCheckX, cCheckY)) break;
                for (const crate of map.crates) {
                    if (!crate.active) continue;
                    const cdx = crate.x - cCheckX;
                    const cdy = crate.y - cCheckY;
                    if (Math.sqrt(cdx * cdx + cdy * cdy) < crate.radius && cDist < closestCrateDistance) {
                        closestCrate = crate;
                        closestCrateDistance = cDist;
                    }
                }
            }
        }

        // Check if the ray hit a secret wall (destructible wall type 10)
        let hitSecretWall = null;
        if (map.isWallAtPosition(currentX, currentY)) {
            const wallMapX = Math.floor(currentX / map.tileSize);
            const wallMapY = Math.floor(currentY / map.tileSize);
            const sw = map.getSecretWallAt(wallMapX, wallMapY);
            if (sw) hitSecretWall = sw;
        }

        return {
            enemy: closestEnemy,
            barrel: closestBarrel,
            crate: closestCrate,
            secretWall: hitSecretWall,
            distance: closestDistance,
            hitPoint: { x: currentX, y: currentY },
            hitWall: !closestEnemy && map.isWallAtPosition(currentX, currentY)
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
    
    getKillXP(enemy) {
        const xpTable = {
            imp: 15, guard: 20, soldier: 30, demon: 40,
            berserker: 35, spitter: 25, shield_guard: 45, boss: 200
        };
        return xpTable[enemy.type] || 20;
    }

    addMod(modType) {
        if (this.mods.includes(modType)) return false;
        this.mods.push(modType);

        // Apply permanent stat changes
        if (modType === 'extended_mag') {
            const bonus = Math.floor(this.getWeaponStats(this.type).maxAmmo * 0.5);
            this.maxAmmo += bonus;
        }

        console.log(`Mod applied to ${this.type}: ${modType}`);
        return true;
    }

    getModdedDamage() {
        let dmg = this.damage;
        if (this.mods.includes('armor_piercing')) {
            dmg = Math.round(dmg * 1.25);
        }
        return dmg;
    }

    getModdedFireRate() {
        let rate = this.fireRate;
        if (this.mods.includes('rapid_fire')) {
            rate *= 1.3;
        }
        return rate;
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
            rifle: new Weapon('rifle'),
            rocket: new Weapon('rocket'),
            chaingun: new Weapon('chaingun')
        };

        this.currentWeapon = 'pistol';

        // Only pistol is unlocked at start; others must be picked up
        this.unlockedWeapons = new Set(['pistol']);
    }

    getCurrentWeapon() {
        return this.weapons[this.currentWeapon];
    }

    isUnlocked(weaponType) {
        return this.unlockedWeapons.has(weaponType);
    }

    unlockWeapon(weaponType) {
        if (this.weapons[weaponType]) {
            this.unlockedWeapons.add(weaponType);
            console.log(`Unlocked weapon: ${weaponType}`);
            return true;
        }
        return false;
    }

    switchWeapon(weaponType) {
        if (this.weapons[weaponType] && this.unlockedWeapons.has(weaponType)) {
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
            muzzleFlash: weapon.muzzleFlash,
            mods: weapon.mods
        };
    }
}

// Export to global scope
window.Weapon = Weapon;
window.WeaponManager = WeaponManager;