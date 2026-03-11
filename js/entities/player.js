/**
 * Player Entity - Handles player movement, collision, and state
 */
class Player {
    constructor(x, y, angle) {
        // Position and orientation
        this.x = x;
        this.y = y;
        this.angle = angle;
        
        // Movement properties
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 200; // Units per second
        this.runMultiplier = 1.5;
        this.turnSpeed = 3.0; // Radians per second
        this.lastFootstepTime = 0;
        this.footstepInterval = 400; // ms between footsteps
        
        // Physical properties
        this.radius = 16; // Collision radius
        this.height = 56; // Player height (for crouching, etc.)
        this.eyeHeight = 48; // Camera height
        
        // Health and stats
        this.health = 100;
        this.maxHealth = 100;
        this.armor = 0;
        this.maxArmor = 100;
        
        // Damage tracking
        this.lastDamageTime = 0;

        // Keys collected
        this.keys = [];

        // Progression system
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 100;

        // Stats tracking
        this.stats = {
            enemiesKilled: 0,
            shotsFired: 0,
            shotsHit: 0,
            headshots: 0,
            damageTaken: 0,
            damageDealt: 0,
            itemsCollected: 0,
            deaths: 0,
            timeSurvived: 0
        };

        // Level bonuses (cumulative)
        this.levelBonuses = {
            maxHealthBonus: 0,
            damageMultiplier: 1.0,
            speedBonus: 0
        };

        // Weapon system
        this.weaponManager = new WeaponManager();

        // Kill combo system
        this.combo = {
            count: 0,
            lastKillTime: 0,
            window: 3000, // 3 seconds between kills
            bestStreak: 0,
            totalComboKills: 0 // kills that were part of a combo (count >= 2)
        };

        // Melee punch system
        this.punchDamage = 30;
        this.punchRange = 40;
        this.punchCooldown = 400; // ms
        this.lastPunchTime = 0;
        this.lastPunchHitTime = 0; // When last punch connected
        this.punchComboWindow = 500; // ms to chain combo
        this.punchComboMultiplier = 1.5;

        // Dash ability
        this.dashSpeed = 800;
        this.dashDuration = 200; // ms
        this.dashCooldown = 2000; // ms
        this.dashInvulnDuration = 100; // ms of invulnerability
        this.lastDashTime = 0;
        this.isDashing = false;
        this.dashStartTime = 0;
        this.dashDirX = 0;
        this.dashDirY = 0;

        // Power-up effects
        this.speedBoostEndTime = 0;
        this.damageBoostEndTime = 0;
        this.baseSpeed = this.speed;
        
        // Movement states
        this.isRunning = false;
        this.isCrouching = false;
        this.isJumping = false;
        
        // Input smoothing
        this.mouseSmoothingFactor = 0.7;
        this.lastMouseDelta = { x: 0, y: 0 };
        
        // Collision detection
        this.onGround = true;
        this.canJump = true;
        
        // Knockback velocity (from explosions)
        this.knockbackVX = 0;
        this.knockbackVY = 0;

        // Animation and effects
        this.bobOffset = 0;
        this.bobSpeed = 8;
        this.bobAmount = 4;
        
        console.log(`Player created at (${x}, ${y}), angle: ${MathUtils.radToDeg(angle)}°`);
    }
    
    handleInput(inputManager, deltaTime, map) {
        // Handle turning (mouse and keyboard)
        this.handleTurning(inputManager, deltaTime);
        
        // Handle movement
        this.handleMovement(inputManager, deltaTime);
        
        // Handle actions
        this.handleActions(inputManager, map);
        
        // Handle weapon switching
        this.handleWeaponSwitching(inputManager);
    }
    
    handleTurning(inputManager, deltaTime) {
        let turnAmount = 0;
        
        // Keyboard turning
        if (inputManager.isKeyDown('turnLeft')) {
            turnAmount -= this.turnSpeed * deltaTime;
        }
        if (inputManager.isKeyDown('turnRight')) {
            turnAmount += this.turnSpeed * deltaTime;
        }
        
        // Mouse turning (with smoothing)
        if (inputManager.isMouseLocked()) {
            const mouseDelta = inputManager.getMouseDelta();
            
            // Apply smoothing
            const smoothedDeltaX = this.lastMouseDelta.x * this.mouseSmoothingFactor + 
                                  mouseDelta.x * (1 - this.mouseSmoothingFactor);
            
            turnAmount += smoothedDeltaX;
            this.lastMouseDelta.x = smoothedDeltaX;
        }
        
        // Apply turning
        if (turnAmount !== 0) {
            this.angle += turnAmount;
            this.angle = MathUtils.normalizeAngle(this.angle);
        }
    }
    
