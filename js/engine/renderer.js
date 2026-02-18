/**
 * Raycasting Renderer - Core of the Doom-style engine
 */
class Renderer {
    constructor(canvas, map) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.map = map;
        
        // Screen properties
        this.width = canvas.width;
        this.height = canvas.height;
        this.halfHeight = this.height / 2;
        
        // Field of view and projection
        this.fov = MathUtils.degToRad(60); // 60 degree FOV
        this.rayCount = this.width; // One ray per column
        this.rayAngleStep = this.fov / this.rayCount;
        
        // Distance to projection plane
        this.projectionDistance = (this.width / 2) / Math.tan(this.fov / 2);
        
        // Wall height and rendering
        this.wallHeight = 64;
        this.maxRenderDistance = 800;
        
        // Sprite system
        this.sprites = {};
        this.loadSprites();
        
        // Texture system
        this.textures = {};
        this.loadTextures();
        
        // Colors
        this.floorColor = '#333333';
        this.ceilingColor = '#666666';
        this.wallColors = {
            1: '#FF0000', // Red wall
            2: '#00FF00', // Green wall
            3: '#0000FF', // Blue wall
            4: '#FFFF00', // Yellow wall
            5: '#FF00FF', // Magenta wall
            6: '#00FFFF', // Cyan wall
            7: '#FFFFFF', // White wall
            8: '#888888'  // Gray wall
        };
        
        // Performance optimization
        this.imageData = this.ctx.createImageData(this.width, this.height);
        this.pixelBuffer = new Uint32Array(this.imageData.data.buffer);
        
