/**
 * Enhanced Enemy AI Behaviors - Different enemy types with unique behaviors
 */

// Enemy behavior templates
const EnemyBehaviors = {
    // Standard guard - balanced behavior
    guard: {
        health: 80,
        speed: 25,
        detectionRange: 250,
        attackRange: 60,
        damage: 15,
        attackCooldown: 2000,
        attackTellDuration: 350, // ms telegraph before attack
        patrolRadius: 80,
        aggressiveness: 0.5,
        intelligence: 0.6,
        resistances: {}, // neutral to all

        // Behavior modifiers
        fleeHealthThreshold: 0.2, // Flee when health < 20%
        groupBehavior: true,
        callForHelp: true,
        useCover: false
    },
    
    // Fast, weak enemies
    imp: {
        health: 40,
        speed: 45,
        detectionRange: 200,
        attackRange: 40,
        damage: 10,
        attackCooldown: 1200,
        attackTellDuration: 250, // fast attacker, short telegraph
        patrolRadius: 120,
        aggressiveness: 0.8,
        intelligence: 0.3,
        resistances: {}, // neutral to all

        fleeHealthThreshold: 0.3,
        groupBehavior: true,
        callForHelp: false,
        useCover: false,
        swarmBehavior: true // Tries to surround player
    },
    
    // Slow, tanky enemies
    demon: {
        health: 300,
        speed: 15,
        detectionRange: 300,
        attackRange: 80,
        damage: 35,
        attackCooldown: 3000,
        attackTellDuration: 500, // slow heavy hitter, long telegraph
        patrolRadius: 60,
        aggressiveness: 0.9,
        intelligence: 0.4,
        resistances: { shotgun: 0.5, rocket: 1.5 }, // tough hide resists shotgun, weak to rockets

        fleeHealthThreshold: 0.1,
        groupBehavior: false,
        callForHelp: false,
        useCover: false,
        chargeAttack: true // Charges at player when close
    },
    
    // Smart, tactical enemies
    soldier: {
        health: 100,
        speed: 30,
        detectionRange: 350,
        attackRange: 200, // Long range
        damage: 20,
        attackCooldown: 1800,
        attackTellDuration: 400, // ranged aim-up telegraph
        patrolRadius: 100,
        aggressiveness: 0.3,
        intelligence: 0.9,
        resistances: {}, // neutral to all

        fleeHealthThreshold: 0.25,
        groupBehavior: true,
        callForHelp: true,
        useCover: true,
        strafeBehavior: true, // Moves sideways while shooting
        retreatBehavior: true // Backs away to maintain distance
    },

    // Fast berserker - gets stronger at low health
    berserker: {
        health: 120,
        speed: 40,
        detectionRange: 280,
        attackRange: 50,
        damage: 25,
        attackCooldown: 1500,
        attackTellDuration: 300, // aggressive, shorter telegraph
        patrolRadius: 100,
        aggressiveness: 0.9,
        intelligence: 0.3,
        resistances: { pistol: 0.5, chaingun: 0.5, shotgun: 1.5 }, // thick armor resists small arms, weak to shotgun

        fleeHealthThreshold: 0, // Never flees
        groupBehavior: false,
        callForHelp: false,
        useCover: false,
        chargeAttack: true,
        berserkerRage: true // Damage and speed increase at low HP
    },

    // Long-range spitter - weak in melee
    spitter: {
        health: 60,
        speed: 20,
        detectionRange: 400,
        attackRange: 300,
        damage: 12,
        attackCooldown: 2000,
        attackTellDuration: 350, // ranged aim-up telegraph
        patrolRadius: 60,
        aggressiveness: 0.4,
        intelligence: 0.7,
        resistances: { rifle: 0.5, shotgun: 1.5 }, // slimy body deflects precision shots, weak to spread

        fleeHealthThreshold: 0.4,
        groupBehavior: false,
        callForHelp: false,
        useCover: true,
        retreatBehavior: true, // Keeps distance
        rangedAttack: true // Fires projectiles
    },

    // Shielded soldier - resistant from the front
    shield_guard: {
        health: 160,
        speed: 18,
        detectionRange: 280,
        attackRange: 70,
        damage: 22,
        attackCooldown: 2200,
        attackTellDuration: 400, // shield wind-up
        patrolRadius: 60,
        aggressiveness: 0.6,
        intelligence: 0.8,
        resistances: { pistol: 0.5, rifle: 0.5, rocket: 1.5, shotgun: 1.5 }, // armored vs small arms, weak to heavy weapons

        fleeHealthThreshold: 0.1,
        groupBehavior: true,
        callForHelp: true,
        useCover: false,
        frontShield: true // 70% damage reduction from front
    },

    // Phantom - partially invisible, appears when attacking
    phantom: {
        health: 50,
        speed: 35,
        detectionRange: 300,
        attackRange: 50,
        damage: 18,
        attackCooldown: 1600,
        attackTellDuration: 300, // decloaks quickly
        patrolRadius: 120,
        aggressiveness: 0.7,
        intelligence: 0.8,
        resistances: { rocket: 0.5, rifle: 1.5 }, // ethereal body phases through explosions, precision weapons disrupt cloak

        fleeHealthThreshold: 0.3,
        groupBehavior: false,
        callForHelp: false,
        useCover: false,
        phantomCloak: true // Partially invisible until attacking
    },

    // Exploder - suicide bomber that charges and detonates
    exploder: {
        health: 30,
        speed: 55,
        detectionRange: 250,
        attackRange: 40,
        damage: 60,
        attackCooldown: 500,
        attackTellDuration: 200, // very short — suicide bomber
        patrolRadius: 80,
        aggressiveness: 1.0,
        intelligence: 0.2,
        resistances: { melee: 0.5, rifle: 1.5, pistol: 1.5 }, // volatile but hard to punch safely, easy to shoot down

        fleeHealthThreshold: 0, // Never flees
        groupBehavior: false,
        callForHelp: false,
        useCover: false,
        chargeAttack: true,
        exploderSuicide: true // Detonates on contact, killing self
    },

    // Sniper - long range, low HP, repositions after firing
    sniper: {
        health: 45,
        speed: 25,
        detectionRange: 500,
        attackRange: 450,
        damage: 30,
        attackCooldown: 3000,
        attackTellDuration: 500, // long aim-up telegraph
        patrolRadius: 100,
        aggressiveness: 0.2,
        intelligence: 0.9,
        resistances: { chaingun: 0.5, shotgun: 1.5 }, // light armor absorbs rapid fire, weak to close-range spread

        fleeHealthThreshold: 0.5,
        groupBehavior: false,
        callForHelp: false,
        useCover: true,
        retreatBehavior: true,
        rangedAttack: true,
        sniperRelocate: true // Relocates after firing
    },

    // Boss enemy - massive health, multiple attack phases, special attacks
    boss: {
        health: 750,
        speed: 22,
        detectionRange: 500,
        attackRange: 150,
        damage: 40,
        attackCooldown: 2500,
        attackTellDuration: 600, // boss: longer, more dramatic telegraph
        patrolRadius: 40,
        aggressiveness: 1.0,
        intelligence: 0.9,
        resistances: {}, // no resistances — balanced

        fleeHealthThreshold: 0, // Never flees
        groupBehavior: false,
        callForHelp: false,
        useCover: false,
        chargeAttack: true,
        bossPhases: true, // Changes behavior at health thresholds
        summonMinions: true, // Spawns additional enemies
        bossSpecialAttacks: true // Charge rush, ground slam, periodic summon
    }
};

