/**
 * Game Map - World definition and collision detection
 */
class GameMap {
    constructor() {
        // Map dimensions
        this.width = 16;
        this.height = 16;
        this.tileSize = 64; // Size of each map tile in world units
        
        // Player spawn point
        this.spawnX = 2.5 * this.tileSize;
        this.spawnY = 2.5 * this.tileSize;
        this.spawnAngle = 0;
        
        // Map grid (0 = empty, 1-8 = different wall types)
        this.grid = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,2,2,0,0,0,0,0,0,3,3,0,0,1],
            [1,0,0,2,2,0,0,0,0,0,0,3,3,0,0,1],
            [1,0,0,0,0,0,0,4,4,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,4,4,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,5,5,5,5,0,0,0,0,0,1],
            [1,0,0,6,0,0,5,0,0,5,0,0,0,7,0,1],
            [1,0,0,6,0,0,5,0,0,5,0,0,0,7,0,1],
            [1,0,0,6,0,0,5,5,5,5,0,0,0,7,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        // Additional map data
        this.items = []; // Collectible items
        this.enemies = []; // Enemy spawn points
        this.doors = []; // Interactive doors

        // Door system
        this.initializeDoors();

        // Initialize additional map elements
        this.initializeMapElements();
        
        console.log('Map initialized:', this.width + 'x' + this.height);
    }
    
    initializeMapElements() {
        // Add some collectible items
        this.items.push({
            x: 5.5 * this.tileSize,
            y: 5.5 * this.tileSize,
            type: 'health',
            collected: false
        });
        
        this.items.push({
            x: 10.5 * this.tileSize,
            y: 10.5 * this.tileSize,
            type: 'ammo',
            collected: false
        });
        
        // Add diverse enemy spawn points with different AI behaviors
        this.enemies.push(new Enemy(8 * this.tileSize, 8 * this.tileSize, 'guard'));
        this.enemies.push(new Enemy(6 * this.tileSize, 6 * this.tileSize, 'imp'));
        this.enemies.push(new Enemy(12 * this.tileSize, 10 * this.tileSize, 'demon'));
        this.enemies.push(new Enemy(4 * this.tileSize, 12 * this.tileSize, 'soldier'));
        
        // Add one more imp for swarm behavior testing
        this.enemies.push(new Enemy(5 * this.tileSize, 7 * this.tileSize, 'imp'));
    }

    initializeDoors() {
        // Add doors to the map at strategic locations
        // Doors use wall type 9 when closed, become 0 when open
        this.addDoor(5, 3, 'none');    // Door into red room area
        this.addDoor(10, 3, 'none');   // Door into blue room area
        this.addDoor(6, 9, 'red');     // Red key door into inner room
    }

    addDoor(mapX, mapY, keyRequired) {
        // Set the grid tile to door wall type (9)
        this.grid[mapY][mapX] = 9;

        this.doors.push({
            mapX, mapY,
            isOpen: false,
            keyRequired, // 'none', 'red', 'blue', 'yellow'
            openTime: 0,
            autoCloseDelay: 5000 // Close after 5 seconds
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
                if (door.isOpen) {
                    // Already open
                    return { success: false, reason: 'already_open' };
                }

                // Check key requirement
                if (door.keyRequired !== 'none') {
                    if (!playerKeys || !playerKeys.includes(door.keyRequired)) {
                        return { success: false, reason: 'need_key', key: door.keyRequired };
                    }
                }

                // Open the door
                door.isOpen = true;
                door.openTime = Date.now();
                this.grid[door.mapY][door.mapX] = 0; // Remove wall

                // Play door sound
                if (window.soundEngine && window.soundEngine.isInitialized) {
                    window.soundEngine.playDoorSound();
                }

                return { success: true };
            }
        }

        return { success: false, reason: 'no_door' };
    }

    updateDoors() {
        const now = Date.now();
        for (const door of this.doors) {
            // Auto-close doors after delay
            if (door.isOpen && now - door.openTime > door.autoCloseDelay) {
                door.isOpen = false;
                this.grid[door.mapY][door.mapX] = 9;
            }
        }
    }

    getDoorAt(mapX, mapY) {
        return this.doors.find(d => d.mapX === mapX && d.mapY === mapY);
    }

    // Check if a coordinate contains a wall
    isWall(mapX, mapY) {
        if (mapX < 0 || mapX >= this.width || mapY < 0 || mapY >= this.height) {
            return true; // Treat out-of-bounds as walls
        }
        return this.grid[mapY][mapX] > 0;
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
        const maxIterations = 200; // Prevent infinite loops

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