    handleMovement(inputManager, deltaTime) {
        // Get movement input
        const movement = inputManager.getMovementVector();
        
        // Check movement states
        this.isRunning = inputManager.isRunning();
        this.isCrouching = inputManager.isCrouching();
        
        // Calculate movement speed
        let currentSpeed = this.speed;
        if (this.isRunning && !this.isCrouching) {
            currentSpeed *= this.runMultiplier;
        }
        if (this.isCrouching) {
            currentSpeed *= 0.5; // Slower when crouching
        }
        
        // Convert movement to world coordinates
        if (movement.x !== 0 || movement.y !== 0) {
            // Forward/backward movement (relative to player angle)
            const forwardX = Math.cos(this.angle) * movement.y * currentSpeed * deltaTime;
            const forwardY = Math.sin(this.angle) * movement.y * currentSpeed * deltaTime;
            
            // Strafe movement (perpendicular to player angle)
            const strafeAngle = this.angle + MathUtils.HALF_PI;
            const strafeX = Math.cos(strafeAngle) * movement.x * currentSpeed * deltaTime;
            const strafeY = Math.sin(strafeAngle) * movement.x * currentSpeed * deltaTime;
            
            // Combine movements
            this.velocityX = forwardX + strafeX;
            this.velocityY = forwardY + strafeY;
            
            // Update head bobbing
            this.updateHeadBob(deltaTime, currentSpeed);
        } else {
            // Decay velocity when not moving
            this.velocityX *= 0.8;
            this.velocityY *= 0.8;
            
            // Stop very small movements
            if (Math.abs(this.velocityX) < 1) this.velocityX = 0;
            if (Math.abs(this.velocityY) < 1) this.velocityY = 0;
        }
        
        // Handle jumping
        if (inputManager.isJumping() && this.canJump && this.onGround) {
            this.jump();
        }
    }
    
    handleActions(inputManager, map) {
        // Use/interact
        if (inputManager.isUsingItem()) {
            this.useItem();
        }

        // Punching (V key)
        if (inputManager.isPunching()) {
            this.punch(map);
        }

        // Shooting — auto-punch if all ammo depleted
        if (inputManager.isShooting()) {
            const weapon = this.weaponManager.getCurrentWeapon();
            if (weapon.ammo <= 0 && weapon.maxAmmo <= 0 && !weapon.isReloading) {
                this.punch(map);
            } else {
                this.shoot(map);
            }
        }

        // Alt-fire (right-click)
        if (inputManager.isAltFiring()) {
            this.altShoot(map);
        }

        // Dash
        if (inputManager.isDashing()) {
            this.startDash(inputManager);
        }

        // Reload
        if (inputManager.isKeyPressed('reload')) {
            this.reload();
        }
    }
    
    handleWeaponSwitching(inputManager) {
        if (inputManager.isKeyPressed('weapon1')) this.switchWeapon(1);
        if (inputManager.isKeyPressed('weapon2')) this.switchWeapon(2);
        if (inputManager.isKeyPressed('weapon3')) this.switchWeapon(3);
        if (inputManager.isKeyPressed('weapon4')) this.switchWeapon(4);
        if (inputManager.isKeyPressed('weapon5')) this.switchWeapon(5);
    }
    
    update(deltaTime, map) {
        // Track survival time
        this.stats.timeSurvived += deltaTime;

        // Update dash movement (overrides normal movement while active)
        this.updateDash(deltaTime, map);

        // Apply movement with collision detection
        this.updatePosition(deltaTime, map);

        // Check for item collection
        this.checkItemCollection(map);

        // Update weapon system
        this.weaponManager.update();

        // Update power-up effects
        this.updatePowerupEffects();

        // Update other systems
        this.updatePhysics(deltaTime);
    }
    