// Enhanced AI behaviors
class EnhancedEnemyAI {
    constructor(enemy, behaviorType = 'guard') {
        this.enemy = enemy;
        this.behavior = { ...EnemyBehaviors[behaviorType] };
        
        // Apply behavior stats to enemy
        this.enemy.health = this.behavior.health;
        this.enemy.maxHealth = this.behavior.health;
        this.enemy.speed = this.behavior.speed;
        this.enemy.detectionRange = this.behavior.detectionRange;
        this.enemy.attackRange = this.behavior.attackRange;
        this.enemy.patrolRadius = this.behavior.patrolRadius;
        this.enemy.attackTellDuration = this.behavior.attackTellDuration || 300;
        
        // AI state tracking
        this.lastAttackTime = 0;
        this.alertLevel = 0; // 0-1, how alerted the enemy is
        this.lastKnownPlayerPos = { x: 0, y: 0 };
        this.helpCalled = false;
        this.coverPosition = null;
        this.strafeDirection = this.random() > 0.5 ? 1 : -1;
        this.fleeTarget = null;

        // Morale system
        this.morale = 1.0; // 1.0 = full courage, 0.0 = broken
        this.moraleRecoveryRate = 0.05; // per second recovery when not stressed
        this.moraleFleeThreshold = 0.3; // flee when morale drops below this

        // Group coordination
        this.groupId = null;
        this.isGroupLeader = false;
        
        console.log(`Enhanced AI initialized for ${behaviorType} enemy`);
    }
    
    update(deltaTime, player, map, allEnemies, nowMs = this.enemy.aiTimeMs) {
        // Update alert level
        this.updateAlertLevel(player);

        // Update morale (recover slowly over time)
        this.updateMorale(deltaTime, player);

        // Clear dead infight targets
        if (this.enemy.infightTarget && (!this.enemy.infightTarget.active || this.enemy.infightTarget.dying)) {
            this.enemy.infightTarget = null;
        }

        // Infighting: chase/attack the enemy that hit us
        if (this.enemy.infightTarget) {
            this.infightBehavior(deltaTime, map);
            this.enhancedMovement(deltaTime, map, allEnemies);
            return;
        }

        // Behavior selection based on current state and behavior type
        switch (this.enemy.state) {
            case 'idle':
                this.idleBehavior(deltaTime, player, map);
                break;
            case 'patrol':
                this.patrolBehavior(deltaTime, player, map);
                break;
            case 'chase':
                this.chaseBehavior(player, deltaTime, map, allEnemies, nowMs);
                break;
            case 'attack':
                this.attackBehavior(player, deltaTime, map, nowMs);
                break;
            case 'flee':
                this.fleeBehavior(player, deltaTime, map);
                break;
            case 'investigate':
                this.investigateBehavior(player, deltaTime, map);
                break;
        }

        // Apply movement with enhanced pathfinding
        this.enhancedMovement(deltaTime, map, allEnemies);
    }

    random() {
        return this.enemy.nextRandom ? this.enemy.nextRandom() : Math.random();
    }

    timeScaledChance(basePerFrameChance, deltaTime, baselineFps = 60) {
        const perSecondRate = basePerFrameChance * baselineFps;
        return 1 - Math.exp(-perSecondRate * deltaTime);
    }
    
    updateAlertLevel(player) {
        const distance = this.getDistanceToPlayer(player);
        
        if (distance < this.enemy.detectionRange) {
            this.alertLevel = Math.min(1, this.alertLevel + 0.02);
            this.lastKnownPlayerPos = { x: player.x, y: player.y };
        } else {
            this.alertLevel = Math.max(0, this.alertLevel - 0.005);
        }
    }
    
    idleBehavior(deltaTime, player, map) {
        const distance = this.getDistanceToPlayer(player);

        if (distance < this.enemy.detectionRange * (1 + this.alertLevel)) {
            if (this.hasLineOfSight(player, map)) {
                this.enemy.state = 'chase';
                if (!this.enemy.hasPlayedAlert) {
                    this.enemy.hasPlayedAlert = true;
                    this.enemy.tryBark('alert');
                }
                this.callForHelpIfNeeded(player);
            } else {
                this.enemy.state = 'investigate';
            }
        } else if (this.random() < this.timeScaledChance(0.001, deltaTime)) {
            this.enemy.state = 'patrol';
        }
    }
    