        // Precalculated values for performance
        this.cosTable = [];
        this.sinTable = [];
        for (let i = 0; i < 360; i++) {
            this.cosTable[i] = Math.cos(MathUtils.degToRad(i));
            this.sinTable[i] = Math.sin(MathUtils.degToRad(i));
        }
    }
    
    render(player) {
        // Clear screen
        this.clearScreen();
        
        // Cast rays for each column
        for (let rayIndex = 0; rayIndex < this.rayCount; rayIndex++) {
            const rayResult = this.castRay(player, rayIndex);
            this.renderWallSlice(rayIndex, rayResult, player);
        }
        
        // Update canvas
        this.ctx.putImageData(this.imageData, 0, 0);
        
        // Render sprites (enemies, items, etc.)
        this.renderSprites(player);
        
        // Render minimap (optional debug view)
        if (window.DEBUG_MODE) {
            this.renderMinimap(player);
        }
    }
    
    castRay(player, rayIndex) {
        // Calculate ray angle
        const rayAngle = player.angle - (this.fov / 2) + (rayIndex * this.rayAngleStep);
        const fixedRayAngle = MathUtils.fixAngle(rayAngle);
        
        // Ray direction
        const rayDirX = Math.cos(fixedRayAngle);
        const rayDirY = Math.sin(fixedRayAngle);
        
        // Current position
        let rayX = player.x;
        let rayY = player.y;
        
        // Step size for ray marching
        const stepSize = 1;
        let distance = 0;
        let hitWall = false;
        let wallType = 0;
        let hitSide = 0; // 0 = vertical wall, 1 = horizontal wall
        
        // Ray marching
        while (!hitWall && distance < this.maxRenderDistance) {
            // Move ray forward
            rayX += rayDirX * stepSize;
            rayY += rayDirY * stepSize;
            distance += stepSize;
            
            // Check if we hit a wall
            const mapX = Math.floor(rayX / this.wallHeight);
            const mapY = Math.floor(rayY / this.wallHeight);
            
            if (this.map.isWall(mapX, mapY)) {
                hitWall = true;
                wallType = this.map.getWallType(mapX, mapY);
                
                // Determine which side of the wall we hit
                const prevX = rayX - rayDirX * stepSize;
                const prevY = rayY - rayDirY * stepSize;
                const prevMapX = Math.floor(prevX / this.wallHeight);
                const prevMapY = Math.floor(prevY / this.wallHeight);
                
                if (prevMapX !== mapX) hitSide = 0; // Vertical wall
                else hitSide = 1; // Horizontal wall
            }
        }
        
        // Calculate perpendicular distance (fish-eye correction)
        const perpDistance = distance * Math.cos(fixedRayAngle - player.angle);
        
        return {
            distance: perpDistance,
            wallType,
            hitSide,
            angle: fixedRayAngle,
            hitX: rayX,
            hitY: rayY
        };
    }
    
    renderWallSlice(x, rayResult, player) {
        const { distance, wallType, hitSide, hitX, hitY } = rayResult;
        
        if (distance >= this.maxRenderDistance) {
            // Render floor and ceiling only
            this.renderFloorCeiling(x);
            return;
        }
        
        // Calculate wall height on screen
        const wallScreenHeight = (this.wallHeight * this.projectionDistance) / distance;
        const wallTop = this.halfHeight - wallScreenHeight / 2;
        const wallBottom = this.halfHeight + wallScreenHeight / 2;
        
        // Get texture for this wall type
        const textureName = this.wallTypeTextures[wallType] || 'stone';
        const texture = this.textures[textureName];
        
        // Apply shading based on distance and wall side
        const shadingFactor = Math.max(0.2, 1 - (distance / this.maxRenderDistance));
        const sideFactor = hitSide === 0 ? 1.0 : 0.7; // Darken horizontal walls
        const totalShading = shadingFactor * sideFactor;
        
        // Calculate texture U coordinate (horizontal position on texture)
        let textureU;
        if (hitSide === 0) {
            // Vertical wall - use Y coordinate
            textureU = (hitY % this.wallHeight) / this.wallHeight;
        } else {
            // Horizontal wall - use X coordinate
            textureU = (hitX % this.wallHeight) / this.wallHeight;
        }
        
        // Render floor
        for (let y = 0; y < wallTop && y < this.height; y++) {
            this.setPixel(x, Math.floor(y), this.hexToRgb(this.floorColor));
        }
        
        // Render textured wall
        if (texture && texture.complete) {
            this.renderTexturedWallSlice(x, wallTop, wallBottom, textureU, texture, totalShading);
        } else {
            // Fallback to solid color if texture not loaded
            let wallColor = this.wallColors[wallType] || '#FFFFFF';
            const color = this.applyShading(wallColor, totalShading);
            
            for (let y = Math.max(0, wallTop); y < Math.min(this.height, wallBottom); y++) {
                this.setPixel(x, Math.floor(y), color);
            }
        }
        
        // Render ceiling
        for (let y = Math.max(0, wallBottom); y < this.height; y++) {
            this.setPixel(x, Math.floor(y), this.hexToRgb(this.ceilingColor));
        }
    }
    
    renderFloorCeiling(x) {
        for (let y = 0; y < this.halfHeight; y++) {
            this.setPixel(x, y, this.hexToRgb(this.ceilingColor));
        }
        for (let y = this.halfHeight; y < this.height; y++) {
            this.setPixel(x, y, this.hexToRgb(this.floorColor));
        }
    }
    
    clearScreen() {
        this.pixelBuffer.fill(0x000000FF); // Black background
    }
    
    setPixel(x, y, color) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const index = y * this.width + x;
            this.pixelBuffer[index] = color;
        }
    }
    
    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return 0xFF000000 | (b << 16) | (g << 8) | r; // ARGB format
    }
    
    applyShading(hexColor, factor) {
        const r = Math.floor(parseInt(hexColor.slice(1, 3), 16) * factor);
        const g = Math.floor(parseInt(hexColor.slice(3, 5), 16) * factor);
        const b = Math.floor(parseInt(hexColor.slice(5, 7), 16) * factor);
        return 0xFF000000 | (b << 16) | (g << 8) | r;
    }
    
    renderTexturedWallSlice(x, wallTop, wallBottom, textureU, texture, shading) {
        // Get texture dimensions
        const textureWidth = texture.width;
        const textureHeight = texture.height;
        
        // Calculate which horizontal pixel of texture to use
        const textureX = Math.floor(textureU * textureWidth) % textureWidth;
        
        // Create a temporary canvas to sample texture pixels (only once)
        if (!this.textureCanvas) {
            this.textureCanvas = document.createElement('canvas');
            this.textureCtx = this.textureCanvas.getContext('2d');
            this.cachedTexture = null;
            this.cachedTextureData = null;
        }
        
        // Cache texture data to avoid redrawing same texture repeatedly
        if (this.cachedTexture !== texture) {
            this.textureCanvas.width = textureWidth;
            this.textureCanvas.height = textureHeight;
            this.textureCtx.drawImage(texture, 0, 0);
            this.cachedTextureData = this.textureCtx.getImageData(0, 0, textureWidth, textureHeight);
            this.cachedTexture = texture;
        }
        
        // Render each pixel of the wall column
        const wallHeight = wallBottom - wallTop;
        
        for (let y = Math.max(0, wallTop); y < Math.min(this.height, wallBottom); y++) {
            // Calculate V coordinate (vertical position on texture)
            const textureV = (y - wallTop) / wallHeight;
            const textureY = Math.floor(textureV * textureHeight) % textureHeight;
            
            // Get pixel from texture
            const pixelIndex = (textureY * textureWidth + textureX) * 4;
            let r = this.cachedTextureData.data[pixelIndex];
            let g = this.cachedTextureData.data[pixelIndex + 1]; 
            let b = this.cachedTextureData.data[pixelIndex + 2];
            
            // Apply shading
            r = Math.floor(r * shading);
            g = Math.floor(g * shading);
            b = Math.floor(b * shading);
            
            // Convert to the format expected by setPixel (ARGB)
            const color = 0xFF000000 | (b << 16) | (g << 8) | r;
            
            this.setPixel(x, Math.floor(y), color);
        }
    }
    
    renderMinimap(player) {
        const minimapSize = 200;
        const mapScale = 4;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, minimapSize, minimapSize);
        
        // Render map
        for (let y = 0; y < this.map.height; y++) {
            for (let x = 0; x < this.map.width; x++) {
                const wall = this.map.grid[y][x];
                if (wall > 0) {
                    this.ctx.fillStyle = this.wallColors[wall] || '#FFFFFF';
                    this.ctx.fillRect(
                        10 + x * mapScale,
                        10 + y * mapScale,
                        mapScale,
                        mapScale
                    );
                }
            }
        }
        
        // Render player
        const playerMapX = (player.x / this.wallHeight) * mapScale;
        const playerMapY = (player.y / this.wallHeight) * mapScale;
        
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(10 + playerMapX, 10 + playerMapY, 3, 0, MathUtils.PI2);
        this.ctx.fill();
        
        // Render player direction
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(10 + playerMapX, 10 + playerMapY);
        this.ctx.lineTo(
            10 + playerMapX + Math.cos(player.angle) * 20,
            10 + playerMapY + Math.sin(player.angle) * 20
        );
        this.ctx.stroke();
        
        // Render enemies on minimap
        this.map.enemies.forEach(enemy => {
            if (enemy.active) {
                const enemyMapX = (enemy.x / this.wallHeight) * mapScale;
                const enemyMapY = (enemy.y / this.wallHeight) * mapScale;
                this.ctx.fillStyle = '#FF0000';
                this.ctx.beginPath();
                this.ctx.arc(10 + enemyMapX, 10 + enemyMapY, 2, 0, MathUtils.PI2);
                this.ctx.fill();
            }
        });
        
        // Render pickups on minimap
        if (window.game && window.game.pickupManager) {
            window.game.pickupManager.getActivePickups().forEach(pickup => {
                const pickupMapX = (pickup.x / this.wallHeight) * mapScale;
                const pickupMapY = (pickup.y / this.wallHeight) * mapScale;
                this.ctx.fillStyle = pickup.properties.color;
                this.ctx.beginPath();
                this.ctx.arc(10 + pickupMapX, 10 + pickupMapY, 1.5, 0, MathUtils.PI2);
                this.ctx.fill();
            });
        }
    }
    
    loadSprites() {
        console.log('Loading sprites...');
        
        // Load imp sprite (transparent version)
        this.sprites.imp = new Image();
        this.sprites.imp.onload = () => {
            console.log('Transparent imp sprite loaded successfully');
        };
        this.sprites.imp.onerror = () => {
            console.error('Failed to load transparent imp sprite');
            // Fallback to original sprite
            this.sprites.imp.src = 'assets/sprites/imp.png';
        };
        this.sprites.imp.src = 'assets/sprites/imp_fixed_transparent.png';
    }
    
    loadTextures() {
        console.log('Loading wall textures...');
        
        const textureTypes = ['stone', 'metal', 'brick', 'tech', 'marble'];
        
        textureTypes.forEach(type => {
            this.textures[type] = new Image();
            this.textures[type].onload = () => {
                console.log(`${type} texture loaded successfully`);
            };
            this.textures[type].onerror = () => {
                console.error(`Failed to load ${type} texture`);
            };
            this.textures[type].src = `assets/textures/${type}.png`;
        });
        
        // Map wall types to textures
        this.wallTypeTextures = {
            1: 'stone',    // Default walls
            2: 'brick',    // Red-ish areas
            3: 'metal',    // Blue areas  
            4: 'tech',     // Green areas
            5: 'marble',   // Light areas
            6: 'stone',    // Purple areas (fallback to stone)
            7: 'metal',    // Other areas
            8: 'brick'     // Fallback
        };
    }
    
    renderSprites(player) {
        // Get all active enemies
        const activeEnemies = this.map.enemies.filter(enemy => enemy.active);
        
        // Get all active pickups (if pickup manager exists)
        const activePickups = window.game && window.game.pickupManager ? 
            window.game.pickupManager.getActivePickups() : [];
        
        // Calculate distance and angle for each enemy relative to player
        const spritesToRender = [];
        
        activeEnemies.forEach(enemy => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Skip if too far away
            if (distance > this.maxRenderDistance) return;
            
            // Calculate angle relative to player's view direction
            let enemyAngle = Math.atan2(dy, dx);
            let angleDiff = enemyAngle - player.angle;
            
            // Normalize angle difference to -PI to PI
            while (angleDiff > Math.PI) angleDiff -= MathUtils.PI2;
            while (angleDiff < -Math.PI) angleDiff += MathUtils.PI2;
            
            // Skip if not in field of view
            if (Math.abs(angleDiff) > this.fov / 2) return;
            
            spritesToRender.push({
                entity: enemy,
                entityType: 'enemy',
                distance: distance,
                angleDiff: angleDiff,
                x: enemy.x,
                y: enemy.y
            });
        });
        
        // Add pickups to rendering queue
        activePickups.forEach(pickup => {
            const dx = pickup.x - player.x;
            const dy = pickup.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Skip if too far away
            if (distance > this.maxRenderDistance) return;
            
            // Calculate angle relative to player's view direction
            let pickupAngle = Math.atan2(dy, dx);
            let angleDiff = pickupAngle - player.angle;
            
            // Normalize angle difference to -PI to PI
            while (angleDiff > Math.PI) angleDiff -= MathUtils.PI2;
            while (angleDiff < -Math.PI) angleDiff += MathUtils.PI2;
            
            // Skip if not in field of view
            if (Math.abs(angleDiff) > this.fov / 2) return;
            
            spritesToRender.push({
                entity: pickup,
                entityType: 'pickup',
                distance: distance,
                angleDiff: angleDiff,
                x: pickup.x,
                y: pickup.y
            });
        });
        
        // Sort sprites by distance (furthest first)
        spritesToRender.sort((a, b) => b.distance - a.distance);
        
        // Render each sprite
        spritesToRender.forEach(spriteData => {
            this.renderSprite(spriteData, player);
        });
    }
    
    renderSprite(spriteData, player) {
        const { entity, entityType, distance, angleDiff } = spriteData;
        
        // Calculate screen position
        const screenX = this.width / 2 + (angleDiff / this.fov) * this.width;
        
        if (entityType === 'enemy') {
            // Render enemy sprite
            const sprite = this.sprites.imp; // Use imp sprite for all enemies for now
            if (!sprite || !sprite.complete) return;
            
            // Calculate sprite size based on distance
            const spriteSize = (this.wallHeight * this.projectionDistance) / distance * 0.6;
            
            // Calculate vertical position - sprite bottom should align with floor
            const screenY = this.halfHeight; // Ground level
            
            // Draw the sprite (bottom-aligned to ground)
            this.ctx.drawImage(
                sprite,
                screenX - spriteSize / 2,    // Center horizontally
                screenY - spriteSize,         // Bottom touches ground
                spriteSize,
                spriteSize
            );
        } else if (entityType === 'pickup') {
            // Render pickup as colored circle (simple representation)
            const renderInfo = entity.getRenderInfo();
            const size = (this.wallHeight * this.projectionDistance) / distance * 0.3; // Smaller than enemies
            const screenY = this.halfHeight - size / 2; // Center on ground level
            
            this.ctx.fillStyle = renderInfo.color;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add a white border for visibility
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }
}

// Export to global scope
window.Renderer = Renderer;