    applyKnockback(sourceX, sourceY, force) {
        const dx = this.x - sourceX;
        const dy = this.y - sourceY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.knockbackVX += (dx / dist) * force;
            this.knockbackVY += (dy / dist) * force;
        }
    }

    updatePosition(deltaTime, map) {
        // Store original position for collision resolution
        const originalX = this.x;
        const originalY = this.y;

        // Apply knockback velocity
        if (Math.abs(this.knockbackVX) > 0.5 || Math.abs(this.knockbackVY) > 0.5) {
            const kbNewX = this.x + this.knockbackVX * deltaTime;
            if (!this.checkCollision(kbNewX, this.y, map)) {
                this.x = kbNewX;
            }
            const kbNewY = this.y + this.knockbackVY * deltaTime;
            if (!this.checkCollision(this.x, kbNewY, map)) {
                this.y = kbNewY;
            }
            // Decay knockback
            this.knockbackVX *= 0.85;
            this.knockbackVY *= 0.85;
            if (Math.abs(this.knockbackVX) < 0.5) this.knockbackVX = 0;
            if (Math.abs(this.knockbackVY) < 0.5) this.knockbackVY = 0;
        }

        // Try to move on X axis
        const newX = this.x + this.velocityX;
        if (!this.checkCollision(newX, this.y, map)) {
            this.x = newX;
        } else {
            this.velocityX = 0; // Stop X movement on collision
        }
        
        // Check for footsteps (if player moved significantly)
        const distanceMoved = Math.sqrt((this.x - originalX) ** 2 + (this.y - originalY) ** 2);
        const now = Date.now();
        
        if (distanceMoved > 2 && now - this.lastFootstepTime > this.footstepInterval) {
            if (window.soundEngine && window.soundEngine.isInitialized) {
                window.soundEngine.playFootstep();
                this.lastFootstepTime = now;
            }
        }
        
        // Try to move on Y axis
        const newY = this.y + this.velocityY;
        if (!this.checkCollision(this.x, newY, map)) {
            this.y = newY;
        } else {
            this.velocityY = 0; // Stop Y movement on collision
        }
        
        // Sliding collision (try to slide along walls)
        if (this.x === originalX && this.y === originalY) {
            // If both movements failed, try each axis separately with reduced velocity
            const slideX = this.x + this.velocityX * 0.5;
            const slideY = this.y + this.velocityY * 0.5;
            
            if (!this.checkCollision(slideX, this.y, map)) {
                this.x = slideX;
            } else if (!this.checkCollision(this.x, slideY, map)) {
                this.y = slideY;
            }
        }
    }
    
    checkCollision(x, y, map) {
        // Check collision using circle collision detection
        const collisions = map.checkCircleCollision(x, y, this.radius);
        return collisions.length > 0;
    }
    
    checkItemCollection(map) {
        const nearbyItems = map.getItemsInRadius(this.x, this.y, this.radius * 2);
        
        for (const item of nearbyItems) {
            this.collectItem(item, map);
        }
    }
    
    collectItem(item, map) {
        switch (item.type) {
            case 'health':
                if (this.health < this.maxHealth) {
                    this.health = Math.min(this.health + 25, this.maxHealth);
                    map.collectItem(item);
                    console.log('Health collected! Health:', this.health);
                }
                break;
                
            case 'ammo':
                if (this.ammo < this.maxAmmo) {
                    this.ammo = Math.min(this.ammo + 30, this.maxAmmo);
                    map.collectItem(item);
                    console.log('Ammo collected! Ammo:', this.ammo);
                }
                break;
                
            case 'armor':
                if (this.armor < this.maxArmor) {
                    this.armor = Math.min(this.armor + 50, this.maxArmor);
                    map.collectItem(item);
                    console.log('Armor collected! Armor:', this.armor);
                }
                break;
        }
    }
    
    updatePhysics(deltaTime) {
        // Simple gravity simulation (if needed for jumping)
        if (!this.onGround) {
            // Apply gravity, landing, etc.
        }
        
        // Update head bobbing animation
        if (Math.abs(this.velocityX) > 1 || Math.abs(this.velocityY) > 1) {
            this.bobOffset += this.bobSpeed * deltaTime;
        } else {
            this.bobOffset *= 0.95; // Fade out bobbing when stationary
        }
    }
    
    updateHeadBob(deltaTime, speed) {
        const movementIntensity = speed / this.speed;
        this.bobOffset += this.bobSpeed * deltaTime * movementIntensity;
    }
    
    getHeadBobOffset() {
        return Math.sin(this.bobOffset) * this.bobAmount;
    }
    
    // Action methods
    jump() {
        if (this.canJump && this.onGround) {
            this.isJumping = true;
            this.onGround = false;
            this.canJump = false;
            
            // Reset jump after a delay
            setTimeout(() => {
                this.isJumping = false;
                this.onGround = true;
                this.canJump = true;
            }, 500);
            
            console.log('Player jumped!');
        }
    }
    
    useItem() {
        // Try to open a door
        if (window.game && window.game.map) {
            const result = window.game.map.tryOpenDoor(this.x, this.y, this.angle, this.keys || []);
            if (result.success) {
                console.log('Door opened!');
            } else if (result.reason === 'need_key') {
                console.log(`Need ${result.key} key to open this door!`);
            }
        }
    }
    
    shoot(map) {
        const success = this.weaponManager.fire(this, map.enemies, map);
        if (success) {
            console.log('Weapon fired!');
        }
    }

    altShoot(map) {
        const success = this.weaponManager.altFire(this, map.enemies, map);
        if (success) {
            console.log('Alt-fire!');
        }
    }
    
    punch(map) {
        const now = Date.now();
        if (now - this.lastPunchTime < this.punchCooldown) return;
        this.lastPunchTime = now;

        // Track shot for stats
        if (this.stats) this.stats.shotsFired++;

        // Play punch sound
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playPunch();
        }

        // Screen shake + forward lunge effect
        if (window.game && window.game.hud) {
            window.game.hud.triggerScreenShake(4);
        }

        // Check for enemies within melee range
        let closestEnemy = null;
        let closestDist = this.punchRange;

        if (map && map.enemies) {
            for (const enemy of map.enemies) {
                if (!enemy.active) continue;
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Check if enemy is roughly in front of the player (within 90 degrees)
                const angleToEnemy = Math.atan2(dy, dx);
                let angleDiff = angleToEnemy - this.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                if (dist < closestDist && Math.abs(angleDiff) < Math.PI / 2) {
                    closestEnemy = enemy;
                    closestDist = dist;
                }
            }
        }

        if (closestEnemy) {
            let damage = this.punchDamage;

            // Combo multiplier: bonus damage if punching within combo window of last hit
            const isCombo = (now - this.lastPunchHitTime) < this.punchComboWindow;
            if (isCombo) {
                damage = Math.round(damage * this.punchComboMultiplier);
            }

            // Apply damage boost
            if (this.hasDamageBoost && this.hasDamageBoost()) {
                damage = Math.round(damage * 1.5);
            }
            if (this.levelBonuses) {
                damage = Math.round(damage * this.levelBonuses.damageMultiplier);
            }

            this.lastPunchHitTime = now;

            if (this.stats) {
                this.stats.shotsHit++;
                this.stats.damageDealt += damage;
            }

            const wasAlive = closestEnemy.active;
            closestEnemy.takeDamage(damage);

            // Knockback: push enemy away from player
            if (closestEnemy.active) {
                const dx = closestEnemy.x - this.x;
                const dy = closestEnemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    const knockbackDist = 20; // ~0.3 tiles (tile = 64)
                    closestEnemy.x += (dx / dist) * knockbackDist;
                    closestEnemy.y += (dy / dist) * knockbackDist;
                }
            }

            if (wasAlive && !closestEnemy.active) {
                if (this.stats) this.stats.enemiesKilled++;
                const xpTable = { imp: 15, guard: 20, soldier: 30, demon: 40, berserker: 35, spitter: 25, shield_guard: 45, boss: 200 };
                const xpReward = xpTable[closestEnemy.type] || 20;
                if (this.addXP) this.addXP(xpReward);
                this.registerKill();

                // Kill feed message for punch kills
                if (window.game && window.game.hud && window.game.hud.addKillFeedMessage) {
                    const typeName = (closestEnemy.type || 'enemy').charAt(0).toUpperCase() + (closestEnemy.type || 'enemy').slice(1);
                    const comboText = isCombo ? 'COMBO! Punched' : 'Punched';
                    window.game.hud.addKillFeedMessage(`${comboText} ${typeName} +${xpReward} XP`, isCombo ? '#FFD700' : '#FF4444');
                }
            }

            // Visual feedback
            closestEnemy.hitFlashTime = Date.now();
            if (window.game && window.game.hud) {
                window.game.hud.emitBloodParticles(closestEnemy.x, closestEnemy.y, wasAlive && !closestEnemy.active ? 12 : 5);
                window.game.hud.addDamageNumber(closestEnemy.x, closestEnemy.y, damage, isCombo);
                window.game.hud.triggerScreenShake(isCombo ? 8 : 4);
            }

            // Play punch hit sound (enhanced)
            if (window.soundEngine && window.soundEngine.isInitialized && window.soundEngine.playPunchHit) {
                window.soundEngine.playPunchHit(isCombo);
            }

            console.log(`${isCombo ? 'COMBO! ' : ''}Punch hit ${closestEnemy.type} for ${damage} damage!`);
        }
    }

    startDash(inputManager) {
        const now = Date.now();
        if (this.isDashing || now - this.lastDashTime < this.dashCooldown) return;

        // Determine dash direction from movement input (forward if none)
        const movement = inputManager.getMovementVector();
        if (movement.x !== 0 || movement.y !== 0) {
            // Dash in movement direction
            const forwardX = Math.cos(this.angle) * movement.y;
            const forwardY = Math.sin(this.angle) * movement.y;
            const strafeAngle = this.angle + MathUtils.HALF_PI;
            const strafeX = Math.cos(strafeAngle) * movement.x;
            const strafeY = Math.sin(strafeAngle) * movement.x;
            const dx = forwardX + strafeX;
            const dy = forwardY + strafeY;
            const len = Math.sqrt(dx * dx + dy * dy);
            this.dashDirX = dx / len;
            this.dashDirY = dy / len;
        } else {
            // Dash forward
            this.dashDirX = Math.cos(this.angle);
            this.dashDirY = Math.sin(this.angle);
        }

        this.isDashing = true;
        this.dashStartTime = now;
        this.lastDashTime = now;

        // Sound
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playDash();
        }

        // Screen shake
        if (window.game && window.game.hud) {
            window.game.hud.triggerScreenShake(3);
        }
    }

    updateDash(deltaTime, map) {
        if (!this.isDashing) return;

        const now = Date.now();
        const elapsed = now - this.dashStartTime;

        if (elapsed >= this.dashDuration) {
            this.isDashing = false;
            return;
        }

        // Move at dash speed
        const moveX = this.dashDirX * this.dashSpeed * deltaTime;
        const moveY = this.dashDirY * this.dashSpeed * deltaTime;

        // Apply with collision
        const newX = this.x + moveX;
        if (!this.checkCollision(newX, this.y, map)) {
            this.x = newX;
        } else {
            this.isDashing = false; // Stop dash on wall collision
        }

        const newY = this.y + moveY;
        if (!this.checkCollision(this.x, newY, map)) {
            this.y = newY;
        } else {
            this.isDashing = false;
        }
    }

    canDash() {
        return !this.isDashing && (Date.now() - this.lastDashTime >= this.dashCooldown);
    }

    getDashCooldownProgress() {
        if (this.canDash()) return 1;
        const elapsed = Date.now() - this.lastDashTime;
        return Math.min(elapsed / this.dashCooldown, 1);
    }

    reload() {
        const success = this.weaponManager.reload();
        if (success) {
            console.log('Reloading weapon...');
        }
    }
    
    switchWeapon(weaponNumber) {
        const weaponNames = { 1: 'pistol', 2: 'shotgun', 3: 'rifle', 4: 'rocket', 5: 'chaingun' };
        const weaponName = weaponNames[weaponNumber];
        if (weaponName) {
            this.weaponManager.switchWeapon(weaponName, true);
        }
    }
    
    // Status methods
    takeDamage(damage) {
        // Invulnerability power-up check
        if (this.hasInvulnerability()) return false;

        // Dash invulnerability (first 100ms of dash)
        if (this.isDashing && (Date.now() - this.dashStartTime) < this.dashInvulnDuration) return false;

        // Invincibility frame check (500ms after last hit)
        const now = Date.now();
        if (now - this.lastDamageTime < 500) return false;

        // Apply armor reduction
        let actualDamage = damage;
        if (this.armor > 0) {
            const armorAbsorbed = Math.min(damage * 0.5, this.armor);
            actualDamage -= armorAbsorbed;
            this.armor -= armorAbsorbed;

            // Armor hit feedback
            if (window.game && window.game.hud) {
                if (this.armor <= 0) {
                    window.game.hud.onArmorBreak(armorAbsorbed);
                } else {
                    window.game.hud.onArmorHit(armorAbsorbed);
                }
            }
            if (window.soundEngine && window.soundEngine.isInitialized) {
                if (this.armor <= 0) {
                    window.soundEngine.playArmorBreak();
                } else {
                    window.soundEngine.playArmorHit();
                }
            }
        }

        this.health = Math.max(0, this.health - actualDamage);
        this.lastDamageTime = now;
        this.stats.damageTaken += actualDamage;
        console.log(`Player took ${actualDamage} damage. Health: ${this.health}, Armor: ${this.armor}`);

        if (this.health <= 0) {
            this.die();
        }

        return true;
    }
    
    heal(amount) {
        const oldHealth = this.health;
        this.health = Math.min(this.health + amount, this.maxHealth);
        console.log(`Player healed ${this.health - oldHealth} HP. Health: ${this.health}`);
    }
    
    die() {
        console.log('Player died!');
        this.isDead = true;
        this.stats.deaths++;

        // Play death sound
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playPlayerDeath();
        }

        // Show death stats screen via game engine
        if (window.game && window.game.onPlayerDeath) {
            window.game.onPlayerDeath();
        } else {
            // Fallback: auto-respawn after delay
            setTimeout(() => {
                this.health = this.maxHealth;
                this.armor = 0;
                this.isDead = false;
                this.x = 160;
                this.y = 160;
                this.angle = 0;
                console.log('Player respawned!');
            }, 2000);
        }
    }
    
    isAlive() {
        return this.health > 0;
    }
    
    // Utility methods
    getPosition() {
        return { x: this.x, y: this.y };
    }
    
    getDirection() {
        return {
            x: Math.cos(this.angle),
            y: Math.sin(this.angle)
        };
    }
    
    distanceTo(x, y) {
        return MathUtils.distance(this.x, this.y, x, y);
    }
    
    angleTo(x, y) {
        return Math.atan2(y - this.y, x - this.x);
    }
    
    // Power-up effects
    applySpeedBoost(durationMs) {
        this.speedBoostEndTime = Date.now() + durationMs;
        this.speed = this.baseSpeed * 1.5; // 50% speed increase
        console.log('Speed boost activated!');
    }
    
    applyDamageBoost(durationMs) {
        this.damageBoostEndTime = Date.now() + durationMs;
        console.log('Damage boost activated!');
    }

    applyRapidFire(durationMs) {
        this.rapidFireEndTime = Date.now() + durationMs;
        console.log('Rapid fire activated!');
    }

    applyInvulnerability(durationMs) {
        this.invulnerabilityEndTime = Date.now() + durationMs;
        console.log('Invulnerability activated!');
    }

    applyHealthRegen(durationMs) {
        this.healthRegenEndTime = Date.now() + durationMs;
        console.log('Health regen activated!');
    }
    
    updatePowerupEffects() {
        const now = Date.now();

        // Check speed boost
        if (now > this.speedBoostEndTime && this.speed !== this.baseSpeed) {
            this.speed = this.baseSpeed;
            console.log('Speed boost expired');
        }

        // Health regen: heal 2 HP per second
        if (this.healthRegenEndTime && now < this.healthRegenEndTime) {
            if (!this.lastRegenTick || now - this.lastRegenTick > 500) {
                if (this.health < this.maxHealth) {
                    this.health = Math.min(this.maxHealth, this.health + 1);
                }
                this.lastRegenTick = now;
            }
        }
    }

    hasDamageBoost() {
        return Date.now() < this.damageBoostEndTime;
    }

    hasRapidFire() {
        return this.rapidFireEndTime && Date.now() < this.rapidFireEndTime;
    }

    hasInvulnerability() {
        return this.invulnerabilityEndTime && Date.now() < this.invulnerabilityEndTime;
    }

    // Get active power-ups for HUD display
    getActivePowerups() {
        const now = Date.now();
        const active = [];
        if (now < this.speedBoostEndTime) active.push({ name: 'SPEED', remaining: this.speedBoostEndTime - now, color: '#FF0088' });
        if (now < this.damageBoostEndTime) active.push({ name: 'DAMAGE', remaining: this.damageBoostEndTime - now, color: '#FF4400' });
        if (this.rapidFireEndTime && now < this.rapidFireEndTime) active.push({ name: 'RAPID', remaining: this.rapidFireEndTime - now, color: '#00FF88' });
        if (this.invulnerabilityEndTime && now < this.invulnerabilityEndTime) active.push({ name: 'INVULN', remaining: this.invulnerabilityEndTime - now, color: '#FFD700' });
        if (this.healthRegenEndTime && now < this.healthRegenEndTime) active.push({ name: 'REGEN', remaining: this.healthRegenEndTime - now, color: '#FF88CC' });
        return active;
    }
    
    // Kill combo system
    registerKill() {
        const now = Date.now();
        const timeSinceLastKill = now - this.combo.lastKillTime;

        if (timeSinceLastKill <= this.combo.window && this.combo.lastKillTime > 0) {
            this.combo.count++;
            this.combo.totalComboKills++;
        } else {
            this.combo.count = 1;
        }

        this.combo.lastKillTime = now;
        if (this.combo.count > this.combo.bestStreak) {
            this.combo.bestStreak = this.combo.count;
        }

        // Combo tier thresholds and names
        const tier = this.getComboTier();
        if (tier) {
            // Show combo tier name in kill feed
            if (window.game && window.game.hud && window.game.hud.addKillFeedMessage) {
                window.game.hud.addKillFeedMessage(`${tier.name}! x${this.combo.count}`, '#FFD700');
            }
            // Play combo sound
            if (window.soundEngine && window.soundEngine.isInitialized && window.soundEngine.playComboTier) {
                window.soundEngine.playComboTier(this.combo.count);
            }
        }
    }

    getComboTier() {
        const tiers = [
            { min: 5, name: 'UNSTOPPABLE', color: '#FF00FF' },
            { min: 4, name: 'MEGA KILL', color: '#FF4400' },
            { min: 3, name: 'MULTI KILL', color: '#FF8800' },
            { min: 2, name: 'DOUBLE KILL', color: '#FFCC00' }
        ];
        for (const tier of tiers) {
            if (this.combo.count >= tier.min) return tier;
        }
        return null;
    }

    getComboMultiplier() {
        const multipliers = { 1: 1, 2: 1.5, 3: 2, 4: 2.5 };
        return multipliers[Math.min(this.combo.count, 5)] || 3;
    }

    getComboInfo() {
        const now = Date.now();
        const elapsed = now - this.combo.lastKillTime;
        const remaining = Math.max(0, this.combo.window - elapsed);
        const active = this.combo.count >= 2 && remaining > 0;
        return {
            count: this.combo.count,
            active: active,
            timerProgress: remaining / this.combo.window,
            tier: this.getComboTier(),
            multiplier: this.getComboMultiplier(),
            bestStreak: this.combo.bestStreak,
            totalComboKills: this.combo.totalComboKills
        };
    }

    // Progression methods
    addXP(amount) {
        this.xp += amount;
        while (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xpToNextLevel = Math.floor(100 * Math.pow(1.3, this.level - 1));

        // Apply level bonuses
        this.levelBonuses.maxHealthBonus += 10;
        this.levelBonuses.damageMultiplier += 0.05;
        this.levelBonuses.speedBonus += 5;

        // Apply bonuses
        this.maxHealth = 100 + this.levelBonuses.maxHealthBonus;
        this.health = Math.min(this.health + 20, this.maxHealth); // Heal 20 on level up
        this.baseSpeed = 200 + this.levelBonuses.speedBonus;
        this.speed = this.baseSpeed;

        // Kill feed message for level up
        if (window.game && window.game.hud && window.game.hud.addKillFeedMessage) {
            window.game.hud.addKillFeedMessage(`LEVEL UP! Now Level ${this.level}`, '#FFD700');
        }

        console.log(`Level up! Now level ${this.level}. Max HP: ${this.maxHealth}, DMG: ${(this.levelBonuses.damageMultiplier * 100).toFixed(0)}%`);
    }

    getXPProgress() {
        return this.xp / this.xpToNextLevel;
    }

    // Debug methods
    getDebugInfo() {
        return {
            position: { x: Math.round(this.x), y: Math.round(this.y) },
            angle: Math.round(MathUtils.radToDeg(this.angle)),
            velocity: { x: this.velocityX.toFixed(2), y: this.velocityY.toFixed(2) },
            health: this.health,
            weapon: this.weaponManager.getHUDInfo(),
            states: {
                running: this.isRunning,
                crouching: this.isCrouching,
                jumping: this.isJumping
            }
        };
    }
}

// Export to global scope
window.Player = Player;