    patrolBehavior(deltaTime, player, map) {
        // Enhanced patrol with waypoints
        if (!this.enemy.patrolWaypoints) {
            this.generatePatrolWaypoints(map);
        }
        
        // Check for player detection
        const distance = this.getDistanceToPlayer(player);
        if (distance < this.enemy.detectionRange * (0.8 + this.alertLevel * 0.5)) {
            if (this.hasLineOfSight(player, map)) {
                this.enemy.state = 'chase';
                if (!this.enemy.hasPlayedAlert) {
                    this.enemy.hasPlayedAlert = true;
                    this.enemy.tryBark('alert');
                }
                return;
            }
        }
        
        // Continue patrol
        this.followPatrolRoute();
    }
    
    chaseBehavior(player, deltaTime, map, allEnemies, nowMs) {
        const distance = this.getDistanceToPlayer(player);

        // Check if should flee (health OR morale)
        const healthPercent = this.enemy.health / this.enemy.maxHealth;
        if (healthPercent < this.behavior.fleeHealthThreshold || this.morale < this.moraleFleeThreshold) {
            this.enemy.state = 'flee';
            return;
        }

        // Check if lost player
        if (distance > this.enemy.detectionRange * 1.5) {
            if (!this.hasLineOfSight(player, map)) {
                this.enemy.state = 'investigate';
                return;
            }
        }

        // Check if in attack range
        if (distance < this.enemy.attackRange) {
            this.enemy.state = 'attack';
            return;
        }

        // Phantom: update cloak state
        if (this.behavior.phantomCloak) {
            this.enemy.cloaked = (this.enemy.state !== 'attack');
        }

        // Berserker rage during chase
        if (this.behavior.berserkerRage) {
            if (healthPercent < 0.4) {
                this.enemy.speed = this.behavior.speed * 1.6;
                this.rageActive = true;
            }
        }

        // Apply behavior-specific chase logic
        if (this.behavior.swarmBehavior) {
            this.swarmMovement(player, allEnemies);
        } else if (this.behavior.strafeBehavior) {
            this.strafeMovement(player, deltaTime);
        } else if (this.hasLineOfSight(player, map)) {
            // Direct line of sight - move straight toward player
            this.enemy.targetX = player.x;
            this.enemy.targetY = player.y;
            this.enemy.currentPath = null;
        } else {
            // No line of sight - use A* pathfinding
            this.followPath(player, map, nowMs);
        }
    }
    
    attackBehavior(player, deltaTime, map, nowMs) {
        const distance = this.getDistanceToPlayer(player);
        const now = nowMs;

        // Check morale - flee if broken
        if (this.morale < this.moraleFleeThreshold) {
            this.enemy.state = 'flee';
            return;
        }

        // Berserker rage - boost speed and damage at low health
        if (this.behavior.berserkerRage) {
            const healthPercent = this.enemy.health / this.enemy.maxHealth;
            if (healthPercent < 0.4) {
                this.enemy.speed = this.behavior.speed * 1.6;
                this.rageActive = true;
            }
        }

        // Boss phase transitions
        if (this.behavior.bossPhases) {
            this.updateBossPhase(player, map);
        }

        // Boss special attacks (checked before normal attack)
        if (this.behavior.bossSpecialAttacks) {
            if (this.updateBossSpecialAttack(player, deltaTime, map, nowMs)) {
                return; // Special attack in progress, skip normal attack
            }
        }

        // Check if should retreat to maintain distance
        if (this.behavior.retreatBehavior && distance < this.enemy.attackRange * 0.6) {
            const retreatAngle = Math.atan2(this.enemy.y - player.y, this.enemy.x - player.x);
            this.enemy.targetX = this.enemy.x + Math.cos(retreatAngle) * 40;
            this.enemy.targetY = this.enemy.y + Math.sin(retreatAngle) * 40;
        } else if (this.behavior.chargeAttack && distance > this.enemy.attackRange * 0.8) {
            // Charge at player
            this.enemy.targetX = player.x;
            this.enemy.targetY = player.y;
        }

        // Perform attack if cooldown is ready
        if (now - this.lastAttackTime > this.behavior.attackCooldown) {
            this.performAttack(player);
            this.lastAttackTime = now;
        }

        // Check if player moved out of range
        if (distance > this.enemy.attackRange * 1.2) {
            this.enemy.state = 'chase';
        }
    }
    
    fleeBehavior(player, deltaTime, map) {
        // Morale recovers faster while fleeing (relief from disengagement)
        this.morale += 0.1 * deltaTime;
        this.morale = Math.min(1, this.morale);

        // Find safe retreat position
        if (!this.fleeTarget) {
            this.findFleeTarget(player, map);
        }

        this.enemy.targetX = this.fleeTarget.x;
        this.enemy.targetY = this.fleeTarget.y;

        // Check if reached safety, health improved, or morale rallied
        const distance = Math.sqrt((this.enemy.x - this.fleeTarget.x) ** 2 +
                                 (this.enemy.y - this.fleeTarget.y) ** 2);

        const healthPercent = this.enemy.health / this.enemy.maxHealth;
        const rallied = this.morale > this.moraleFleeThreshold + 0.2;
        if (distance < 20 || healthPercent > this.behavior.fleeHealthThreshold + 0.1 || rallied) {
            this.enemy.state = 'patrol';
            this.fleeTarget = null;
        }
    }
    
    investigateBehavior(player, deltaTime, map) {
        // Move to last known player position
        this.enemy.targetX = this.lastKnownPlayerPos.x;
        this.enemy.targetY = this.lastKnownPlayerPos.y;
        
        const distance = Math.sqrt(
            (this.enemy.x - this.enemy.targetX) ** 2 + 
            (this.enemy.y - this.enemy.targetY) ** 2
        );
        
        // If reached investigation point and no player found
        if (distance < 30) {
            this.enemy.state = 'patrol';
        }
        
        // Still check for player detection
        const playerDistance = this.getDistanceToPlayer(player);
        if (playerDistance < this.enemy.detectionRange && this.hasLineOfSight(player, map)) {
            this.enemy.state = 'chase';
        }
    }
    
