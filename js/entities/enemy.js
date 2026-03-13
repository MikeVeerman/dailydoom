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

        // Sound bark tracking
        this.lastBarkTime = 0;
        this.barkCooldown = 2000; // Minimum 2s between barks
        this.hasPlayedAlert = false;

        // Knockback velocity (from explosions)
        this.knockbackVX = 0;
        this.knockbackVY = 0;

        // Attack telegraph
        this.attackTellTime = 0; // timestamp when attack telegraph starts
        this.attackTellDuration = 300; // ms of telegraph before attack lands

        // Death animation
        this.dying = false;
        this.deathTime = 0;
        this.deathDuration = 600; // ms for death animation

        // Infighting: enemy that last damaged this enemy
        this.infightTarget = null;

        // Enhanced AI system
        this.enhancedAI = null;
        if (window.EnhancedEnemyAI) {
            this.enhancedAI = new EnhancedEnemyAI(this, type);
        }
    }
    
    update(deltaTime, player, map, allEnemies) {
        if (!this.active) return;

        // Handle death animation timer
        if (this.dying) {
            if (Date.now() - this.deathTime >= this.deathDuration) {
                this.active = false;
            }
            return; // No AI updates while dying
        }

        // Use enhanced AI if available
        if (this.enhancedAI) {
            // Enhanced AI handles its own movement via enhancedMovement()
            this.enhancedAI.update(deltaTime, player, map, allEnemies || []);
        } else {
            // Fallback to original AI (sets targets + state transitions)
            this.originalUpdate(deltaTime, player, map);
            // Move toward the target set by original AI
            this.moveTowardsTarget(deltaTime, map);
        }

        // Apply knockback
        if (Math.abs(this.knockbackVX) > 0.5 || Math.abs(this.knockbackVY) > 0.5) {
            const kbNewX = this.x + this.knockbackVX * deltaTime;
            const kbNewY = this.y + this.knockbackVY * deltaTime;
            if (map && !map.isWallAtPosition(kbNewX, this.y)) {
                this.x = kbNewX;
            }
            if (map && !map.isWallAtPosition(this.x, kbNewY)) {
                this.y = kbNewY;
            }
            this.knockbackVX *= 0.85;
            this.knockbackVY *= 0.85;
            if (Math.abs(this.knockbackVX) < 0.5) this.knockbackVX = 0;
            if (Math.abs(this.knockbackVY) < 0.5) this.knockbackVY = 0;
        }

        this.updateFacing(player);
    }
    
    originalUpdate(deltaTime, player, map) {
        const now = Date.now();

        // Clear dead infight targets
        if (this.infightTarget && (!this.infightTarget.active || this.infightTarget.dying)) {
            this.infightTarget = null;
        }

        // Infighting: chase and attack the infight target instead of player
        if (this.infightTarget) {
            const target = this.infightTarget;
            const dist = Math.sqrt((target.x - this.x) ** 2 + (target.y - this.y) ** 2);
            if (dist < this.attackRange) {
                if (!this.lastAttackTime || now - this.lastAttackTime > 2000) {
                    this.lastAttackTime = now;
                    target.takeDamage(15, this);
                    if (window.game && window.game.hud) {
                        window.game.hud.addDamageNumber(target.x, target.y, 15, false);
                    }
                }
            } else {
                this.targetX = target.x;
                this.targetY = target.y;
            }
            return;
        }

        const playerDistance = this.getDistanceToPlayer(player);

        // State machine
        switch (this.state) {
            case 'idle':
                if (playerDistance < this.detectionRange) {
                    this.state = 'chase';
                    if (!this.hasPlayedAlert) {
                        this.hasPlayedAlert = true;
                        this.tryBark('alert');
                    }
                    console.log('Enemy detected player!');
                } else if (now - this.lastMoveTime > this.moveInterval) {
                    this.state = 'patrol';
                }
                break;
                
            case 'patrol':
                this.patrol(deltaTime, map);
                if (playerDistance < this.detectionRange) {
                    this.state = 'chase';
                    if (!this.hasPlayedAlert) {
                        this.hasPlayedAlert = true;
                        this.tryBark('alert');
                    }
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
        // Basic attack with cooldown and telegraph
        const now = Date.now();
        if (!this.lastAttackTime) this.lastAttackTime = 0;

        if (now - this.lastAttackTime > 2000) { // 2 second cooldown
            // Start telegraph if not already telegraphing
            if (!this.attackTellTime || now - this.attackTellTime > this.attackTellDuration) {
                this.attackTellTime = now;

                // Warning sound
                if (window.soundEngine && window.soundEngine.isInitialized && window.soundEngine.playAttackWarning) {
                    window.soundEngine.playAttackWarning();
                }

                // Delay the actual attack by telegraph duration
                setTimeout(() => {
                    if (!this.active || this.dying) return;
                    const dist = this.getDistanceToPlayer(player);
                    if (dist > this.attackRange * 1.5) return; // Player escaped

                    this.tryBark('attack');
                    const damage = 15;
                    if (player.takeDamage(damage)) {
                        if (window.game && window.game.hud) {
                            window.game.hud.onPlayerDamageFrom(this.x, this.y, damage);
                            window.game.hud.triggerScreenShake(8);
                        }
                        if (window.soundEngine && window.soundEngine.isInitialized) {
                            window.soundEngine.playPlayerHit();
                        }
                        // Melee knockback
                        if (player.applyKnockback) {
                            player.applyKnockback(this.x, this.y, 300);
                        }
                    }
                }, this.attackTellDuration);

                this.lastAttackTime = now;
            }
        }
    }
    
    moveTowardsTarget(deltaTime, map) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) { // Don't move if very close to target
            const moveDistance = this.speed * deltaTime;
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
        // Face towards infight target if infighting, player if chasing/attacking, otherwise movement direction
        let targetX, targetY;

        if (this.infightTarget && this.infightTarget.active && !this.infightTarget.dying) {
            targetX = this.infightTarget.x;
            targetY = this.infightTarget.y;
        } else if (this.state === 'chase' || this.state === 'attack') {
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
    
    applyKnockback(sourceX, sourceY, force) {
        const dx = this.x - sourceX;
        const dy = this.y - sourceY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.knockbackVX += (dx / dist) * force;
            this.knockbackVY += (dy / dist) * force;
        }
    }

    takeDamage(damage, attacker) {
        let actualDamage = damage;

        // Front shield: reduce damage if hit from front
        if (this.enhancedAI && this.enhancedAI.behavior.frontShield && window.game && window.game.player) {
            const player = window.game.player;
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            let angleDiff = angleToPlayer - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            // If player is roughly in front of enemy (within 90 degrees), shield reduces damage
            if (Math.abs(angleDiff) < Math.PI / 2) {
                actualDamage = Math.round(damage * 0.3); // 70% reduction
            }
        }

        // Berserker rage damage boost when attacking
        if (this.enhancedAI && this.enhancedAI.rageActive) {
            // Berserkers take slightly more damage when enraged
            actualDamage = Math.round(actualDamage * 1.2);
        }

        this.health -= actualDamage;

        // Infighting: if damaged by another enemy, switch aggro target
        if (attacker && attacker !== this && attacker.active && !attacker.dying) {
            this.infightTarget = attacker;
            this.state = 'chase';
        }

        // Play hit sound
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playEnemyHit();
        }

        // Play pain bark (separate from hit/death sounds)
        if (this.health > 0) {
            this.tryBark('pain');
        }

        if (this.health <= 0 && !this.dying) {
            this.dying = true;
            this.deathTime = Date.now();
            this.state = 'dying';

            // Track infighting kill for player credit
            const killedByEnemy = attacker && attacker.active;
            if (killedByEnemy) {
                console.log(`${this.type} killed by ${attacker.type} (infighting)!`);
            } else {
                console.log(`${this.type} destroyed!`);
            }

            // Player gets XP credit for infighting kills
            if (killedByEnemy && window.game && window.game.player) {
                const player = window.game.player;
                const xpTable = { imp: 15, guard: 20, soldier: 30, demon: 40, berserker: 35, spitter: 25, shield_guard: 45, boss: 200, phantom: 30, exploder: 20, sniper: 35 };
                const xpReward = Math.round((xpTable[this.type] || 20) * 0.5); // Half XP for infighting kills
                if (player.addXP) player.addXP(xpReward);
                if (player.stats) player.stats.enemiesKilled++;
                player.registerKill();

                // Kill feed for infighting
                if (window.game.hud && window.game.hud.addKillFeedMessage) {
                    const victimName = (this.type || 'enemy').charAt(0).toUpperCase() + (this.type || 'enemy').slice(1);
                    const killerName = (attacker.type || 'enemy').charAt(0).toUpperCase() + (attacker.type || 'enemy').slice(1);
                    window.game.hud.addKillFeedMessage(`${killerName} killed ${victimName} +${xpReward} XP`, '#FF8800');
                }

                // Clear the attacker's infight target since victim is dead
                attacker.infightTarget = null;
            }

            // Play death sound
            if (window.soundEngine && window.soundEngine.isInitialized) {
                window.soundEngine.playEnemyDeath();
            }

            // Emit death particle burst
            if (window.game && window.game.hud) {
                window.game.hud.emitBloodParticles(this.x, this.y, 15);
            }

            // Loot drops based on enemy type (ammo via spawnAmmoCrate + health/armor)
            if (window.game && window.game.pickupManager) {
                this.dropLoot();
            }
        }

        return actualDamage;
    }
    
    // Drop loot on death based on enemy type
    dropLoot() {
        const pm = window.game.pickupManager;
        // Loot tables: { ammo, health, healthLarge, armor } as drop chances (0-1)
        const lootTable = {
            guard:        { ammo: 0.30, health: 0.20, healthLarge: 0,    armor: 0.05 },
            imp:          { ammo: 0.25, health: 0.15, healthLarge: 0,    armor: 0    },
            soldier:      { ammo: 0.40, health: 0.20, healthLarge: 0.05, armor: 0.10 },
            demon:        { ammo: 0.25, health: 0.30, healthLarge: 0.10, armor: 0.15 },
            berserker:    { ammo: 0.20, health: 0.35, healthLarge: 0.10, armor: 0.10 },
            spitter:      { ammo: 0.35, health: 0.15, healthLarge: 0,    armor: 0.05 },
            shield_guard: { ammo: 0.30, health: 0.20, healthLarge: 0.05, armor: 0.25 },
            boss:         { ammo: 0.80, health: 0.60, healthLarge: 0.40, armor: 0.50 },
            phantom:      { ammo: 0.20, health: 0.25, healthLarge: 0,    armor: 0.05 },
            exploder:     { ammo: 0.15, health: 0.10, healthLarge: 0,    armor: 0    },
            sniper:       { ammo: 0.45, health: 0.15, healthLarge: 0,    armor: 0.10 }
        };

        const table = lootTable[this.type] || lootTable.guard;
        // Small random offset so drops don't stack exactly
        const ox = (Math.random() - 0.5) * 20;
        const oy = (Math.random() - 0.5) * 20;

        if (Math.random() < table.ammo) {
            pm.spawnAmmoCrate(this.x + ox, this.y + oy);
        }
        if (Math.random() < table.healthLarge) {
            pm.spawnHealthDrop(this.x - ox, this.y - oy, 'large');
        } else if (Math.random() < table.health) {
            pm.spawnHealthDrop(this.x - ox, this.y - oy, 'small');
        }
        if (Math.random() < table.armor) {
            pm.spawnArmorDrop(this.x + oy, this.y - ox);
        }
    }

    // Try to play a bark sound, respecting cooldown
    tryBark(barkType) {
        const now = Date.now();
        if (now - this.lastBarkTime < this.barkCooldown) return;
        if (!window.soundEngine || !window.soundEngine.isInitialized) return;

        this.lastBarkTime = now;
        switch (barkType) {
            case 'alert':
                window.soundEngine.playEnemyAlert(this.type);
                break;
            case 'pain':
                window.soundEngine.playEnemyPain(this.type);
                break;
            case 'attack':
                window.soundEngine.playEnemyAttackBark(this.type);
                break;
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