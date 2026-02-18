/**
 * Enemy AI System - Basic enemy behavior and movement
 */
class Enemy {
    constructor(x, y, type = 'guard') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        
        // AI state
        this.state = 'idle'; // idle, patrol, chase, attack, flee, investigate
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 20; // Units per second
        this.detectionRange = 300;
        this.attackRange = 80;
        
        // Movement
        this.targetX = x;
        this.targetY = y;
        this.lastMoveTime = 0;
        this.moveInterval = 2000; // Move every 2 seconds when patrolling
        
        // Original position for patrol
        this.homeX = x;
        this.homeY = y;
        this.patrolRadius = 100;
        
        // Animation/facing
        this.angle = 0;
        this.lastPlayerX = 0;
        this.lastPlayerY = 0;
        
        // Enhanced AI system
        this.enhancedAI = null;
        if (window.EnhancedEnemyAI) {
            this.enhancedAI = new EnhancedEnemyAI(this, type);
        }
    }
    
    update(deltaTime, player, map, allEnemies) {
        if (!this.active) return;
        
        // Use enhanced AI if available
        if (this.enhancedAI) {
            this.enhancedAI.update(deltaTime, player, map, allEnemies || []);
        } else {
            // Fallback to original AI
            this.originalUpdate(deltaTime, player, map);
        }
        
        // Common updates regardless of AI type
        this.moveTowardsTarget(deltaTime, map);
        this.updateFacing(player);
    }
    
    originalUpdate(deltaTime, player, map) {
        const now = Date.now();
        const playerDistance = this.getDistanceToPlayer(player);
        
        // State machine
        switch (this.state) {
            case 'idle':
                if (playerDistance < this.detectionRange) {
                    this.state = 'chase';
                    console.log('Enemy detected player!');
                } else if (now - this.lastMoveTime > this.moveInterval) {
                    this.state = 'patrol';
                }
                break;
                
            case 'patrol':
                this.patrol(deltaTime, map);
                if (playerDistance < this.detectionRange) {
                    this.state = 'chase';
                }
                break;
                
            case 'chase':
                if (playerDistance > this.detectionRange * 1.5) {
                    // Lost player, return to patrol
                    this.state = 'patrol';
                    this.targetX = this.homeX;
                    this.targetY = this.homeY;
                } else if (playerDistance < this.attackRange) {
                    this.state = 'attack';
                } else {
                    this.chase(player, deltaTime, map);
                }
                break;
                
            case 'attack':
                if (playerDistance > this.attackRange * 1.2) {
                    this.state = 'chase';
                } else {
                    this.attack(player);
                }
                break;
        }
        
        // Update position
        this.moveTowardsTarget(deltaTime, map);
        
        // Update angle to face target/player
        this.updateFacing(player);
    }
    
    patrol(deltaTime, map) {
        const now = Date.now();
        
        if (now - this.lastMoveTime > this.moveInterval) {
            // Pick a new random patrol point near home
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.patrolRadius;
            
            this.targetX = this.homeX + Math.cos(angle) * distance;
            this.targetY = this.homeY + Math.sin(angle) * distance;
            
            // Make sure target is not in a wall
            if (map.isWallAtPosition(this.targetX, this.targetY)) {
                this.targetX = this.homeX;
                this.targetY = this.homeY;
            }
            
            this.lastMoveTime = now;
        }
    }
    
    chase(player, deltaTime, map) {
        // Store last known player position
        this.lastPlayerX = player.x;
        this.lastPlayerY = player.y;

        // Use pathfinding if no line of sight
        if (this.hasLineOfSight(player, map)) {
            this.targetX = player.x;
            this.targetY = player.y;
            this.currentPath = null;
        } else {
            const now = Date.now();
            if (!this.currentPath || !this.lastPathTime || now - this.lastPathTime > 500) {
                this.currentPath = map.findPath(this.x, this.y, player.x, player.y);
                this.pathIndex = 0;
                this.lastPathTime = now;
            }

            if (this.currentPath && this.currentPath.length > 0) {
                const wp = this.currentPath[this.pathIndex];
                if (wp) {
                    this.targetX = wp.x;
                    this.targetY = wp.y;
                    const d = Math.sqrt((this.x - wp.x) ** 2 + (this.y - wp.y) ** 2);
                    if (d < 20) {
                        this.pathIndex++;
                        if (this.pathIndex >= this.currentPath.length) {
                            this.currentPath = null;
                        }
                    }
                }
            } else {
                this.targetX = player.x;
                this.targetY = player.y;
            }
        }
    }
    
    attack(player) {
        // Basic attack with cooldown
        const now = Date.now();
        if (!this.lastAttackTime) this.lastAttackTime = 0;

        if (now - this.lastAttackTime > 2000) { // 2 second cooldown
            const damage = 15; // Default fallback damage
            if (player.takeDamage(damage)) {
                if (window.game && window.game.hud) {
                    window.game.hud.onPlayerDamage();
                }
                if (window.soundEngine && window.soundEngine.isInitialized) {
                    window.soundEngine.playPlayerHit();
                }
            }
            this.lastAttackTime = now;
        }
    }
    
    moveTowardsTarget(deltaTime, map) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) { // Don't move if very close to target
            const moveDistance = this.speed * (deltaTime / 1000);
            const moveX = (dx / distance) * moveDistance;
            const moveY = (dy / distance) * moveDistance;
            
            // Check collision before moving
            const newX = this.x + moveX;
            const newY = this.y + moveY;
            
            // Simple collision detection
            if (!map.isWallAtPosition(newX, this.y)) {
                this.x = newX;
            }
            if (!map.isWallAtPosition(this.x, newY)) {
                this.y = newY;
            }
        }
    }
    
    updateFacing(player) {
        // Face towards player if chasing/attacking, otherwise face movement direction
        let targetX, targetY;
        
        if (this.state === 'chase' || this.state === 'attack') {
            targetX = player.x;
            targetY = player.y;
        } else {
            targetX = this.targetX;
            targetY = this.targetY;
        }
        
        this.angle = Math.atan2(targetY - this.y, targetX - this.x);
    }
    
    getDistanceToPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Check if enemy has line of sight to player
    hasLineOfSight(player, map) {
        // Simple raycast from enemy to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const steps = Math.floor(distance / 10); // Check every 10 units
        
        for (let i = 1; i < steps; i++) {
            const checkX = this.x + (dx / steps) * i;
            const checkY = this.y + (dy / steps) * i;
            
            if (map.isWallAtPosition(checkX, checkY)) {
                return false; // Wall blocking line of sight
            }
        }
        
        return true;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        // Play hit sound
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playEnemyHit();
        }
        
        if (this.health <= 0) {
            this.active = false;
            console.log('Enemy destroyed!');
            
            // Play death sound
            if (window.soundEngine && window.soundEngine.isInitialized) {
                window.soundEngine.playEnemyDeath();
            }
        }
    }
    
    // Get current sprite frame (for animation)
    getSpriteFrame() {
        // For now, just return single frame
        // Later could return different frames based on state/animation
        return 'idle';
    }
}

// Export to global scope
window.Enemy = Enemy;