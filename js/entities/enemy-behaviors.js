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
        patrolRadius: 80,
        aggressiveness: 0.5,
        intelligence: 0.6,
        
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
        patrolRadius: 120,
        aggressiveness: 0.8,
        intelligence: 0.3,
        
        fleeHealthThreshold: 0.3,
        groupBehavior: true,
        callForHelp: false,
        useCover: false,
        swarmBehavior: true // Tries to surround player
    },
    
    // Slow, tanky enemies
    demon: {
        health: 150,
        speed: 15,
        detectionRange: 300,
        attackRange: 80,
        damage: 35,
        attackCooldown: 3000,
        patrolRadius: 60,
        aggressiveness: 0.9,
        intelligence: 0.4,
        
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
        patrolRadius: 100,
        aggressiveness: 0.3,
        intelligence: 0.9,

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
        patrolRadius: 100,
        aggressiveness: 0.9,
        intelligence: 0.3,

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
        patrolRadius: 60,
        aggressiveness: 0.4,
        intelligence: 0.7,

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
        patrolRadius: 60,
        aggressiveness: 0.6,
        intelligence: 0.8,

        fleeHealthThreshold: 0.1,
        groupBehavior: true,
        callForHelp: true,
        useCover: false,
        frontShield: true // 70% damage reduction from front
    },

    // Boss enemy - massive health, multiple attack phases
    boss: {
        health: 500,
        speed: 22,
        detectionRange: 500,
        attackRange: 150,
        damage: 40,
        attackCooldown: 2500,
        patrolRadius: 40,
        aggressiveness: 1.0,
        intelligence: 0.9,

        fleeHealthThreshold: 0, // Never flees
        groupBehavior: false,
        callForHelp: false,
        useCover: false,
        chargeAttack: true,
        bossPhases: true, // Changes behavior at health thresholds
        summonMinions: true // Spawns additional enemies
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
        
        // AI state tracking
        this.lastAttackTime = 0;
        this.alertLevel = 0; // 0-1, how alerted the enemy is
        this.lastKnownPlayerPos = { x: 0, y: 0 };
        this.helpCalled = false;
        this.coverPosition = null;
        this.strafeDirection = Math.random() > 0.5 ? 1 : -1;
        this.fleeTarget = null;
        
        // Group coordination
        this.groupId = null;
        this.isGroupLeader = false;
        
        console.log(`Enhanced AI initialized for ${behaviorType} enemy`);
    }
    
    update(deltaTime, player, map, allEnemies) {
        // Update alert level
        this.updateAlertLevel(player);
        
        // Behavior selection based on current state and behavior type
        switch (this.enemy.state) {
            case 'idle':
                this.idleBehavior(player, map);
                break;
            case 'patrol':
                this.patrolBehavior(deltaTime, player, map);
                break;
            case 'chase':
                this.chaseBehavior(player, deltaTime, map, allEnemies);
                break;
            case 'attack':
                this.attackBehavior(player, deltaTime, map);
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
    
    updateAlertLevel(player) {
        const distance = this.getDistanceToPlayer(player);
        
        if (distance < this.enemy.detectionRange) {
            this.alertLevel = Math.min(1, this.alertLevel + 0.02);
            this.lastKnownPlayerPos = { x: player.x, y: player.y };
        } else {
            this.alertLevel = Math.max(0, this.alertLevel - 0.005);
        }
    }
    
    idleBehavior(player, map) {
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
        } else if (Math.random() < 0.001) { // Random patrol chance
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
    
    chaseBehavior(player, deltaTime, map, allEnemies) {
        const distance = this.getDistanceToPlayer(player);

        // Check if should flee
        const healthPercent = this.enemy.health / this.enemy.maxHealth;
        if (healthPercent < this.behavior.fleeHealthThreshold) {
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
            this.strafeMovement(player);
        } else if (this.hasLineOfSight(player, map)) {
            // Direct line of sight - move straight toward player
            this.enemy.targetX = player.x;
            this.enemy.targetY = player.y;
            this.enemy.currentPath = null;
        } else {
            // No line of sight - use A* pathfinding
            this.followPath(player, map);
        }
    }
    
    attackBehavior(player, deltaTime, map) {
        const distance = this.getDistanceToPlayer(player);
        const now = Date.now();

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
        // Find safe retreat position
        if (!this.fleeTarget) {
            this.findFleeTarget(player, map);
        }
        
        this.enemy.targetX = this.fleeTarget.x;
        this.enemy.targetY = this.fleeTarget.y;
        
        // Check if reached safety or health improved
        const distance = Math.sqrt((this.enemy.x - this.fleeTarget.x) ** 2 + 
                                 (this.enemy.y - this.fleeTarget.y) ** 2);
        
        const healthPercent = this.enemy.health / this.enemy.maxHealth;
        if (distance < 20 || healthPercent > this.behavior.fleeHealthThreshold + 0.1) {
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
    
    followPath(player, map) {
        const now = Date.now();
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
    
    strafeMovement(player) {
        const angle = Math.atan2(player.y - this.enemy.y, player.x - this.enemy.x);
        const strafeAngle = angle + (Math.PI / 2) * this.strafeDirection;
        
        this.enemy.targetX = this.enemy.x + Math.cos(strafeAngle) * 30;
        this.enemy.targetY = this.enemy.y + Math.sin(strafeAngle) * 30;
        
        // Randomly change strafe direction
        if (Math.random() < 0.02) {
            this.strafeDirection *= -1;
        }
    }
    
    calculateSeparation(allEnemies) {
        const separationRadius = 40;
        let separationX = 0;
        let separationY = 0;
        
        allEnemies.forEach(other => {
            if (other.active && other !== this.enemy) {
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
    
    performAttack(player) {
        if (this.hasLineOfSight(player, window.game.map)) {
            this.enemy.tryBark('attack');
            let damage = this.behavior.damage;

            // Berserker rage: double damage when below 40% health
            if (this.behavior.berserkerRage && this.rageActive) {
                damage = Math.round(damage * 2);
            }

            // Ranged enemies fire projectiles instead of hitscan
            if (this.behavior.rangedAttack || this.behavior.strafeBehavior) {
                if (window.game && window.game.projectileManager) {
                    const speed = this.behavior.rangedAttack ? 150 : 200;
                    const color = this.behavior.rangedAttack ? '#44FF44' : '#FFAA00';
                    window.game.projectileManager.spawn(
                        this.enemy.x, this.enemy.y,
                        player.x, player.y,
                        damage, speed, color, this.enemy
                    );
                    // Play projectile fire sound
                    if (window.soundEngine && window.soundEngine.isInitialized) {
                        this.playAttackSound();
                    }
                }
                return;
            }

            // Deal damage to player (with invincibility frame check)
            if (player.takeDamage(damage)) {
                // Trigger HUD damage flash
                if (window.game && window.game.hud) {
                    window.game.hud.onPlayerDamageFrom(this.enemy.x, this.enemy.y);
                }

                // Play attack and pain sounds
                if (window.soundEngine && window.soundEngine.isInitialized) {
                    this.playAttackSound();
                    window.soundEngine.playPlayerHit();
                }
            }
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
        if (this.behavior.callForHelp && !this.helpCalled) {
            this.helpCalled = true;
            // Alert nearby enemies (would be handled by enemy manager)
            console.log('Enemy calls for help!');
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
        const waypointCount = 3 + Math.floor(Math.random() * 3);
        this.enemy.patrolWaypoints = [];
        
        for (let i = 0; i < waypointCount; i++) {
            const angle = (i / waypointCount) * Math.PI * 2;
            const radius = this.enemy.patrolRadius * (0.5 + Math.random() * 0.5);
            
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
            this.enemy.hitFlashTime = Date.now(); // Visual indicator

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
            const angle = (i / 2) * Math.PI * 2 + Math.random();
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

// Export to global scope
window.EnemyBehaviors = EnemyBehaviors;
window.EnhancedEnemyAI = EnhancedEnemyAI;