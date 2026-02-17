# Doom-Style FPS Engine

A complete web-based first-person shooter engine built from scratch using HTML5 Canvas and JavaScript, featuring raycasting rendering similar to the original Doom.

## Features

### Core Engine
- **Raycasting Renderer**: Full 3D-looking rendering using 2D raycasting techniques
- **Real-time Game Loop**: 60 FPS target with delta time calculations
- **Collision Detection**: Circle-based collision for smooth wall sliding
- **Input Handling**: Keyboard + mouse controls with pointer lock
- **Modular Architecture**: Clean separation of concerns

### Gameplay
- **WASD Movement**: Standard FPS controls
- **Mouse Look**: Full 360° camera control
- **Multiple Weapons**: Pistol, Shotgun, Rifle with different stats
- **Health/Ammo System**: Collectible items and resource management
- **Head Bobbing**: Realistic movement animation
- **Running/Crouching**: Different movement speeds

### Technical
- **Performance Optimized**: Pixel buffer rendering for speed
- **Debug Mode**: F1 to toggle debug information
- **Responsive Canvas**: Automatic resize handling
- **Memory Efficient**: Minimal garbage collection

## Project Structure

```
doom-fps/
├── index.html              # Main HTML file
├── README.md              # This file
└── js/
    ├── main.js            # Entry point and initialization
    ├── engine/
    │   ├── math.js        # Math utilities and Vector2 class
    │   ├── renderer.js    # Raycasting renderer
    │   ├── input.js       # Input management system
    │   └── game.js        # Core game engine and loop
    ├── world/
    │   └── map.js         # Game world and collision detection
    └── entities/
        └── player.js      # Player entity and movement
```

## Quick Start

1. **Clone/Download** the project files
2. **Serve via HTTP**: Open `index.html` in a web server (not file://)
   - Python: `python -m http.server 8000`
   - Node.js: `npx serve .`
   - Or use any local web server
3. **Open in Browser**: Navigate to `http://localhost:8000`
4. **Click Canvas**: Click to lock mouse pointer
5. **Play!**

## Controls

| Key | Action |
|-----|--------|
| **W/A/S/D** | Move forward/left/backward/right |
| **Mouse** | Look around (requires pointer lock) |
| **Shift** | Run (faster movement) |
| **Ctrl** | Crouch (slower movement) |
| **Space** | Jump |
| **E** | Use/Interact |
| **R** | Reload |
| **1/2/3** | Switch weapons |
| **ESC** | Release pointer lock |
| **F1** | Toggle debug mode |

## Architecture Overview

### Engine Systems

**GameEngine** (`js/engine/game.js`)
- Main game loop and system coordination
- Frame rate management and timing
- State management (playing/paused/menu)
- Performance monitoring

**Renderer** (`js/engine/renderer.js`)
- Raycasting algorithm implementation
- Wall height calculations and fish-eye correction
- Pixel-level rendering for performance
- Shading and distance-based lighting

**InputManager** (`js/engine/input.js`)
- Keyboard and mouse event handling
- Pointer lock management
- Input state tracking and smoothing
- Action mapping system

**Player** (`js/entities/player.js`)
- Movement physics and collision detection
- Health, ammo, and weapon systems
- Input processing and response
- Animation systems (head bobbing)

**GameMap** (`js/world/map.js`)
- Level definition and wall data
- Collision detection algorithms
- Item placement and collection
- Line-of-sight calculations

### Raycasting Algorithm

The rendering system uses a raycasting approach:

1. **For each screen column**:
   - Cast a ray from player position at calculated angle
   - March ray forward until hitting a wall
   - Calculate perpendicular distance (fish-eye correction)
   - Determine wall height based on distance
   - Apply shading and render column

2. **Performance optimizations**:
   - Pixel buffer rendering (avoid individual fillRect calls)
   - Precalculated trigonometric tables
   - Efficient collision detection
   - Minimal object allocation

## Customization

### Adding New Levels
Edit the `grid` array in `js/world/map.js`:
- `0` = Empty space
- `1-8` = Different wall types (different colors)

### Modifying Graphics
Colors and visual settings in `js/engine/renderer.js`:
- `wallColors`: Wall color mapping
- `floorColor`/`ceilingColor`: Environment colors
- `wallHeight`: 3D projection scale

### Adjusting Gameplay
Player settings in `js/entities/player.js`:
- `speed`: Movement speed
- `turnSpeed`: Mouse sensitivity
- `health`/`ammo`: Starting values

## Debug Mode

Press **F1** to enable debug mode, showing:
- Real-time FPS and frame timing
- Player position and angle
- Velocity vectors
- Input states
- Performance metrics

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (requires HTTPS for pointer lock in some versions)
- **Mobile**: Limited (no pointer lock, touch controls needed)

## Performance Notes

- Target: 60 FPS at 800x600 resolution
- Scales well with resolution (fewer rays = better performance)
- Memory usage: ~10-20MB typical
- CPU usage: Moderate (single-threaded JavaScript)

## Future Enhancements

Potential additions:
- Sprite rendering (enemies, items, decorations)
- Audio system (positional 3D sound)
- Texture mapping for walls
- Animated sprites and effects
- Multiplayer networking
- Map editor
- Mobile touch controls

## Development

Global debug object available in console:
```javascript
// Enable debug mode
gameDebug.enableDebug();

// Get performance stats
gameDebug.getStats();

// Toggle pause
gameDebug.togglePause();

// Restart game
gameDebug.restart();
```

## License

This is a educational/demonstration project. Feel free to use and modify for learning purposes.

---

Built with ❤️ as a Doom tribute. *RIP & TEAR!*