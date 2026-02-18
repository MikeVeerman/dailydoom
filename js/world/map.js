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
    
    // Pathfinding helpers (basic A* could be added later)
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