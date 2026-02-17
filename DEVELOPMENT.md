# Development Guide

## Adding New Features

### Adding Enemies

1. Create `js/entities/enemy.js`:
```javascript
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.health = 100;
        this.speed = 80;
        this.angle = 0;
    }
    
    update(deltaTime, player, map) {
        // AI logic here
        this.moveTowardsPlayer(player, deltaTime);
    }
    
    render(renderer, player) {
        // Sprite rendering logic
    }
}
```

2. Add to game loop in `game.js`:
```javascript
// In GameEngine.update()
for (const enemy of this.enemies) {
    enemy.update(deltaTime, this.player, this.map);
}
```

### Adding Textures

1. Modify `renderer.js` to support texture mapping:
```javascript
// Add texture loading
loadTextures() {
    this.textures = {};
    this.textures[1] = this.loadTexture('textures/wall1.png');
}

// In renderWallSlice, replace solid colors with texture sampling
const textureX = (rayHitX % this.wallHeight) / this.wallHeight;
const color = this.sampleTexture(wallType, textureX, y / wallScreenHeight);
```

### Adding Audio

1. Create `js/engine/audio.js`:
```javascript
class AudioManager {
    constructor() {
        this.sounds = {};
        this.musicVolume = 0.7;
        this.soundVolume = 0.8;
    }
    
    loadSound(name, url) {
        const audio = new Audio(url);
        this.sounds[name] = audio;
    }
    
    playSound(name, volume = 1.0) {
        const sound = this.sounds[name];
        if (sound) {
            sound.volume = this.soundVolume * volume;
            sound.play();
        }
    }
}
```

2. Integrate with game events:
```javascript
// In player.js shoot() method
this.audioManager.playSound('gunshot');

// In player.js takeDamage() method  
this.audioManager.playSound('hurt');
```

### Adding Multiplayer

1. WebSocket integration:
```javascript
class NetworkManager {
    constructor() {
        this.ws = null;
        this.players = new Map();
    }
    
    connect(serverUrl) {
        this.ws = new WebSocket(serverUrl);
        this.ws.onmessage = (event) => {
            this.handleMessage(JSON.parse(event.data));
        };
    }
    
    sendPlayerUpdate(player) {
        this.ws.send(JSON.stringify({
            type: 'playerUpdate',
            x: player.x,
            y: player.y,
            angle: player.angle
        }));
    }
}
```

## Performance Optimization

### Rendering Optimizations

1. **Reduce ray count for lower-end devices**:
```javascript
// In renderer.js constructor
this.rayCount = Math.min(this.width, 400); // Cap rays
```

2. **Level-of-detail for distant walls**:
```javascript
// Skip detailed rendering for far walls
if (distance > this.maxDetailDistance) {
    return this.renderSimpleWall(x, rayResult);
}
```

3. **Frustum culling for sprites**:
```javascript
// Only render sprites within view cone
const angleToSprite = Math.atan2(sprite.y - player.y, sprite.x - player.x);
const angleDiff = Math.abs(angleToSprite - player.angle);
if (angleDiff < this.fov / 2) {
    this.renderSprite(sprite, player);
}
```

### Memory Optimizations

1. **Object pooling for projectiles**:
```javascript
class ProjectilePool {
    constructor(maxSize = 100) {
        this.pool = [];
        this.active = [];
        for (let i = 0; i < maxSize; i++) {
            this.pool.push(new Projectile());
        }
    }
    
    spawn(x, y, angle) {
        const projectile = this.pool.pop();
        if (projectile) {
            projectile.init(x, y, angle);
            this.active.push(projectile);
        }
    }
    
    despawn(projectile) {
        const index = this.active.indexOf(projectile);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.pool.push(projectile);
        }
    }
}
```

## Code Style Guide

### Naming Conventions
- Classes: `PascalCase` (e.g., `GameEngine`, `InputManager`)
- Functions: `camelCase` (e.g., `updatePlayer`, `checkCollision`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_HEALTH`, `WALL_HEIGHT`)
- Private methods: prefix with `_` (e.g., `_calculateDistance`)

### File Organization
- Keep files under 500 lines when possible
- One main class per file
- Group related functionality
- Use clear, descriptive filenames

### Performance Guidelines
- Avoid `new` in game loops (use object pools)
- Cache frequently accessed DOM elements
- Use `requestAnimationFrame` for animations
- Minimize garbage collection with efficient algorithms

## Debugging Tools

### Console Commands
```javascript
// Available in browser console:
gameDebug.getStats();           // Get performance info
gameDebug.enableDebug();        // Enable debug overlay
gameDebug.togglePause();        // Pause/unpause game
gameDebug.getGame().player.x;   // Access game objects
```

### Debug Overlays
```javascript
// In renderer.js, add debug wireframes:
if (window.DEBUG_MODE) {
    this.renderWireframe(player, map);
    this.renderRayDebug(player);
}
```

### Performance Profiling
```javascript
// Add timing to critical functions:
const startTime = performance.now();
this.heavyFunction();
const endTime = performance.now();
console.log(`Function took ${endTime - startTime}ms`);
```

## Testing

### Unit Tests (if adding a test framework)
```javascript
// tests/math.test.js
describe('MathUtils', () => {
    test('normalizeAngle wraps correctly', () => {
        expect(MathUtils.normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
    });
});
```

### Manual Testing Checklist
- [ ] Movement in all directions
- [ ] Collision detection on all wall types
- [ ] Mouse look sensitivity
- [ ] Weapon switching
- [ ] Item collection
- [ ] Performance at different resolutions
- [ ] Pause/resume functionality

## Building for Production

1. **Minification** (optional):
```bash
# Using terser for JS minification
npx terser js/main.js -c -m -o js/main.min.js
```

2. **Asset optimization**:
- Compress textures and audio files
- Use sprite sheets for multiple images
- Enable gzip compression on server

3. **Browser compatibility**:
- Test on different browsers
- Add polyfills if needed
- Consider fallbacks for older devices

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Follow the code style guide
4. Add documentation for new features
5. Test thoroughly
6. Submit a pull request

## Common Issues

**Low FPS**: Reduce ray count or canvas resolution
**Stuttering**: Check for memory leaks or excessive garbage collection
**Input lag**: Verify proper event handling and avoid blocking operations
**Collision bugs**: Debug with wireframe rendering enabled