    enhancedMovement(deltaTime, map, allEnemies) {
        const dx = this.enemy.targetX - this.enemy.x;
        const dy = this.enemy.targetY - this.enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            const prevX = this.enemy.x;
            const prevY = this.enemy.y;

            let moveDistance = this.enemy.speed * deltaTime;

            // Apply aggressiveness modifier
            if (this.enemy.state === 'chase' || this.enemy.state === 'attack') {
                moveDistance *= (0.5 + this.behavior.aggressiveness * 0.5);
            }

            let moveX = (dx / distance) * moveDistance;
            let moveY = (dy / distance) * moveDistance;

            // Apply separation from other enemies to prevent clustering
            if (this.behavior.groupBehavior) {
                const separation = this.calculateSeparation(allEnemies);
                moveX += separation.x;
                moveY += separation.y;
            }

            // Enhanced collision detection
            const newX = this.enemy.x + moveX;
            const newY = this.enemy.y + moveY;

            if (this.canMoveTo(newX, this.enemy.y, map)) {
                this.enemy.x = newX;
            } else if (this.behavior.intelligence > 0.5) {
                this.enemy.x += this.findAlternatePath(moveX, 0, map).x;
            }

            if (this.canMoveTo(this.enemy.x, newY, map)) {
                this.enemy.y = newY;
            } else if (this.behavior.intelligence > 0.5) {
                this.enemy.y += this.findAlternatePath(0, moveY, map).y;
            }

            // Stuck detection - if barely moved, force path recalculation
            const movedDist = Math.sqrt((this.enemy.x - prevX) ** 2 + (this.enemy.y - prevY) ** 2);
            if (movedDist < 0.1) {
                if (!this.stuckCounter) this.stuckCounter = 0;
                this.stuckCounter++;
                if (this.stuckCounter > 30) {
                    // Force new pathfinding
                    this.enemy.currentPath = null;
                    this.lastPathTime = 0;
                    this.stuckCounter = 0;
                }
            } else {
                this.stuckCounter = 0;
            }
        }
    }
    
    followPath(player, map, nowMs) {
        const now = nowMs;
        // Recalculate path every 500ms to avoid expensive recomputation each frame
        if (!this.enemy.currentPath || !this.lastPathTime || now - this.lastPathTime > 500) {
            this.enemy.currentPath = map.findPath(this.enemy.x, this.enemy.y, player.x, player.y);
            this.enemy.pathIndex = 0;
            this.lastPathTime = now;
        }

        if (this.enemy.currentPath && this.enemy.currentPath.length > 0) {
            const waypoint = this.enemy.currentPath[this.enemy.pathIndex];
            if (waypoint) {
                this.enemy.targetX = waypoint.x;
                this.enemy.targetY = waypoint.y;

                // Advance to next waypoint when close enough
                const dx = this.enemy.x - waypoint.x;
                const dy = this.enemy.y - waypoint.y;
                if (Math.sqrt(dx * dx + dy * dy) < 20) {
                    this.enemy.pathIndex++;
                    if (this.enemy.pathIndex >= this.enemy.currentPath.length) {
                        this.enemy.currentPath = null; // Path completed
                    }
                }
            }
        } else {
            // Fallback: move toward player directly
            this.enemy.targetX = player.x;
            this.enemy.targetY = player.y;
        }
    }

    // Utility methods
    swarmMovement(player, allEnemies) {
        // Try to position around player with other swarming enemies
        const swarmEnemies = allEnemies.filter(e => 
            e.active && e !== this.enemy && 
            this.getDistanceBetween(e, this.enemy) < 100
        );
        
        const angle = Math.atan2(player.y - this.enemy.y, player.x - this.enemy.x);
        const swarmOffset = swarmEnemies.length * 0.5; // Spread around player
        
        this.enemy.targetX = player.x + Math.cos(angle + swarmOffset) * 60;
        this.enemy.targetY = player.y + Math.sin(angle + swarmOffset) * 60;
    }
    
    strafeMovement(player, deltaTime) {
        const angle = Math.atan2(player.y - this.enemy.y, player.x - this.enemy.x);
        const strafeAngle = angle + (Math.PI / 2) * this.strafeDirection;
        
        this.enemy.targetX = this.enemy.x + Math.cos(strafeAngle) * 30;
        this.enemy.targetY = this.enemy.y + Math.sin(strafeAngle) * 30;
        
        // Time-scaled random turn to avoid frame-rate-dependent behavior.
        if (this.random() < this.timeScaledChance(0.02, deltaTime)) {
            this.strafeDirection *= -1;
        }
    }
    
    calculateSeparation(allEnemies) {
        const separationRadius = 40;
        let separationX = 0;
        let separationY = 0;
        
        allEnemies.forEach(other => {
            if (other.active && !other.dying && other !== this.enemy) {
                const dx = this.enemy.x - other.x;
                const dy = this.enemy.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < separationRadius && distance > 0) {
                    const separationForce = (separationRadius - distance) / separationRadius;
                    separationX += (dx / distance) * separationForce * 10;
                    separationY += (dy / distance) * separationForce * 10;
                }
            }
        });
        
        return { x: separationX, y: separationY };
    }
    
    infightBehavior(deltaTime, map, nowMs = this.enemy.aiTimeMs) {
        const target = this.enemy.infightTarget;
        const dx = target.x - this.enemy.x;
        const dy = target.y - this.enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.enemy.attackRange) {
            // Attack the infight target
            const now = nowMs;
            if (now - this.lastAttackTime > this.behavior.attackCooldown) {
                this.lastAttackTime = now;
                let damage = this.behavior.damage;
                if (this.behavior.berserkerRage && this.rageActive) {
                    damage = Math.round(damage * 2);
                }

                this.enemy.tryBark('attack');

                // Ranged enemies fire projectiles at infight target
                if (this.behavior.rangedAttack || this.behavior.strafeBehavior) {
                    if (window.game && window.game.projectileManager) {
                        const speed = this.behavior.rangedAttack ? 150 : 200;
                        const color = this.behavior.rangedAttack ? '#44FF44' : '#FFAA00';
                        window.game.projectileManager.spawn(
                            this.enemy.x, this.enemy.y,
                            target.x, target.y,
                            damage, speed, color, this.enemy
                        );
                    }
                } else {
                    // Melee attack on infight target
                    target.takeDamage(damage, this.enemy);
                    if (window.game && window.game.hud) {
                        window.game.hud.addDamageNumber(target.x, target.y, damage, false);
                        window.game.hud.emitBloodParticles(target.x, target.y, 5);
                    }
                }
            }
        } else {
            // Chase the infight target
            this.enemy.targetX = target.x;
            this.enemy.targetY = target.y;
        }
    }

    performAttack(player) {
        // Exploder: suicide attack - deal splash damage and die
        if (this.behavior.exploderSuicide) {
            const dist = this.getDistanceToPlayer(player);
            if (dist < this.enemy.attackRange * 1.5) {
                this.enemy.tryBark('attack');
                const damage = this.behavior.damage;
                if (player.takeDamage(damage)) {
                    if (window.game && window.game.hud) {
                        window.game.hud.onPlayerDamageFrom(this.enemy.x, this.enemy.y, damage);
                        window.game.hud.triggerScreenShake(15);
                    }
                    if (window.soundEngine && window.soundEngine.isInitialized) {
                        window.soundEngine.playPlayerHit();
                    }
                    if (player.applyKnockback) {
                        player.applyKnockback(this.enemy.x, this.enemy.y, 500);
                    }
                }
                // Explosion effects
                if (window.game && window.game.hud) {
                    window.game.hud.emitBloodParticles(this.enemy.x, this.enemy.y, 20);
                    window.game.hud.triggerScreenShake(12);
                }
                if (window.soundEngine && window.soundEngine.isInitialized) {
                    window.soundEngine.playExplosion();
                }
                // Kill self
                this.enemy.health = 0;
                this.enemy.dying = true;
                this.enemy.deathTime = this.enemy.aiTimeMs;
                this.enemy.state = 'dying';
            }
            return;
        }

        if (this.hasLineOfSight(player, window.game.map)) {
            let damage = this.behavior.damage;

            // Berserker rage: double damage when below 40% health
            if (this.behavior.berserkerRage && this.rageActive) {
                damage = Math.round(damage * 2);
            }

            // Ranged enemies telegraph before firing (aim-up wind-up)
            if (this.behavior.rangedAttack || this.behavior.strafeBehavior) {
                const now = this.enemy.aiTimeMs;
                const tellDuration = this.enemy.attackTellDuration || 300;
                this.enemy.attackTellTime = now;

                // Warning sound
                if (window.soundEngine && window.soundEngine.isInitialized && window.soundEngine.playAttackWarning) {
                    window.soundEngine.playAttackWarning();
                }

                // Delay projectile by telegraph duration
                this.enemy.scheduleDeferredAction(() => {
                    if (!this.enemy.active || this.enemy.dying || !this.enemy.isInActiveMap()) return;
                    if (!this.hasLineOfSight(player, window.game.map)) return;
                    this.enemy.tryBark('attack');
                    if (window.game && window.game.projectileManager) {
                        const speed = this.behavior.rangedAttack ? 150 : 200;
                        const color = this.behavior.rangedAttack ? '#44FF44' : '#FFAA00';
                        window.game.projectileManager.spawn(
                            this.enemy.x, this.enemy.y,
                            player.x, player.y,
                            damage, speed, color, this.enemy
                        );
                        if (window.soundEngine && window.soundEngine.isInitialized) {
                            this.playAttackSound();
                        }

                        // Sniper: relocate after firing
                        if (this.behavior.sniperRelocate) {
                            const relocAngle = this.random() * Math.PI * 2;
                            const relocDist = 100 + this.random() * 80;
                            this.enemy.targetX = this.enemy.x + Math.cos(relocAngle) * relocDist;
                            this.enemy.targetY = this.enemy.y + Math.sin(relocAngle) * relocDist;
                            this.enemy.state = 'chase';
                        }
                    }
                }, tellDuration);
                return;
            }

            // Melee attack with telegraph
            const now = this.enemy.aiTimeMs;
            this.enemy.attackTellTime = now;

            // Warning sound
            if (window.soundEngine && window.soundEngine.isInitialized && window.soundEngine.playAttackWarning) {
                window.soundEngine.playAttackWarning();
            }

            // Delay melee attack by telegraph duration
            const tellDuration = this.enemy.attackTellDuration || 300;
            const finalDamage = damage;
            this.enemy.scheduleDeferredAction(() => {
                if (!this.enemy.active || this.enemy.dying || !this.enemy.isInActiveMap()) return;
                const dist = this.getDistanceToPlayer(player);
                if (dist > this.enemy.attackRange * 1.5) return;

                this.enemy.tryBark('attack');

                if (player.takeDamage(finalDamage)) {
                    if (window.game && window.game.hud) {
                        window.game.hud.onPlayerDamageFrom(this.enemy.x, this.enemy.y, finalDamage);
                        window.game.hud.triggerScreenShake(8);
                    }
                    if (window.soundEngine && window.soundEngine.isInitialized) {
                        this.playAttackSound();
                        window.soundEngine.playPlayerHit();
                    }
                    // Melee knockback
                    if (player.applyKnockback) {
                        player.applyKnockback(this.enemy.x, this.enemy.y, 300);
                    }
                }
            }, tellDuration);
        }
    }
    
    playAttackSound() {
        const now = window.soundEngine.audioContext.currentTime;
        const oscillator = window.soundEngine.audioContext.createOscillator();
        const gainNode = window.soundEngine.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(window.soundEngine.masterGain);
        
        // Aggressive attack sound
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }
    
    callForHelpIfNeeded(player) {
        if (!this.helpCalled) {
            this.helpCalled = true;
            // Propagate alert to nearby enemies
            this.alertNearbyEnemies(player);
        }
    }

    alertNearbyEnemies(player) {
        const now = this.enemy.aiTimeMs;
        // Cooldown: don't spam alerts (3 seconds)
        if (now - this.enemy.lastAlertPropagation < 3000) return;
        this.enemy.lastAlertPropagation = now;

        if (!window.game || !window.game.map) return;
        const allEnemies = window.game.map.enemies;
        const alertRadius = 5 * (window.game.map.tileSize || 64); // 5 tiles

        for (const other of allEnemies) {
            if (other === this.enemy) continue;
            if (!other.active || other.dying) continue;
            // Only alert idle/patrol enemies (already engaged enemies don't need alerting)
            if (other.state !== 'idle' && other.state !== 'patrol') continue;

            const dx = other.x - this.enemy.x;
            const dy = other.y - this.enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < alertRadius) {
                // Alert the other enemy
                other.alertedTime = now;
                other.alertIndicatorTime = now;
                other.lastPlayerX = player.x;
                other.lastPlayerY = player.y;
                other.state = 'chase';
                other.hasPlayedAlert = true;

                // If other enemy has enhanced AI, update its state too
                if (other.enhancedAI) {
                    other.enhancedAI.alertLevel = Math.max(other.enhancedAI.alertLevel, 0.7);
                    other.enhancedAI.lastKnownPlayerPos = { x: player.x, y: player.y };
                }
            }
        }

        // Play alert bark sound
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playAlertBark(this.enemy.type);
        }
    }
    
    // Utility functions
    getDistanceToPlayer(player) {
        return this.enemy.getDistanceToPlayer(player);
    }
    
    getDistanceBetween(enemy1, enemy2) {
        const dx = enemy1.x - enemy2.x;
        const dy = enemy1.y - enemy2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    hasLineOfSight(player, map) {
        return this.enemy.hasLineOfSight(player, map);
    }
    
    canMoveTo(x, y, map) {
        return !map.isWallAtPosition(x, y);
    }
    
    findAlternatePath(moveX, moveY, map) {
        // Simple pathfinding - try perpendicular directions
        const alternates = [
            { x: moveY, y: -moveX }, // 90 degrees
            { x: -moveY, y: moveX }, // -90 degrees
        ];
        
        for (const alt of alternates) {
            if (this.canMoveTo(this.enemy.x + alt.x, this.enemy.y + alt.y, map)) {
                return { x: alt.x * 0.7, y: alt.y * 0.7 }; // Reduced movement
            }
        }
        
        return { x: 0, y: 0 };
    }
    
    generatePatrolWaypoints(map) {
        // Generate 3-5 patrol points near starting position
        const waypointCount = 3 + Math.floor(this.random() * 3);
        this.enemy.patrolWaypoints = [];
        
        for (let i = 0; i < waypointCount; i++) {
            const angle = (i / waypointCount) * Math.PI * 2;
            const radius = this.enemy.patrolRadius * (0.5 + this.random() * 0.5);
            
            const x = this.enemy.homeX + Math.cos(angle) * radius;
            const y = this.enemy.homeY + Math.sin(angle) * radius;
            
            if (!map.isWallAtPosition(x, y)) {
                this.enemy.patrolWaypoints.push({ x, y });
            }
        }
        
        this.enemy.currentWaypoint = 0;
    }
    
    followPatrolRoute() {
        if (!this.enemy.patrolWaypoints || this.enemy.patrolWaypoints.length === 0) return;
        
        const target = this.enemy.patrolWaypoints[this.enemy.currentWaypoint];
        this.enemy.targetX = target.x;
        this.enemy.targetY = target.y;
        
        const distance = Math.sqrt(
            (this.enemy.x - target.x) ** 2 + 
            (this.enemy.y - target.y) ** 2
        );
        
        if (distance < 20) {
            this.enemy.currentWaypoint = (this.enemy.currentWaypoint + 1) % this.enemy.patrolWaypoints.length;
        }
    }
    
    updateBossPhase(player, map) {
        const healthPercent = this.enemy.health / this.enemy.maxHealth;
        const prevPhase = this.bossPhase || 1;

        if (healthPercent > 0.6) {
            this.bossPhase = 1;
        } else if (healthPercent > 0.3) {
            this.bossPhase = 2;
        } else {
            this.bossPhase = 3;
        }

        // Phase transition effects
        if (this.bossPhase !== prevPhase) {
            this.enemy.hitFlashTime = this.enemy.aiTimeMs; // Visual indicator

            if (this.bossPhase === 2) {
                // Phase 2: faster attacks
                this.behavior.attackCooldown = 1800;
                this.enemy.speed = this.behavior.speed * 1.3;
            } else if (this.bossPhase === 3) {
                // Phase 3: enraged - faster and more damage
                this.behavior.attackCooldown = 1200;
                this.behavior.damage = 55;
                this.enemy.speed = this.behavior.speed * 1.6;

                // Summon minions on entering phase 3
                if (this.behavior.summonMinions && map) {
                    this.summonMinions(map);
                }
            }
        }
    }

    summonMinions(map) {
        // Spawn 2 imps near the boss
        for (let i = 0; i < 2; i++) {
            const angle = (i / 2) * Math.PI * 2 + this.random();
            const spawnX = this.enemy.x + Math.cos(angle) * 80;
            const spawnY = this.enemy.y + Math.sin(angle) * 80;

            if (!map.isWallAtPosition(spawnX, spawnY)) {
                const minion = new Enemy(spawnX, spawnY, 'imp');
                minion.state = 'chase';
                map.enemies.push(minion);
                console.log('Boss summoned a minion!');
            }
        }
    }

    // Boss special attack system
    updateBossSpecialAttack(player, deltaTime, map, nowMs = this.enemy.aiTimeMs) {
        const now = nowMs;
        if (!this.bossSpecialCooldown) this.bossSpecialCooldown = 0;
        if (!this.bossSpecialState) this.bossSpecialState = 'idle'; // idle, telegraph, executing

        // Handle active special attack execution
        if (this.bossSpecialState === 'executing') {
            return this.executeBossSpecial(player, deltaTime, map, now);
        }

        // Telegraph phase: boss is winding up
        if (this.bossSpecialState === 'telegraph') {
            if (now - this.bossSpecialTelegraphStart >= 800) {
                    this.bossSpecialState = 'executing';
                    this.bossSpecialExecStart = now;
                }
                return true; // Block normal attacks during telegraph
            }

        // Check cooldown for next special
        const specialInterval = this.bossPhase === 3 ? 6000 : this.bossPhase === 2 ? 8000 : 10000;
        if (now - this.bossSpecialCooldown < specialInterval) return false;

        // Pick a special attack
        const distance = this.getDistanceToPlayer(player);
        const phase = this.bossPhase || 1;
        let specials = [];

        // Ground slam: close range
        if (distance < 200) specials.push('slam');
        // Charge rush: medium-far range
        if (distance > 100 && distance < 400) specials.push('charge');
        // Summon: phase 2+, prefer when few minions alive
        if (phase >= 2 && map) {
            const minionCount = map.enemies.filter(e => e.active && !e.dying && e.type !== 'boss').length;
            if (minionCount < 4) specials.push('summon');
        }

        if (specials.length === 0) return false;

        // Start telegraph
        this.bossCurrentSpecial = specials[Math.floor(this.random() * specials.length)];
        this.bossSpecialState = 'telegraph';
        this.bossSpecialTelegraphStart = now;
        this.bossSpecialCooldown = now;
        this.enemy.bossSpecialTelegraph = this.bossCurrentSpecial; // for HUD

        // Telegraph sound
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playBossTelegraph(this.bossCurrentSpecial);
        }

        return true;
    }

    executeBossSpecial(player, deltaTime, map, nowMs = this.enemy.aiTimeMs) {
        const now = nowMs;
        const elapsed = now - this.bossSpecialExecStart;
        const special = this.bossCurrentSpecial;

        if (special === 'charge') {
            return this.executeBossCharge(player, deltaTime, map, elapsed);
        } else if (special === 'slam') {
            return this.executeBossSlam(player, deltaTime, map, elapsed);
        } else if (special === 'summon') {
            return this.executeBossSummon(player, map, elapsed);
        }

        this.endBossSpecial();
        return false;
    }

    executeBossCharge(player, deltaTime, map, elapsed) {
        const chargeDuration = 600;
        if (elapsed >= chargeDuration) {
            this.endBossSpecial();
            return false;
        }

        // Rush toward player at 3x speed
        const chargeSpeed = this.behavior.speed * 3;
        const dx = player.x - this.enemy.x;
        const dy = player.y - this.enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
            const moveX = (dx / dist) * chargeSpeed * deltaTime;
            const moveY = (dy / dist) * chargeSpeed * deltaTime;
            if (map && !map.isWallAtPosition(this.enemy.x + moveX, this.enemy.y)) {
                this.enemy.x += moveX;
            }
            if (map && !map.isWallAtPosition(this.enemy.x, this.enemy.y + moveY)) {
                this.enemy.y += moveY;
            }
        }

        // Check collision with player
        if (dist < 50) {
            const chargeDamage = 50;
            if (player.takeDamage(chargeDamage)) {
                if (window.game && window.game.hud) {
                    window.game.hud.onPlayerDamageFrom(this.enemy.x, this.enemy.y, chargeDamage);
                    window.game.hud.triggerScreenShake(15);
                    window.game.hud.addKillFeedMessage('BOSS CHARGE!', '#FF4400');
                }
                if (player.applyKnockback) {
                    player.applyKnockback(this.enemy.x, this.enemy.y, 600);
                }
                if (window.soundEngine && window.soundEngine.isInitialized) {
                    window.soundEngine.playPlayerHit();
                }
            }
            this.endBossSpecial();
            return false;
        }

        return true;
    }

    executeBossSlam(player, deltaTime, map, elapsed) {
        if (elapsed >= 200) {
            // Slam executes instantly after brief delay
            const distance = this.getDistanceToPlayer(player);
            const slamRadius = 160;
            const slamDamage = 35;

            if (distance < slamRadius) {
                // Damage falls off with distance
                const falloff = 1 - (distance / slamRadius);
                const damage = Math.round(slamDamage * falloff);
                if (player.takeDamage(damage)) {
                    if (window.game && window.game.hud) {
                        window.game.hud.onPlayerDamageFrom(this.enemy.x, this.enemy.y, damage);
                        window.game.hud.addKillFeedMessage('BOSS SLAM!', '#FF8800');
                    }
                    if (player.applyKnockback) {
                        player.applyKnockback(this.enemy.x, this.enemy.y, 400);
                    }
                }
            }

            // Visual + audio
            if (window.game && window.game.hud) {
                window.game.hud.triggerScreenShake(20);
                window.game.hud.emitBloodParticles(this.enemy.x, this.enemy.y, 10);
            }
            if (window.soundEngine && window.soundEngine.isInitialized) {
                window.soundEngine.playBossSlam();
            }

            this.endBossSpecial();
            return false;
        }
        return true;
    }

    executeBossSummon(player, map, elapsed) {
        if (elapsed >= 300) {
            const count = (this.bossPhase || 1) >= 3 ? 3 : 2;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + this.random() * 0.5;
                const spawnX = this.enemy.x + Math.cos(angle) * 90;
                const spawnY = this.enemy.y + Math.sin(angle) * 90;
                if (map && !map.isWallAtPosition(spawnX, spawnY)) {
                    const type = this.random() < 0.5 ? 'imp' : 'guard';
                    const minion = new Enemy(spawnX, spawnY, type);
                    minion.state = 'chase';
                    map.enemies.push(minion);
                }
            }

            if (window.game && window.game.hud) {
                window.game.hud.addKillFeedMessage('BOSS SUMMONS MINIONS!', '#FF00FF');
                window.game.hud.triggerScreenShake(6);
            }
            if (window.soundEngine && window.soundEngine.isInitialized) {
                window.soundEngine.playBossSummon();
            }

            this.endBossSpecial();
            return false;
        }
        return true;
    }

    endBossSpecial() {
        this.bossSpecialState = 'idle';
        this.bossCurrentSpecial = null;
        this.enemy.bossSpecialTelegraph = null;
    }

    updateMorale(deltaTime, player) {
        const type = this.enemy.type;
        // Bosses and berserkers are immune to morale loss
        if (type === 'boss' || type === 'berserker') {
            this.morale = 1.0;
            return;
        }

        // Player combo pressure: reduce morale when player is on a kill streak
        if (player.comboCount && player.comboCount >= 3) {
            this.morale -= 0.02 * deltaTime;
        }

        // Low health amplifies morale loss
        const healthPct = this.enemy.health / this.enemy.maxHealth;
        if (healthPct < 0.4) {
            this.morale -= 0.03 * deltaTime;
        }

        // Slowly recover morale when not under immediate stress
        if (healthPct > 0.5 && (!player.comboCount || player.comboCount < 2)) {
            this.morale += this.moraleRecoveryRate * deltaTime;
        }

        this.morale = Math.max(0, Math.min(1, this.morale));
    }

    onNearbyAllyDeath() {
        const type = this.enemy.type;
        // Bosses and berserkers are immune
        if (type === 'boss' || type === 'berserker') return;
        // Enraged elites get a morale boost instead
        if (this.enemy.isElite && this.enemy.eliteType === 'enraged') {
            this.morale = Math.min(1, this.morale + 0.15);
            return;
        }
        this.morale -= 0.2;
        this.morale = Math.max(0, this.morale);
    }

    findFleeTarget(player, map) {
        // Find position away from player
        const fleeAngle = Math.atan2(this.enemy.y - player.y, this.enemy.x - player.x);
        const fleeDistance = 150;
        
        this.fleeTarget = {
            x: this.enemy.x + Math.cos(fleeAngle) * fleeDistance,
            y: this.enemy.y + Math.sin(fleeAngle) * fleeDistance
        };
        
        // Ensure flee target is valid
        if (map.isWallAtPosition(this.fleeTarget.x, this.fleeTarget.y)) {
            this.fleeTarget = { x: this.enemy.homeX, y: this.enemy.homeY };
        }
    }
}

