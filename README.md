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
dailydoom/
├── index.html              # Main HTML file
├── js/
│   ├── main.js             # Entry point and initialization
│   ├── engine/
│   │   ├── math.js         # Math utilities and Vector2 class
│   │   ├── renderer.js     # Raycasting renderer
│   │   ├── input.js        # Input management system
│   │   └── game.js         # Core game engine and loop
│   ├── world/
│   │   └── map.js          # Game world and collision detection
│   ├── entities/
│   │   ├── player.js       # Player entity and movement
│   │   ├── enemy.js        # Enemy base class and AI
│   │   ├── enemy-behaviors.js  # Advanced enemy behavior system
│   │   └── pickup.js       # Items and power-ups
│   ├── weapons/
│   │   └── weapon.js       # Weapon system and combat
│   ├── audio/
│   │   └── sound-engine.js # Procedural audio via Web Audio API
│   └── ui/
│       └── hud.js          # Heads-up display rendering
├── assets/                 # Sprites and textures
├── playtester/             # Automated regression test suite
│   ├── run-tests.js        # Test runner (produces report.json)
│   ├── tests.js            # Test definitions (Tier 1 + Tier 2)
│   ├── playwright.config.js
│   ├── package.json
│   └── screenshots/        # Canonical screenshots per run
└── .github/workflows/
    ├── pages.yml           # GitHub Pages deployment
    └── playtester.yml      # Playtester CI checks
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

## Automated Playtester

The `/playtester` directory contains a Playwright-based regression test suite that runs against the live GitHub Pages deployment. It catches regressions and produces a structured report with canonical screenshots.

### Running locally

```bash
cd playtester
npm install
npx playwright install chromium
DAILYDOOM_URL=http://localhost:8080 node run-tests.js
```

### Test tiers

**Tier 1 — Engine Baseline** (9 tests, never removable):

| ID | Test | Pass Condition |
|----|------|----------------|
| T1-01 | No console errors | Zero `console.error` calls during load |
| T1-02 | Canvas present | `<canvas>` exists with non-zero size |
| T1-03 | HUD renders | Health, Ammo, FPS, X, Y, Angle elements in DOM |
| T1-04 | Player spawns | X and Y are numeric after 1s |
| T1-05 | Render loop running | FPS > 0 after 2s |
| T1-06 | Player movement | X or Y changes after holding W for 1s |
| T1-07 | Player rotation | Angle changes after holding ArrowRight for 1s |
| T1-08 | Canonical screenshot | Screenshot saved to `screenshots/latest.png` |
| T1-09 | FPS threshold | FPS >= 20 after 3s |

**Tier 2 — Feature Tests** are added as new features land, each tagged with the GitHub issue that introduced it.

### Output

Each run produces `playtester/report.json` with pass/fail results and `playtester/screenshots/latest.png` (previous run preserved as `previous.png`).

### CI

The `playtester.yml` GitHub Action runs on every push to main:
1. Guards against removal or weakening of existing tests
2. Runs the full suite against the GitHub Pages deployment
3. Posts results as a commit status check

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