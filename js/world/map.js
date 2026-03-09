/**
 * Game Map - World definition and collision detection
 */
class GameMap {
    constructor() {
        // Map dimensions — expanded for multi-room nuclear reactor facility
        this.width = 24;
        this.height = 24;
        this.tileSize = 64; // Size of each map tile in world units

        // Player spawn point — Control Room (top-left)
        this.spawnX = 2.5 * this.tileSize;
        this.spawnY = 2.5 * this.tileSize;
        this.spawnAngle = 0;

        // Wall types: 1=stone(outer), 2=brick(containment), 3=metal(cooling),
        // 4=tech(control room), 5=marble(reactor core), 6=stone(waste storage),
        // 10=cracked(destructible secret wall)
        this.grid = [
        //   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0  outer wall
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1], // 1  north corridor (secret at 16,1)
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,1], // 2  cracked wall at (16,2)
            [1,0,0,4,4,4,4,0,0,1,1,1,0,1,1,0,0,0,2,2,2,2,0,1], // 3  control room top / containment top
            [1,0,0,4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,1], // 4  control room interior
            [1,0,0,4,0,0,4,4,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,1], // 5  control room (wall at col 7)
            [1,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,1], // 6  control room exit
            [1,0,0,4,4,0,4,4,0,1,1,1,0,1,1,0,0,0,2,2,0,2,0,1], // 7  control room bottom / divider
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 8  main east-west corridor
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9  main corridor
            [1,3,3,3,0,3,3,0,0,5,5,5,0,5,5,5,0,0,3,3,0,3,3,1], // 10 cooling tunnels / reactor top
            [1,0,0,3,0,0,3,0,0,5,0,0,0,0,0,5,0,0,3,0,0,0,3,1], // 11 cooling / reactor interior
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 12 open cross-passage
            [1,0,0,3,0,0,3,0,0,5,0,0,0,0,0,5,0,0,3,0,0,0,3,1], // 13 cooling / reactor interior
            [1,0,0,3,0,0,3,0,0,5,0,0,0,0,0,5,0,0,3,0,0,0,3,1], // 14 cooling / reactor interior
            [1,3,3,3,0,3,3,0,0,5,5,5,0,5,5,5,0,0,3,3,0,3,3,1], // 15 cooling tunnels / reactor bottom
            [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1], // 16 south corridor (secrets at 1,16 and 22,16)
            [1,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,1], // 17 cracked walls at (1,17) and (22,17)
            [1,6,6,6,6,6,6,0,0,1,1,1,0,1,1,1,0,0,1,1,1,1,1,1], // 18 waste storage top / south rooms
            [1,6,0,0,0,0,6,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,1], // 19 waste storage
            [1,6,0,0,0,0,6,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,1], // 20 waste storage
            [1,6,0,0,0,0,6,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1], // 21 waste storage (east opening)
            [1,6,0,0,0,0,6,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,1], // 22 waste storage
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]  // 23 outer wall
        ];
        
        // Additional map data
        this.items = []; // Collectible items
        this.enemies = []; // Enemy spawn points
        this.doors = []; // Interactive doors
        this.barrels = []; // Exploding barrels
        this.crates = []; // Destructible crates with item drops
        this.acidTiles = new Set(); // Floor tiles that deal acid damage
        this.lavaTiles = new Set(); // Floor tiles that deal lava/fire damage
        this.secretWalls = []; // Destructible secret walls
        this.secretsFound = 0;
        this.totalSecrets = 0;

        // Door system
        this.initializeDoors();

        // Initialize additional map elements
        this.initializeMapElements();

        // Initialize secret rooms
        this.initializeSecretRooms();
        
        console.log('Map initialized:', this.width + 'x' + this.height);
    }
    
    initializeMapElements() {
        // Pickups distributed across rooms for exploration reward

        // Control Room — starting supplies
        this.items.push({ x: 4.5 * this.tileSize, y: 4.5 * this.tileSize, type: 'ammo', collected: false });

        // Main corridor
        this.items.push({ x: 8.5 * this.tileSize, y: 8.5 * this.tileSize, type: 'health', collected: false });

        // Reactor Core — hazardous area reward
        this.items.push({ x: 12.5 * this.tileSize, y: 12.5 * this.tileSize, type: 'ammo', collected: false });

        // Containment Wing
        this.items.push({ x: 19.5 * this.tileSize, y: 4.5 * this.tileSize, type: 'health', collected: false });

        // South-east rooms
        this.items.push({ x: 20.5 * this.tileSize, y: 20.5 * this.tileSize, type: 'ammo', collected: false });

        // Waste Storage — dead-end exploration bonus
        this.items.push({ x: 3.5 * this.tileSize, y: 21.5 * this.tileSize, type: 'health', collected: false });

        // Enemies spread across the facility

        // Main corridor guards
        this.enemies.push(new Enemy(8 * this.tileSize, 8 * this.tileSize, 'guard'));
        this.enemies.push(new Enemy(5 * this.tileSize, 8.5 * this.tileSize, 'imp'));

        // Reactor Core — heavy resistance
        this.enemies.push(new Enemy(12 * this.tileSize, 11 * this.tileSize, 'demon'));
        this.enemies.push(new Enemy(11 * this.tileSize, 13 * this.tileSize, 'berserker'));
        this.enemies.push(new Enemy(14 * this.tileSize, 11 * this.tileSize, 'imp'));

        // Containment Wing — tactical enemies
        this.enemies.push(new Enemy(20 * this.tileSize, 4 * this.tileSize, 'soldier'));
        this.enemies.push(new Enemy(20 * this.tileSize, 11 * this.tileSize, 'spitter'));
        this.enemies.push(new Enemy(20 * this.tileSize, 20 * this.tileSize, 'shield_guard'));

        // Boss in the south-east wing
        this.enemies.push(new Enemy(21 * this.tileSize, 21 * this.tileSize, 'boss'));

        // --- Environmental Hazards ---

        // Acid pools — green-tinted floor tiles that deal 5 HP/sec
        // Reactor Core acid spill
        this.addAcidTile(11, 12);
        this.addAcidTile(12, 11);
        this.addAcidTile(13, 12);
        // Waste Storage toxic puddles
        this.addAcidTile(3, 20);
        this.addAcidTile(4, 20);
        this.addAcidTile(3, 21);
        // Cooling tunnel leak
        this.addAcidTile(2, 11);
        this.addAcidTile(4, 14);

        // Lava vents — orange-tinted floor tiles that deal 8 HP/sec
        // Reactor Core center vents
        this.addLavaTile(12, 12);
        this.addLavaTile(11, 11);
        // South-east wing heat vents
        this.addLavaTile(20, 19);
        this.addLavaTile(21, 20);

        // Exploding barrels — shoot to detonate (60 dmg, 100 unit radius)
        // Main corridor
        this.addBarrel(6.5 * this.tileSize, 9.5 * this.tileSize);
        // Near reactor entrance
        this.addBarrel(8.5 * this.tileSize, 12.5 * this.tileSize);
        // Containment wing — chain reaction pair
        this.addBarrel(17.5 * this.tileSize, 5.5 * this.tileSize);
        this.addBarrel(17.5 * this.tileSize, 6.5 * this.tileSize);
        // South corridor
        this.addBarrel(5.5 * this.tileSize, 16.5 * this.tileSize);
        // Near boss room
        this.addBarrel(17.5 * this.tileSize, 20.5 * this.tileSize);

        // Destructible crates — shoot to break, drops random item
        // Control room area
        this.addCrate(5.5 * this.tileSize, 6.5 * this.tileSize);
        // North corridor
        this.addCrate(14.5 * this.tileSize, 1.5 * this.tileSize);
        // Near cooling tunnels
        this.addCrate(4.5 * this.tileSize, 11.5 * this.tileSize);
        // Reactor area entrance
        this.addCrate(8.5 * this.tileSize, 10.5 * this.tileSize);
        // South corridor
        this.addCrate(10.5 * this.tileSize, 16.5 * this.tileSize);
        // Containment wing
        this.addCrate(20.5 * this.tileSize, 4.5 * this.tileSize);
        // Waste storage
        this.addCrate(3.5 * this.tileSize, 21.5 * this.tileSize);
        // South-east wing
        this.addCrate(20.5 * this.tileSize, 21.5 * this.tileSize);
    }

    initializeDoors() {
        // Doors at strategic chokepoints between areas
        this.addDoor(4, 7, 'none');     // Control Room south exit
        this.addDoor(12, 10, 'none');   // Reactor Core north entrance
        this.addDoor(12, 15, 'none');   // Reactor Core south entrance
        this.addDoor(20, 7, 'none');    // Containment Wing south exit
        this.addDoor(12, 18, 'red');    // Red key door to south section
    }

    addDoor(mapX, mapY, keyRequired) {
        // Set the grid tile to door wall type (9)
        this.grid[mapY][mapX] = 9;

        this.doors.push({
            mapX, mapY,
            keyRequired, // 'none', 'red', 'blue', 'yellow'
            state: 'closed', // closed, opening, open, closing
            progress: 0, // 0.0 = closed, 1.0 = fully open
            lastProximityTime: 0,
            autoCloseDelay: 3000, // Close 3 seconds after player leaves
            animDuration: 500 // 0.5 seconds to open/close
        });
    }

    tryOpenDoor(playerX, playerY, playerAngle, playerKeys) {
        // Find door the player is facing within interaction range
        const interactRange = 80;
        const checkX = playerX + Math.cos(playerAngle) * interactRange;
        const checkY = playerY + Math.sin(playerAngle) * interactRange;
        const mapPos = this.worldToMap(checkX, checkY);

        for (const door of this.doors) {
            if (door.mapX === mapPos.x && door.mapY === mapPos.y) {
                if (door.state === 'open' || door.state === 'opening') {
                    return { success: false, reason: 'already_open' };
                }

                // Check key requirement
                if (door.keyRequired !== 'none') {
                    if (!playerKeys || !playerKeys.includes(door.keyRequired)) {
                        return { success: false, reason: 'need_key', key: door.keyRequired };
                    }
                }

                // Start opening the door
                door.state = 'opening';
                door.lastProximityTime = Date.now();

                // Play door sound
                if (window.soundEngine && window.soundEngine.isInitialized) {
                    window.soundEngine.playDoorSound();
                }

                return { success: true };
            }
        }

        return { success: false, reason: 'no_door' };
    }

    updateDoors(playerX, playerY, deltaTime) {
        const now = Date.now();
        const proximityRange = 2 * this.tileSize; // 2 tiles

        for (const door of this.doors) {
            // Calculate distance from player to door center
            const doorWorldX = door.mapX * this.tileSize + this.tileSize / 2;
            const doorWorldY = door.mapY * this.tileSize + this.tileSize / 2;
            const dx = playerX - doorWorldX;
            const dy = playerY - doorWorldY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const playerNearby = dist < proximityRange;

            if (playerNearby) {
                door.lastProximityTime = now;

                // Auto-open unlocked doors on proximity
                if (door.state === 'closed' && door.keyRequired === 'none') {
                    door.state = 'opening';
                    if (window.soundEngine && window.soundEngine.isInitialized) {
                        window.soundEngine.playDoorSound();
                    }
                } else if (door.state === 'closing' && door.keyRequired === 'none') {
                    door.state = 'opening';
                    if (window.soundEngine && window.soundEngine.isInitialized) {
                        window.soundEngine.playDoorSound();
                    }
                }
            }

            // Animate door based on state
            const animStep = (deltaTime || 0.016) / (door.animDuration / 1000);

            if (door.state === 'opening') {
                door.progress = Math.min(1.0, door.progress + animStep);
                if (door.progress >= 1.0) {
                    door.state = 'open';
                    door.progress = 1.0;
                }
            } else if (door.state === 'closing') {
                door.progress = Math.max(0.0, door.progress - animStep);
                if (door.progress <= 0.0) {
                    door.state = 'closed';
                    door.progress = 0.0;
                    this.grid[door.mapY][door.mapX] = 9; // Restore wall collision
                }
            } else if (door.state === 'open') {
                // Auto-close after delay when player is far enough away
                if (!playerNearby && now - door.lastProximityTime > door.autoCloseDelay) {
                    // Check if any entity is in the door tile before closing
                    if (!this._isEntityInTile(door.mapX, door.mapY, playerX, playerY)) {
                        door.state = 'closing';
                        if (window.soundEngine && window.soundEngine.isInitialized) {
                            window.soundEngine.playDoorSound();
                        }
                    }
                }
            }
        }
    }

    _isEntityInTile(mapX, mapY, playerX, playerY) {
        // Check if player is in this tile
        const pMapX = Math.floor(playerX / this.tileSize);
        const pMapY = Math.floor(playerY / this.tileSize);
        if (pMapX === mapX && pMapY === mapY) return true;

        // Check if any enemy is in this tile
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            const eMapX = Math.floor(enemy.x / this.tileSize);
            const eMapY = Math.floor(enemy.y / this.tileSize);
            if (eMapX === mapX && eMapY === mapY) return true;
        }
        return false;
    }

    getDoorAt(mapX, mapY) {
        return this.doors.find(d => d.mapX === mapX && d.mapY === mapY);
    }

    // --- Hazard methods ---

    addAcidTile(mapX, mapY) {
        this.acidTiles.add(mapX + ',' + mapY);
    }

    isAcidTile(mapX, mapY) {
        return this.acidTiles.has(mapX + ',' + mapY);
    }

    isAcidAtPosition(worldX, worldY) {
        const mapX = Math.floor(worldX / this.tileSize);
        const mapY = Math.floor(worldY / this.tileSize);
        return this.isAcidTile(mapX, mapY);
    }

    addLavaTile(mapX, mapY) {
        this.lavaTiles.add(mapX + ',' + mapY);
    }

    isLavaTile(mapX, mapY) {
        return this.lavaTiles.has(mapX + ',' + mapY);
    }

    isLavaAtPosition(worldX, worldY) {
        const mapX = Math.floor(worldX / this.tileSize);
        const mapY = Math.floor(worldY / this.tileSize);
        return this.isLavaTile(mapX, mapY);
    }

    isHazardAtPosition(worldX, worldY) {
        return this.isAcidAtPosition(worldX, worldY) || this.isLavaAtPosition(worldX, worldY);
    }

    addBarrel(x, y) {
        this.barrels.push({
            x, y,
            health: 30,
            active: true,
            radius: 16, // collision radius
            explodeRadius: 100,
            explodeDamage: 60
        });
    }

    explodeBarrel(barrel) {
        if (!barrel.active) return;
        barrel.active = false;

        // Play explosion sound + particles
        if (window.game && window.game.hud) {
            window.game.hud.emitExplosionParticles(barrel.x, barrel.y, 20);
            window.game.hud.triggerScreenShake(8);
        }
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playExplosion();
        }

        // Damage player + knockback
        if (window.game && window.game.player) {
            const player = window.game.player;
            const dx = player.x - barrel.x;
            const dy = player.y - barrel.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < barrel.explodeRadius) {
                const falloff = 1 - (dist / barrel.explodeRadius);
                const dmg = Math.round(barrel.explodeDamage * falloff);
                player.takeDamage(dmg);
                if (window.game.hud) window.game.hud.onPlayerDamageFrom(barrel.x, barrel.y, dmg);
                // Knockback: 400 force at center, scaled by falloff
                if (player.applyKnockback) {
                    player.applyKnockback(barrel.x, barrel.y, 400 * falloff);
                }
            }
        }

        // Damage enemies + knockback
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            const dx = enemy.x - barrel.x;
            const dy = enemy.y - barrel.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < barrel.explodeRadius) {
                const falloff = 1 - (dist / barrel.explodeRadius);
                const dmg = Math.round(barrel.explodeDamage * falloff);
                enemy.takeDamage(dmg);
                if (window.game && window.game.hud) {
                    window.game.hud.addDamageNumber(enemy.x, enemy.y, dmg, false);
                }
                // Knockback: 500 force at center, scaled by falloff
                if (enemy.applyKnockback) {
                    enemy.applyKnockback(barrel.x, barrel.y, 500 * falloff);
                }
            }
        });

        // Chain reaction — detonate nearby barrels
        this.barrels.forEach(other => {
            if (!other.active || other === barrel) return;
            const dx = other.x - barrel.x;
            const dy = other.y - barrel.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < barrel.explodeRadius) {
                // Delay chain reaction slightly for visual effect
                setTimeout(() => this.explodeBarrel(other), 150);
            }
        });
    }

    addCrate(x, y) {
        this.crates.push({
            x, y,
            health: 40,
            maxHealth: 40,
            active: true,
            radius: 16
        });
    }

    destroyCrate(crate) {
        if (!crate.active) return;
        crate.active = false;

        // Particle burst
        if (window.game && window.game.hud) {
            window.game.hud.emitExplosionParticles(crate.x, crate.y, 8);
        }

        // Play crate break sound
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playCrateBreak();
        }

        // Drop a random pickup
        if (window.game && window.game.pickupManager) {
            const dropTypes = ['health', 'ammo_pistol', 'ammo_shotgun', 'ammo_rifle', 'ammo_rocket', 'armor'];
            const dropType = dropTypes[Math.floor(Math.random() * dropTypes.length)];
            window.game.pickupManager.addPickup(crate.x, crate.y, dropType);

            if (window.game.hud && window.game.hud.addKillFeedMessage) {
                window.game.hud.addKillFeedMessage('Crate destroyed!', '#C8A030');
            }
        }
    }

    // --- Secret Room methods ---

    initializeSecretRooms() {
        // Secret 1: North corridor — room at (16,1), cracked wall at (16,2)
        this.addSecretWall(16, 2, 16, 1);
        // Secret 2: SW south corridor — room at (1,16), cracked wall at (1,17)
        this.addSecretWall(1, 17, 1, 16);
        // Secret 3: SE south corridor — room at (22,16), cracked wall at (22,17)
        this.addSecretWall(22, 17, 22, 16);

        console.log(`Secret rooms initialized: ${this.totalSecrets} secrets`);
    }

    addSecretWall(mapX, mapY, roomX, roomY) {
        this.secretWalls.push({
            mapX, mapY,
            roomX, roomY,
            health: 80,
            maxHealth: 80,
            active: true
        });
        this.totalSecrets++;

        // Place bonus pickups in the secret room
        if (window.game && window.game.pickupManager) {
            window.game.pickupManager.addPickup(
                (roomX + 0.5) * this.tileSize,
                (roomY + 0.5) * this.tileSize,
                'health_large'
            );
        } else {
            // Defer pickup placement until pickup manager exists
            this.items.push({
                x: (roomX + 0.5) * this.tileSize,
                y: (roomY + 0.5) * this.tileSize,
                type: 'health',
                collected: false
            });
        }
    }

    damageSecretWall(mapX, mapY, damage) {
        for (const wall of this.secretWalls) {
            if (!wall.active || wall.mapX !== mapX || wall.mapY !== mapY) continue;

            wall.health -= damage;
            if (wall.health <= 0) {
                this.destroySecretWall(wall);
            }
            return wall;
        }
        return null;
    }

    destroySecretWall(wall) {
        if (!wall.active) return;
        wall.active = false;

        // Remove the wall tile — make it passable
        this.grid[wall.mapY][wall.mapX] = 0;

        this.secretsFound++;

        // Particles
        if (window.game && window.game.hud) {
            const worldX = (wall.mapX + 0.5) * this.tileSize;
            const worldY = (wall.mapY + 0.5) * this.tileSize;
            window.game.hud.emitExplosionParticles(worldX, worldY, 12);
            window.game.hud.triggerScreenShake(6);
        }

        // Sound
        if (window.soundEngine && window.soundEngine.isInitialized) {
            window.soundEngine.playWallBreak();
        }

        // Kill feed
        if (window.game && window.game.hud && window.game.hud.addKillFeedMessage) {
            window.game.hud.addKillFeedMessage(
                `SECRET FOUND! (${this.secretsFound}/${this.totalSecrets})`,
                '#FFD700'
            );
        }

        // Spawn a valuable pickup in the secret room
        if (window.game && window.game.pickupManager) {
            const roomWorldX = (wall.roomX + 0.5) * this.tileSize;
            const roomWorldY = (wall.roomY + 0.5) * this.tileSize;
            const rewards = ['health', 'armor', 'ammo_rocket', 'ammo_rifle'];
            const reward = rewards[Math.floor(Math.random() * rewards.length)];
            window.game.pickupManager.addPickup(roomWorldX, roomWorldY, reward);
        }

        console.log(`Secret wall destroyed at (${wall.mapX}, ${wall.mapY})! Secrets: ${this.secretsFound}/${this.totalSecrets}`);
    }

    getSecretWallAt(mapX, mapY) {
        return this.secretWalls.find(w => w.active && w.mapX === mapX && w.mapY === mapY);
    }

    // Check if a coordinate contains a wall (for entity collision)
    // Doors that are partially open allow passage
    isWall(mapX, mapY) {
        if (mapX < 0 || mapX >= this.width || mapY < 0 || mapY >= this.height) {
            return true; // Treat out-of-bounds as walls
        }
        const val = this.grid[mapY][mapX];
        if (val === 0) return false;
        if (val === 9) {
            const door = this.getDoorAt(mapX, mapY);
            if (door && door.progress > 0.3) return false;
        }
        return true;
    }

    // Check if a coordinate blocks raycasting (doors block rays until fully open)
    isRayWall(mapX, mapY) {
        if (mapX < 0 || mapX >= this.width || mapY < 0 || mapY >= this.height) {
            return true;
        }
        const val = this.grid[mapY][mapX];
        if (val === 0) return false;
        if (val === 9) {
            const door = this.getDoorAt(mapX, mapY);
            if (door && door.progress >= 1.0) return false;
        }
        return true;
    }
    
    // Get wall type at coordinate
    getWallType(mapX, mapY) {
        if (mapX < 0 || mapX >= this.width || mapY < 0 || mapY >= this.height) {
            return 1; // Default wall type for out-of-bounds
        }
        return this.grid[mapY][mapX];
    }
    
    // Check collision for a world position
    isWallAtPosition(worldX, worldY) {
        const mapX = Math.floor(worldX / this.tileSize);
        const mapY = Math.floor(worldY / this.tileSize);
        return this.isWall(mapX, mapY);
    }
    
    // Get wall type at world position
    getWallTypeAtPosition(worldX, worldY) {
        const mapX = Math.floor(worldX / this.tileSize);
        const mapY = Math.floor(worldY / this.tileSize);
        return this.getWallType(mapX, mapY);
    }
    
    // Advanced collision detection for circular objects (players, enemies)
    checkCircleCollision(centerX, centerY, radius) {
        const collisions = [];
        
        // Check multiple points around the circle
        const checkPoints = 8;
        for (let i = 0; i < checkPoints; i++) {
            const angle = (i / checkPoints) * MathUtils.PI2;
            const checkX = centerX + Math.cos(angle) * radius;
            const checkY = centerY + Math.sin(angle) * radius;
            
            if (this.isWallAtPosition(checkX, checkY)) {
                collisions.push({
                    x: checkX,
                    y: checkY,
                    angle: angle
                });
            }
        }
        
        return collisions;
    }
    
    // Line of sight check (for AI, shooting, etc.)
    hasLineOfSight(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / (this.tileSize / 4)); // Check every quarter tile
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const checkX = x1 + dx * t;
            const checkY = y1 + dy * t;
            
            if (this.isWallAtPosition(checkX, checkY)) {
                return false;
            }
        }
        
        return true;
    }
    
    // Find nearest wall in a direction (useful for movement)
    findNearestWall(startX, startY, directionX, directionY, maxDistance = 1000) {
        let distance = 0;
        const stepSize = 2; // Check every 2 units
        
        while (distance < maxDistance) {
            distance += stepSize;
            const checkX = startX + directionX * distance;
            const checkY = startY + directionY * distance;
            
            if (this.isWallAtPosition(checkX, checkY)) {
                return {
                    distance: distance - stepSize,
                    x: checkX,
                    y: checkY,
                    wallType: this.getWallTypeAtPosition(checkX, checkY)
                };
            }
        }
        
        return null;
    }
    
    // Get all items within a radius
    getItemsInRadius(centerX, centerY, radius) {
        return this.items.filter(item => {
            if (item.collected) return false;
            
            const dx = item.x - centerX;
            const dy = item.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance <= radius;
        });
    }
    
    // Collect an item
    collectItem(item) {
        item.collected = true;
        console.log(`Collected item: ${item.type} at (${item.x}, ${item.y})`);
    }
    
    // Map coordinate conversions
    worldToMap(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.tileSize),
            y: Math.floor(worldY / this.tileSize)
        };
    }
    
    mapToWorld(mapX, mapY) {
        return {
            x: mapX * this.tileSize + this.tileSize / 2,
            y: mapY * this.tileSize + this.tileSize / 2
        };
    }
    
    // Get tile center position
    getTileCenter(mapX, mapY) {
        return {
            x: mapX * this.tileSize + this.tileSize / 2,
            y: mapY * this.tileSize + this.tileSize / 2
        };
    }
    
    // A* pathfinding - returns array of {x, y} world positions
    findPath(startX, startY, goalX, goalY) {
        const start = this.worldToMap(startX, startY);
        const goal = this.worldToMap(goalX, goalY);

        // Quick exit if goal is a wall or start equals goal
        if (this.isWall(goal.x, goal.y)) return null;
        if (start.x === goal.x && start.y === goal.y) return [];

        const key = (x, y) => x + ',' + y;
        const openSet = [start];
        const cameFrom = {};
        const gScore = {};
        const fScore = {};

        gScore[key(start.x, start.y)] = 0;
        fScore[key(start.x, start.y)] = this.heuristic(start, goal);

        const closedSet = new Set();
        let iterations = 0;
        const maxIterations = 500; // Prevent infinite loops

        while (openSet.length > 0 && iterations < maxIterations) {
            iterations++;

            // Find node with lowest fScore
            let currentIdx = 0;
            for (let i = 1; i < openSet.length; i++) {
                if ((fScore[key(openSet[i].x, openSet[i].y)] || Infinity) <
                    (fScore[key(openSet[currentIdx].x, openSet[currentIdx].y)] || Infinity)) {
                    currentIdx = i;
                }
            }
            const current = openSet[currentIdx];
            const currentKey = key(current.x, current.y);

            if (current.x === goal.x && current.y === goal.y) {
                // Reconstruct path as world positions
                const path = [];
                let node = currentKey;
                while (node && cameFrom[node]) {
                    const [nx, ny] = node.split(',').map(Number);
                    const worldPos = this.getTileCenter(nx, ny);
                    path.unshift(worldPos);
                    node = cameFrom[node];
                }
                return path;
            }

            openSet.splice(currentIdx, 1);
            closedSet.add(currentKey);

            const neighbors = this.getNeighbors(current.x, current.y);
            for (const neighbor of neighbors) {
                const neighborKey = key(neighbor.x, neighbor.y);
                if (closedSet.has(neighborKey)) continue;

                // For diagonal moves, check that both adjacent cardinal tiles are open
                if (neighbor.diagonal) {
                    const dx = neighbor.x - current.x;
                    const dy = neighbor.y - current.y;
                    if (this.isWall(current.x + dx, current.y) || this.isWall(current.x, current.y + dy)) {
                        continue; // Can't cut corners
                    }
                }

                const tentativeG = (gScore[currentKey] || 0) + (neighbor.diagonal ? 1.414 : 1);

                if (tentativeG < (gScore[neighborKey] || Infinity)) {
                    cameFrom[neighborKey] = currentKey;
                    gScore[neighborKey] = tentativeG;
                    fScore[neighborKey] = tentativeG + this.heuristic(neighbor, goal);

                    if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return null; // No path found
    }

    heuristic(a, b) {
        // Octile distance heuristic
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
    }

    // Pathfinding helpers
    getNeighbors(mapX, mapY) {
        const neighbors = [];
        const directions = [
            {x: -1, y: 0}, {x: 1, y: 0},
            {x: 0, y: -1}, {x: 0, y: 1},
            {x: -1, y: -1}, {x: 1, y: -1},
            {x: -1, y: 1}, {x: 1, y: 1}
        ];
        
        for (const dir of directions) {
            const newX = mapX + dir.x;
            const newY = mapY + dir.y;
            
            if (!this.isWall(newX, newY)) {
                neighbors.push({
                    x: newX,
                    y: newY,
                    diagonal: Math.abs(dir.x) + Math.abs(dir.y) > 1
                });
            }
        }
        
        return neighbors;
    }
    
    // Get spawn points for different entities
    getPlayerSpawn() {
        return {
            x: this.spawnX,
            y: this.spawnY,
            angle: this.spawnAngle
        };
    }
    
    getEnemySpawns() {
        return this.enemies.slice(); // Return copy
    }
    
    // Map validation
    validateMap() {
        const issues = [];
        
        // Check if spawn point is valid
        if (this.isWallAtPosition(this.spawnX, this.spawnY)) {
            issues.push('Player spawn point is inside a wall');
        }
        
        // Check if map is properly bounded
        for (let x = 0; x < this.width; x++) {
            if (this.grid[0][x] === 0) issues.push(`Top border has opening at x=${x}`);
            if (this.grid[this.height-1][x] === 0) issues.push(`Bottom border has opening at x=${x}`);
        }
        
        for (let y = 0; y < this.height; y++) {
            if (this.grid[y][0] === 0) issues.push(`Left border has opening at y=${y}`);
            if (this.grid[y][this.width-1] === 0) issues.push(`Right border has opening at y=${y}`);
        }
        
        if (issues.length > 0) {
            console.warn('Map validation issues:', issues);
        } else {
            console.log('Map validation passed');
        }
        
        return issues.length === 0;
    }
    
    // Debug helpers
    printMap() {
        console.log('Map layout:');
        for (let y = 0; y < this.height; y++) {
            let row = '';
            for (let x = 0; x < this.width; x++) {
                row += this.grid[y][x] === 0 ? '.' : this.grid[y][x];
            }
            console.log(row);
        }
    }
    
    getMapStats() {
        let wallCount = 0;
        let emptyCount = 0;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] > 0) {
                    wallCount++;
                } else {
                    emptyCount++;
                }
            }
        }
        
        return {
            totalTiles: this.width * this.height,
            wallTiles: wallCount,
            emptyTiles: emptyCount,
            wallPercentage: (wallCount / (this.width * this.height)) * 100,
            itemCount: this.items.length,
            enemySpawns: this.enemies.length
        };
    }
}

// Export to global scope
window.GameMap = GameMap;