// Elite variant definitions
const EliteVariants = {
    armored: {
        healthMult: 1.5,
        speedMult: 0.9,
        damageMult: 1.0,
        resistanceOverride: null, // Uses base resistances but adds 0.5x to all non-explosive
        tintColor: '#6688ff', // Blue tint
        label: 'ARMORED'
    },
    enraged: {
        healthMult: 0.75,
        speedMult: 1.5,
        damageMult: 1.5,
        resistanceOverride: null,
        tintColor: '#ff4444', // Bright red tint
        label: 'ENRAGED'
    },
    regenerating: {
        healthMult: 1.0,
        speedMult: 1.0,
        damageMult: 1.0,
        regenRate: 5, // HP per second
        resistanceOverride: null,
        tintColor: '#44ff44', // Green tint
        label: 'REGEN'
    }
};

// Apply elite modifiers to an enemy after creation
function applyEliteVariant(enemy, variantType) {
    const variant = EliteVariants[variantType];
    if (!variant) return;

    enemy.isElite = true;
    enemy.eliteType = variantType;

    // Scale health
    enemy.health = Math.round(enemy.health * variant.healthMult);
    enemy.maxHealth = Math.round(enemy.maxHealth * variant.healthMult);

    // Scale speed
    enemy.speed = Math.round(enemy.speed * variant.speedMult);

    // Scale damage via enhanced AI behavior
    if (enemy.enhancedAI && enemy.enhancedAI.behavior) {
        enemy.enhancedAI.behavior.damage = Math.round(
            enemy.enhancedAI.behavior.damage * variant.damageMult
        );
    }

    // Armored: add resistance to non-explosive weapons
    if (variantType === 'armored' && enemy.enhancedAI && enemy.enhancedAI.behavior) {
        const res = enemy.enhancedAI.behavior.resistances;
        const armorTypes = ['pistol', 'rifle', 'chaingun', 'melee'];
        for (const wt of armorTypes) {
            if (!res[wt] || res[wt] >= 1.0) {
                res[wt] = 0.5;
            }
        }
    }

    // Regenerating: store regen rate on enemy
    if (variantType === 'regenerating') {
        enemy.regenRate = variant.regenRate;
    }

    // Enraged: never flee (neither from health nor morale)
    if (variantType === 'enraged' && enemy.enhancedAI) {
        if (enemy.enhancedAI.behavior) enemy.enhancedAI.behavior.fleeHealthThreshold = 0;
        enemy.enhancedAI.moraleFleeThreshold = 0;
    }
}

// Export to global scope
window.EnemyBehaviors = EnemyBehaviors;
window.EnhancedEnemyAI = EnhancedEnemyAI;
window.EliteVariants = EliteVariants;
window.applyEliteVariant = applyEliteVariant;
