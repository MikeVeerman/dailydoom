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

        // Weapon system
        this.weaponManager = new WeaponManager();
        
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
        
        // Shooting
        if (inputManager.isShooting()) {
            this.shoot(map);
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
    }
    
    update(deltaTime, map) {
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
    
    updatePosition(deltaTime, map) {
        // Store original position for collision resolution
        const originalX = this.x;
        const originalY = this.y;
        
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
    
    reload() {
        const success = this.weaponManager.reload();
        if (success) {
            console.log('Reloading weapon...');
        }
    }
    
    switchWeapon(weaponNumber) {
        const weaponNames = { 1: 'pistol', 2: 'shotgun', 3: 'rifle' };
        const weaponName = weaponNames[weaponNumber];
        if (weaponName) {
            this.weaponManager.switchWeapon(weaponName);
        }
    }
    
    // Status methods
    takeDamage(damage) {
        // Invulnerability power-up check
        if (this.hasInvulnerability()) return false;

        // Invincibility frame check (500ms after last hit)
        const now = Date.now();
        if (now - this.lastDamageTime < 500) return false;

        // Apply armor reduction
        let actualDamage = damage;
        if (this.armor > 0) {
            const armorAbsorbed = Math.min(damage * 0.5, this.armor);
            actualDamage -= armorAbsorbed;
            this.armor -= armorAbsorbed;
        }

        this.health = Math.max(0, this.health - actualDamage);
        this.lastDamageTime = now;
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

        // Play death sound
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playPlayerDeath();
        }

        // Respawn after delay
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