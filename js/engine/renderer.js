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
            8: '#888888', // Gray wall
            9: '#8B4513', // Door (brown/wood)
            10: '#AA7733' // Cracked destructible wall
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
    
    buildAcidLookup() {
        // Hazard lookup: 0=none, 1=acid, 2=lava
        this._acidLookup = [];
        for (let y = 0; y < this.map.height; y++) {
            this._acidLookup[y] = new Uint8Array(this.map.width);
        }
        this._acidTileCount = 0;
        if (this.map.acidTiles) {
            for (const key of this.map.acidTiles) {
                const [x, y] = key.split(',').map(Number);
                if (y >= 0 && y < this.map.height && x >= 0 && x < this.map.width) {
                    this._acidLookup[y][x] = 1;
                }
            }
            this._acidTileCount += this.map.acidTiles.size;
        }
        if (this.map.lavaTiles) {
            for (const key of this.map.lavaTiles) {
                const [x, y] = key.split(',').map(Number);
                if (y >= 0 && y < this.map.height && x >= 0 && x < this.map.width) {
                    this._acidLookup[y][x] = 2;
                }
            }
            this._acidTileCount += this.map.lavaTiles.size;
        }
    }

    isAcidTile(mapX, mapY) {
        if (mapY >= 0 && mapY < this.map.height && mapX >= 0 && mapX < this.map.width) {
            return this._acidLookup[mapY][mapX] === 1;
        }
        return false;
    }

    isLavaTile(mapX, mapY) {
        if (mapY >= 0 && mapY < this.map.height && mapX >= 0 && mapX < this.map.width) {
            return this._acidLookup[mapY][mapX] === 2;
        }
        return false;
    }

    isHazardTile(mapX, mapY) {
        if (mapY >= 0 && mapY < this.map.height && mapX >= 0 && mapX < this.map.width) {
            return this._acidLookup[mapY][mapX] > 0;
        }
        return false;
    }

    render(player) {
        // Clear screen
        this.clearScreen();

        // Build hazard tile lookup (once, or when tiles change)
        const totalHazardCount = (this.map.acidTiles ? this.map.acidTiles.size : 0) + (this.map.lavaTiles ? this.map.lavaTiles.size : 0);
        if (!this._acidLookup || totalHazardCount !== this._acidTileCount) {
            this.buildAcidLookup();
        }

        // Cache time for acid animation
        this._acidTime = Date.now() / 400;

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
            
            if (this.map.isRayWall(mapX, mapY)) {
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
            this.renderFloorCeiling(x, player, rayResult.angle);
            return;
        }
        
        // Calculate wall height on screen
        const wallScreenHeight = (this.wallHeight * this.projectionDistance) / distance;
        let wallTop = this.halfHeight - wallScreenHeight / 2;
        let wallBottom = this.halfHeight + wallScreenHeight / 2;

        // Door animation: slide door upward based on progress
        let doorProgress = 0;
        if (wallType === 9) {
            const doorMapX = Math.floor(hitX / this.wallHeight);
            const doorMapY = Math.floor(hitY / this.wallHeight);
            const door = this.map.getDoorAt(doorMapX, doorMapY);
            if (door) doorProgress = door.progress;
        }

        // For doors: shrink the visible wall from bottom (door slides up)
        let doorWallTop = wallTop;
        let doorWallBottom = wallBottom;
        if (doorProgress > 0) {
            doorWallBottom = wallBottom - wallScreenHeight * doorProgress;
            doorWallTop = wallTop; // Top stays; door goes up into ceiling
        }

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

        // Render ceiling (above wall on screen)
        for (let y = 0; y < wallTop && y < this.height; y++) {
            this.setPixel(x, Math.floor(y), this.hexToRgb(this.floorColor));
        }

        // Render textured wall (use door-adjusted bounds for doors)
        const renderTop = doorProgress > 0 ? doorWallTop : wallTop;
        const renderBottom = doorProgress > 0 ? doorWallBottom : wallBottom;

        if (texture && texture.complete) {
            this.renderTexturedWallSlice(x, renderTop, renderBottom, textureU, texture, totalShading);
        } else {
            // Fallback to solid color if texture not loaded
            let wallColor = this.wallColors[wallType] || '#FFFFFF';
            const color = this.applyShading(wallColor, totalShading);

            for (let y = Math.max(0, renderTop); y < Math.min(this.height, renderBottom); y++) {
                this.setPixel(x, Math.floor(y), color);
            }
        }
        
        // Render floor (below wall on screen, or below door gap)
        const floorStartY = doorProgress > 0 ? Math.ceil(doorWallBottom) : Math.ceil(wallBottom);
        if (this._acidTileCount > 0) {
            const rayAngle = rayResult.angle;
            const cosAngle = Math.cos(rayAngle);
            const sinAngle = Math.sin(rayAngle);
            const cosCorrection = Math.cos(rayAngle - player.angle);
            const baseFloorColor = this.hexToRgb(this.floorColor);
            const floorDistCoeff = (this.wallHeight / 2) * this.projectionDistance;
            for (let y = Math.max(0, floorStartY); y < this.height; y++) {
                const rowDist = floorDistCoeff / (y - this.halfHeight);
                const actualDist = rowDist / cosCorrection;
                const floorWorldX = player.x + actualDist * cosAngle;
                const floorWorldY = player.y + actualDist * sinAngle;
                const mapX = Math.floor(floorWorldX / this.wallHeight);
                const mapY = Math.floor(floorWorldY / this.wallHeight);
                const hazardType = this._acidLookup[mapY] && this._acidLookup[mapY][mapX];
                if (hazardType > 0) {
                    const shade = Math.max(0.3, 1 - (rowDist / this.maxRenderDistance));
                    const pulse = 0.85 + 0.15 * Math.sin(this._acidTime + mapX * 3.7 + mapY * 5.3);
                    const s = shade * pulse;
                    let r, g, b;
                    if (hazardType === 2) { // Lava: orange
                        r = Math.floor(220 * s);
                        g = Math.floor(80 * s);
                        b = Math.floor(10 * s);
                    } else { // Acid: green
                        r = Math.floor(15 * s);
                        g = Math.floor(180 * s);
                        b = Math.floor(10 * s);
                    }
                    this.setPixel(x, y, 0xFF000000 | (b << 16) | (g << 8) | r);
                } else {
                    this.setPixel(x, y, baseFloorColor);
                }
            }
        } else {
            for (let y = Math.max(0, floorStartY); y < this.height; y++) {
                this.setPixel(x, Math.floor(y), this.hexToRgb(this.ceilingColor));
            }
        }
    }

    renderFloorCeiling(x, player, rayAngle) {
        for (let y = 0; y < this.halfHeight; y++) {
            this.setPixel(x, y, this.hexToRgb(this.ceilingColor));
        }
        if (this._acidTileCount > 0 && player && rayAngle !== undefined) {
            const cosAngle = Math.cos(rayAngle);
            const sinAngle = Math.sin(rayAngle);
            const cosCorrection = Math.cos(rayAngle - player.angle);
            const baseFloorColor = this.hexToRgb(this.floorColor);
            const floorDistCoeff = (this.wallHeight / 2) * this.projectionDistance;
            for (let y = Math.ceil(this.halfHeight); y < this.height; y++) {
                const rowDist = floorDistCoeff / (y - this.halfHeight);
                const actualDist = rowDist / cosCorrection;
                const floorWorldX = player.x + actualDist * cosAngle;
                const floorWorldY = player.y + actualDist * sinAngle;
                const mapX = Math.floor(floorWorldX / this.wallHeight);
                const mapY = Math.floor(floorWorldY / this.wallHeight);
                const hazardType = this._acidLookup[mapY] && this._acidLookup[mapY][mapX];
                if (hazardType > 0) {
                    const shade = Math.max(0.3, 1 - (rowDist / this.maxRenderDistance));
                    const pulse = 0.85 + 0.15 * Math.sin(this._acidTime + mapX * 3.7 + mapY * 5.3);
                    const s = shade * pulse;
                    let r, g, b;
                    if (hazardType === 2) { // Lava: orange
                        r = Math.floor(220 * s);
                        g = Math.floor(80 * s);
                        b = Math.floor(10 * s);
                    } else { // Acid: green
                        r = Math.floor(15 * s);
                        g = Math.floor(180 * s);
                        b = Math.floor(10 * s);
                    }
                    this.setPixel(x, y, 0xFF000000 | (b << 16) | (g << 8) | r);
                } else {
                    this.setPixel(x, y, baseFloorColor);
                }
            }
        } else {
            for (let y = Math.ceil(this.halfHeight); y < this.height; y++) {
                this.setPixel(x, y, this.hexToRgb(this.floorColor));
            }
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

        // Enemy type scale factors
        this.enemyScales = {
            imp: 0.6, guard: 0.7, soldier: 0.65, demon: 0.8,
            berserker: 0.7, spitter: 0.55, shield_guard: 0.75, boss: 1.0
        };

        // Per-type enemy sprites (from Anarch oldschool FPS resources, CC0)
        this.enemySprites = {};
        const enemySpriteMap = {
            guard:        { idle: 'guard_idle.png', attack: 'guard_attack.png' },
            imp:          { idle: 'imp_idle_new.png', attack: 'imp_attack.png', walk: 'imp_walk.png' },
            demon:        { idle: 'demon_idle_new.png', attack: 'demon_attack.png', walk: 'demon_walk.png' },
            soldier:      { idle: 'soldier_idle.png', attack: 'soldier_attack.png' },
            berserker:    { idle: 'berserker_idle.png', attack: 'berserker_attack.png', walk: 'berserker_walk.png' },
            spitter:      { idle: 'spitter_idle.png', attack: 'spitter_attack.png' },
            shield_guard: { idle: 'shield_guard_idle.png' },
            boss:         { idle: 'boss_idle.png', attack: 'boss_attack.png', walk: 'boss_walk.png' }
        };

        for (const [type, files] of Object.entries(enemySpriteMap)) {
            this.enemySprites[type] = {};
            for (const [state, filename] of Object.entries(files)) {
                const img = new Image();
                img.src = `assets/sprites/enemies/${filename}`;
                this.enemySprites[type][state] = img;
            }
        }

        // Upscaled sprite cache (pixel-art nearest-neighbor upscale)
        this.upscaledEnemySprites = {};

        // Item/pickup sprites
        this.pickupSprites = {};
        const pickupSpriteMap = {
            health: 'items/health.png',
            large_health: 'items/health.png',
            ammo_pistol: 'items/ammo_bullets.png',
            ammo_shotgun: 'items/ammo_bullets.png',
            ammo_rifle: 'items/ammo_bullets.png',
            ammo_rocket: 'items/ammo_rockets.png',
            ammo_chaingun: 'items/ammo_bullets.png',
            armor: 'items/ammo_plasma.png',
            weapon_shotgun: 'weapons/shotgun_pickup.png',
            weapon_rifle: 'weapons/rifle_pickup.png',
            weapon_rocket: 'weapons/rocket_pickup.png',
            weapon_chaingun: 'weapons/chaingun_pickup.png'
        };

        for (const [type, path] of Object.entries(pickupSpriteMap)) {
            const img = new Image();
            img.src = `assets/sprites/${path}`;
            this.pickupSprites[type] = img;
        }

        // Barrel sprite
        this.barrelSprite = new Image();
        this.barrelSprite.src = 'assets/sprites/items/barrel.png';

        // Legacy tinted sprites (fallback)
        this.tintedSprites = {};
        this.enemyTints = {
            imp:          { hue: 0,   sat: 1.0, bright: 1.0 },
            guard:        { hue: 180, sat: 0.9, bright: 1.1 },
            soldier:      { hue: 100, sat: 0.8, bright: 0.9 },
            demon:        { hue: 280, sat: 1.2, bright: 0.8 },
            berserker:    { hue: 30,  sat: 1.3, bright: 1.1 },
            spitter:      { hue: 120, sat: 1.1, bright: 1.0 },
            shield_guard: { hue: 200, sat: 0.9, bright: 1.2 },
            boss:         { hue: 50,  sat: 0.7, bright: 1.3 }
        };

        // Load legacy imp sprite as fallback
        this.sprites.imp = new Image();
        this.sprites.imp.onload = () => {
            console.log('Fallback imp sprite loaded');
            this.generateTintedSprites();
        };
        this.sprites.imp.onerror = () => {
            console.error('Failed to load fallback imp sprite');
        };
        this.sprites.imp.src = 'assets/sprites/imp_fixed_transparent.png';

        console.log('Loading retro FPS sprites (Anarch CC0 assets)...');
    }

    /**
     * Upscale a 32x32 pixel-art sprite to a larger canvas using nearest-neighbor
     * for crisp rendering at game scale.
     */
    getUpscaledSprite(img, type, state) {
        const key = `${type}_${state}`;
        if (this.upscaledEnemySprites[key]) return this.upscaledEnemySprites[key];
        if (!img || !img.complete || img.naturalWidth === 0) return null;

        const scale = 4; // 32x32 -> 128x128
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        this.upscaledEnemySprites[key] = canvas;
        return canvas;
    }

    generateTintedSprites() {
        const baseSprite = this.sprites.imp;
        if (!baseSprite || !baseSprite.complete) return;

        // Create a canvas to read the base sprite pixels
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = baseSprite.width;
        srcCanvas.height = baseSprite.height;
        const srcCtx = srcCanvas.getContext('2d');
        srcCtx.drawImage(baseSprite, 0, 0);
        const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

        for (const [type, tint] of Object.entries(this.enemyTints)) {
            const canvas = document.createElement('canvas');
            canvas.width = baseSprite.width;
            canvas.height = baseSprite.height;
            const ctx = canvas.getContext('2d');
            const imgData = ctx.createImageData(srcCanvas.width, srcCanvas.height);

            for (let i = 0; i < srcData.data.length; i += 4) {
                const r = srcData.data[i];
                const g = srcData.data[i + 1];
                const b = srcData.data[i + 2];
                const a = srcData.data[i + 3];

                if (a === 0) {
                    imgData.data[i + 3] = 0;
                    continue;
                }

                // Convert RGB to HSL
                const hsl = this.rgbToHsl(r, g, b);
                // Apply tint: shift hue, adjust saturation and brightness
                hsl[0] = (hsl[0] + tint.hue / 360) % 1;
                hsl[1] = Math.min(1, hsl[1] * tint.sat);
                hsl[2] = Math.min(1, hsl[2] * tint.bright);
                // Convert back to RGB
                const rgb = this.hslToRgb(hsl[0], hsl[1], hsl[2]);

                imgData.data[i] = rgb[0];
                imgData.data[i + 1] = rgb[1];
                imgData.data[i + 2] = rgb[2];
                imgData.data[i + 3] = a;
            }

            ctx.putImageData(imgData, 0, 0);
            this.tintedSprites[type] = canvas;
        }

        console.log('Generated tinted sprites for enemy types:', Object.keys(this.tintedSprites).join(', '));
    }

    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return [h, s, l];
    }

    hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
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
            8: 'brick',    // Fallback
            9: 'tech',     // Doors
            10: 'brick'    // Cracked destructible walls
        };
    }
    
    renderSprites(player) {
        // Get all active enemies (including dying ones for death animation)
        const activeEnemies = this.map.enemies.filter(enemy => enemy.active || enemy.dying);
        
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
            
            // Skip if occluded by walls
            if (this.isOccludedByWall(player.x, player.y, enemy.x, enemy.y)) return;
            
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
            
            // Skip if occluded by walls
            if (this.isOccludedByWall(player.x, player.y, pickup.x, pickup.y)) return;
            
            spritesToRender.push({
                entity: pickup,
                entityType: 'pickup',
                distance: distance,
                angleDiff: angleDiff,
                x: pickup.x,
                y: pickup.y
            });
        });
        
        // Add barrels to rendering queue
        if (this.map.barrels) {
            this.map.barrels.forEach(barrel => {
                if (!barrel.active) return;
                const dx = barrel.x - player.x;
                const dy = barrel.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > this.maxRenderDistance) return;

                let barrelAngle = Math.atan2(dy, dx);
                let angleDiff = barrelAngle - player.angle;
                while (angleDiff > Math.PI) angleDiff -= MathUtils.PI2;
                while (angleDiff < -Math.PI) angleDiff += MathUtils.PI2;
                if (Math.abs(angleDiff) > this.fov / 2) return;
                if (this.isOccludedByWall(player.x, player.y, barrel.x, barrel.y)) return;

                spritesToRender.push({
                    entity: barrel,
                    entityType: 'barrel',
                    distance: distance,
                    angleDiff: angleDiff,
                    x: barrel.x,
                    y: barrel.y
                });
            });
        }

        // Add crates to rendering queue
        if (this.map.crates) {
            this.map.crates.forEach(crate => {
                if (!crate.active) return;
                const dx = crate.x - player.x;
                const dy = crate.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > this.maxRenderDistance) return;

                let crateAngle = Math.atan2(dy, dx);
                let angleDiff = crateAngle - player.angle;
                while (angleDiff > Math.PI) angleDiff -= MathUtils.PI2;
                while (angleDiff < -Math.PI) angleDiff += MathUtils.PI2;
                if (Math.abs(angleDiff) > this.fov / 2) return;
                if (this.isOccludedByWall(player.x, player.y, crate.x, crate.y)) return;

                spritesToRender.push({
                    entity: crate,
                    entityType: 'crate',
                    distance: distance,
                    angleDiff: angleDiff,
                    x: crate.x,
                    y: crate.y
                });
            });
        }

        // Add projectiles to rendering queue
        if (window.game && window.game.projectileManager) {
            window.game.projectileManager.getActiveProjectiles().forEach(proj => {
                const dx = proj.x - player.x;
                const dy = proj.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > this.maxRenderDistance) return;

                let projAngle = Math.atan2(dy, dx);
                let angleDiff = projAngle - player.angle;
                while (angleDiff > Math.PI) angleDiff -= MathUtils.PI2;
                while (angleDiff < -Math.PI) angleDiff += MathUtils.PI2;
                if (Math.abs(angleDiff) > this.fov / 2) return;

                spritesToRender.push({
                    entity: proj,
                    entityType: 'projectile',
                    distance: distance,
                    angleDiff: angleDiff,
                    x: proj.x,
                    y: proj.y
                });
            });
        }

        // Sort sprites by distance (furthest first)
        spritesToRender.sort((a, b) => b.distance - a.distance);

        // Render each sprite
        spritesToRender.forEach(spriteData => {
            this.renderSprite(spriteData, player);
        });
    }
    
    isOccludedByWall(playerX, playerY, spriteX, spriteY) {
        // Ray-cast from player to sprite to check for wall intersections
        const dx = spriteX - playerX;
        const dy = spriteY - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 1) return false;

        // Normalize direction for consistent step sizes
        const dirX = dx / distance;
        const dirY = dy / distance;

        // Step size for ray marching - 4 units for accurate wall detection
        const stepSize = 4;
        // Stop short of the sprite position to avoid false positives
        const checkDistance = distance - 16;

        // March along the ray checking for walls
        for (let t = stepSize; t < checkDistance; t += stepSize) {
            const checkX = playerX + dirX * t;
            const checkY = playerY + dirY * t;

            // Check if this position intersects a wall
            if (this.map.isWallAtPosition(checkX, checkY)) {
                return true; // Sprite is occluded
            }
        }

        return false; // Clear line of sight
    }

    renderSprite(spriteData, player) {
        const { entity, entityType, distance, angleDiff } = spriteData;

        // Calculate screen position
        const screenX = this.width / 2 + (angleDiff / this.fov) * this.width;

        if (entityType === 'enemy') {
            const enemyType = entity.type || 'imp';

            // Select sprite based on enemy state (idle, attack, walk/chase)
            let spriteState = 'idle';
            if (entity.state === 'attack') spriteState = 'attack';
            else if (entity.state === 'chase' || entity.state === 'patrol') spriteState = 'walk';

            // Try per-type retro sprite first, fall back to tinted sprite
            let sprite = null;
            const typeSprites = this.enemySprites[enemyType];
            if (typeSprites) {
                const rawSprite = typeSprites[spriteState] || typeSprites.idle;
                sprite = this.getUpscaledSprite(rawSprite, enemyType, spriteState);
            }
            if (!sprite) {
                sprite = this.tintedSprites[enemyType] || this.sprites.imp;
            }
            if (!sprite) return;
            if (sprite instanceof Image && !sprite.complete) return;

            // Scale factor per enemy type (boss is significantly larger)
            const scaleFactor = this.enemyScales[enemyType] || 0.6;

            // Calculate sprite size based on distance and type scale
            const spriteSize = (this.wallHeight * this.projectionDistance) / distance * scaleFactor;

            // Calculate floor position at this distance (bottom of wall)
            const wallScreenHeight = (this.wallHeight * this.projectionDistance) / distance;
            const floorY = this.halfHeight + wallScreenHeight / 2;

            // Death animation: fade out + collapse to floor
            let deathProgress = 0;
            if (entity.dying && entity.deathTime) {
                deathProgress = Math.min(1, (Date.now() - entity.deathTime) / (entity.deathDuration || 600));
            }

            // Apply death animation transforms
            const deathAlpha = entity.dying ? 1 - deathProgress * 0.8 : 1;
            const deathScaleY = entity.dying ? 1 - deathProgress * 0.7 : 1;
            const adjustedHeight = spriteSize * deathScaleY;

            // Draw the sprite with bottom aligned to floor, pixel-art crisp
            const spriteX = screenX - spriteSize / 2;
            const spriteY = floorY - adjustedHeight;
            const prevSmoothing = this.ctx.imageSmoothingEnabled;
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.globalAlpha = deathAlpha;

            // Red tint during death
            if (entity.dying) {
                this.ctx.drawImage(sprite, spriteX, spriteY, spriteSize, adjustedHeight);
                this.ctx.globalAlpha = deathAlpha * 0.5;
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(spriteX, spriteY, spriteSize, adjustedHeight);
            } else {
                this.ctx.drawImage(sprite, spriteX, spriteY, spriteSize, adjustedHeight);
            }

            this.ctx.globalAlpha = 1.0;
            this.ctx.imageSmoothingEnabled = prevSmoothing;

            // Attack telegraph overlay (orange pulse before melee attack)
            if (!entity.dying && entity.attackTellTime) {
                const tellElapsed = Date.now() - entity.attackTellTime;
                const tellDuration = entity.attackTellDuration || 300;
                if (tellElapsed < tellDuration) {
                    // Pulsing orange glow that intensifies as attack approaches
                    const progress = tellElapsed / tellDuration;
                    const pulse = 0.2 + 0.3 * Math.sin(progress * Math.PI * 4) * progress;
                    this.ctx.globalAlpha = pulse;
                    this.ctx.fillStyle = '#FF6600';
                    this.ctx.fillRect(spriteX, spriteY, spriteSize, adjustedHeight);
                    this.ctx.globalAlpha = 1.0;
                }
            }

            // Hit flash overlay (red tint for 150ms after being hit)
            if (!entity.dying && entity.hitFlashTime && Date.now() - entity.hitFlashTime < 150) {
                this.ctx.globalAlpha = 0.4;
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(spriteX, spriteY, spriteSize, adjustedHeight);
                this.ctx.globalAlpha = 1.0;
            }
        } else if (entityType === 'pickup') {
            const size = (this.wallHeight * this.projectionDistance) / distance * 0.3;
            const wallScreenHeight = (this.wallHeight * this.projectionDistance) / distance;
            const floorY = this.halfHeight + wallScreenHeight / 2;
            const screenY = floorY - size / 2;

            // Try sprite-based pickup rendering
            const pickupType = entity.type || '';
            const pickupImg = this.pickupSprites[pickupType];
            if (pickupImg && pickupImg.complete && pickupImg.naturalWidth > 0) {
                const prevSmoothing = this.ctx.imageSmoothingEnabled;
                this.ctx.imageSmoothingEnabled = false;
                this.ctx.drawImage(pickupImg, screenX - size / 2, screenY - size / 2, size, size);
                this.ctx.imageSmoothingEnabled = prevSmoothing;
            } else {
                // Fallback to colored circle
                const renderInfo = entity.getRenderInfo();
                this.ctx.fillStyle = renderInfo.color;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, size / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        } else if (entityType === 'crate') {
            const size = (this.wallHeight * this.projectionDistance) / distance * 0.35;
            const wallScreenHeight = (this.wallHeight * this.projectionDistance) / distance;
            const floorY = this.halfHeight + wallScreenHeight / 2;
            const crateX = screenX - size / 2;
            const crateY = floorY - size;

            // Wooden crate body
            this.ctx.fillStyle = '#8B6914';
            this.ctx.fillRect(crateX, crateY, size, size);

            // Darker planks
            this.ctx.fillStyle = '#6B4F10';
            this.ctx.fillRect(crateX, crateY + size * 0.48, size, size * 0.04);
            this.ctx.fillRect(crateX + size * 0.48, crateY, size * 0.04, size);

            // Cross bracing
            this.ctx.strokeStyle = '#5A3E0D';
            this.ctx.lineWidth = Math.max(1, size * 0.03);
            this.ctx.beginPath();
            this.ctx.moveTo(crateX + size * 0.1, crateY + size * 0.1);
            this.ctx.lineTo(crateX + size * 0.9, crateY + size * 0.9);
            this.ctx.moveTo(crateX + size * 0.9, crateY + size * 0.1);
            this.ctx.lineTo(crateX + size * 0.1, crateY + size * 0.9);
            this.ctx.stroke();

            // Border
            this.ctx.strokeStyle = '#4A2E08';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(crateX, crateY, size, size);

            // Health indicator (darken as damaged)
            const healthPct = entity.health / entity.maxHealth;
            if (healthPct < 1) {
                this.ctx.globalAlpha = (1 - healthPct) * 0.4;
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(crateX, crateY, size, size);
                this.ctx.globalAlpha = 1.0;
            }
        } else if (entityType === 'projectile') {
            const size = Math.max(4, (this.wallHeight * this.projectionDistance) / distance * 0.08);
            const wallScreenHeight = (this.wallHeight * this.projectionDistance) / distance;
            const floorY = this.halfHeight + wallScreenHeight / 2;
            // Center projectile vertically at half-wall height
            const projY = this.halfHeight;

            // Glowing projectile circle
            this.ctx.fillStyle = entity.color || '#FF4400';
            this.ctx.beginPath();
            this.ctx.arc(screenX, projY, size, 0, Math.PI * 2);
            this.ctx.fill();

            // Bright core
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(screenX, projY, size * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (entityType === 'barrel') {
            const size = (this.wallHeight * this.projectionDistance) / distance * 0.35;
            const wallScreenHeight = (this.wallHeight * this.projectionDistance) / distance;
            const floorY = this.halfHeight + wallScreenHeight / 2;
            const barrelX = screenX - size / 2;
            const barrelY = floorY - size;

            // Try sprite-based barrel rendering
            if (this.barrelSprite && this.barrelSprite.complete && this.barrelSprite.naturalWidth > 0) {
                const prevSmoothing = this.ctx.imageSmoothingEnabled;
                this.ctx.imageSmoothingEnabled = false;
                this.ctx.drawImage(this.barrelSprite, barrelX, barrelY, size, size);
                this.ctx.imageSmoothingEnabled = prevSmoothing;
            } else {
                // Fallback to geometric barrel
                this.ctx.fillStyle = '#8B2500';
                this.ctx.fillRect(barrelX, barrelY, size, size);
                this.ctx.fillStyle = '#555555';
                this.ctx.fillRect(barrelX, barrelY + size * 0.15, size, size * 0.1);
                this.ctx.fillRect(barrelX, barrelY + size * 0.75, size, size * 0.1);
                this.ctx.fillStyle = '#FFCC00';
                this.ctx.fillRect(barrelX + size * 0.2, barrelY + size * 0.35, size * 0.6, size * 0.3);
                this.ctx.strokeStyle = '#333333';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(barrelX, barrelY, size, size);
            }
        }
    }
}

// Export to global scope
window.Renderer = Renderer;