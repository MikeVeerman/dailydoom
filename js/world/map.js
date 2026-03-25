/**
 * Game Map - World definition and collision detection
 * Accepts a theme definition from MapThemes to configure layout, zones, hazards, etc.
 */
class GameMap {
    constructor(theme) {
        // Use provided theme or default to reactor
        theme = theme || (window.MapThemes && window.MapThemes.reactor);

        // Map dimensions — all themes are 24x24
        this.width = 24;
        this.height = 24;
        this.tileSize = 64; // Size of each map tile in world units

        // Theme name for title card
        this.themeName = theme ? theme.name : 'THE REACTOR';

        // Player spawn point
        if (theme && theme.spawn) {
            this.spawnX = theme.spawn.x * this.tileSize;
            this.spawnY = theme.spawn.y * this.tileSize;
            this.spawnAngle = theme.spawn.angle || 0;
        } else {
            this.spawnX = 2.5 * this.tileSize;
            this.spawnY = 2.5 * this.tileSize;
            this.spawnAngle = 0;
        }

        // Grid layout from theme
        this.grid = theme ? theme.grid.map(row => row.slice()) : this._defaultGrid();

        // Zone definitions from theme (for lighting, audio, HUD tints)
        this.zones = theme ? theme.zones : [];
        this.defaultZone = theme ? theme.defaultZone : { name: 'corridor', lightTint: { r: 0.04, g: 0.03, b: 0.01 }, audioProfile: 'corridor', hudColor: null };

        // Additional map data
        this.items = [];
        this.enemies = [];
        this.doors = [];
        this.barrels = [];
        this.crates = [];
        this.acidTiles = new Set();
        this.lavaTiles = new Set();
        this.secretWalls = [];
        this.secretsFound = 0;
        this.totalSecrets = 0;
        this.weaponPickups = [];

        // Initialize from theme data
        if (theme) {
            this._initFromTheme(theme);
        }

        console.log('Map initialized:', this.themeName, this.width + 'x' + this.height);
    }

    _initFromTheme(theme) {
        // Doors
        if (theme.doors) {
            for (const d of theme.doors) {
                this.addDoor(d.x, d.y, d.key);
            }
        }

        // Items
        if (theme.items) {
            for (const item of theme.items) {
                this.items.push({
                    x: item.x * this.tileSize,
                    y: item.y * this.tileSize,
                    type: item.type,
                    collected: false
                });
            }
        }

        // Enemies
        if (theme.enemies) {
            for (const e of theme.enemies) {
                this.enemies.push(new Enemy(e.x * this.tileSize, e.y * this.tileSize, e.type));
            }
        }

        // Acid tiles
        if (theme.acidTiles) {
            for (const [x, y] of theme.acidTiles) {
                this.addAcidTile(x, y);
            }
        }

        // Lava tiles
        if (theme.lavaTiles) {
            for (const [x, y] of theme.lavaTiles) {
                this.addLavaTile(x, y);
            }
        }

        // Barrels
        if (theme.barrels) {
            for (const b of theme.barrels) {
                this.addBarrel(b.x * this.tileSize, b.y * this.tileSize);
            }
        }

        // Crates
        if (theme.crates) {
            for (const c of theme.crates) {
                this.addCrate(c.x * this.tileSize, c.y * this.tileSize);
            }
        }

        // Weapon pickup locations
        if (theme.weaponPickups) {
            this.weaponPickups = theme.weaponPickups.map(wp => ({
                type: wp.type,
                x: wp.x * this.tileSize,
                y: wp.y * this.tileSize
            }));
        }

        // Secret rooms
        if (theme.secrets) {
            for (const s of theme.secrets) {
                this.addSecretWall(s.wallX, s.wallY, s.roomX, s.roomY);
            }
            console.log(`Secret rooms initialized: ${this.totalSecrets} secrets`);
        }
    }

    // Zone lookup — returns the zone definition for a tile position
    getZone(tx, ty) {
        for (const zone of this.zones) {
            const b = zone.bounds;
            if (tx >= b.x1 && tx <= b.x2 && ty >= b.y1 && ty <= b.y2) {
                return zone;
            }
        }
        return this.defaultZone;
    }

    // Get the zone's light tint for renderer
    getZoneLightTint(tx, ty) {
        const zone = this.getZone(tx, ty);
        return zone.lightTint || null;
    }

    // Get the zone's audio profile name for sound engine
    getZoneAudioProfile(tx, ty) {
        const zone = this.getZone(tx, ty);
        return zone.audioProfile || 'corridor';
    }

    // Get the zone's HUD color for vignette
    getZoneHudColor(tx, ty) {
        const zone = this.getZone(tx, ty);
        return zone.hudColor || null;
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

        // Explosion dynamic light
        if (window.game && window.game.renderer && window.game.renderer.addDynamicLight) {
            window.game.renderer.addDynamicLight(barrel.x, barrel.y, 1.0, 0.5, 0, 5, 400);
        }

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
