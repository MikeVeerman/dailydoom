# Contributing to Daily Doom

## Quick Start

1. Clone the repo and start the local server:
   ```bash
   git clone https://github.com/MikeVeerman/dailydoom.git
   cd dailydoom
   python3 -m http.server 8080
   ```
2. Open http://localhost:8080 in your browser
3. Run the test suite:
   ```bash
   bash test-local.sh
   ```

## Development Workflow

1. Pick an open issue from the [issue tracker](https://github.com/MikeVeerman/dailydoom/issues)
2. Create a branch or work on main (for small changes)
3. Implement the feature/fix
4. Add a Tier 2 test in `playtester/tests.js` following the existing pattern
5. Run `bash test-local.sh` and ensure all tests pass
6. Add a devlog entry in `devlog/`
7. Commit with the issue number in the message (e.g. `Fix occlusion bug (#27)`)

## Project Structure

```
js/
  engine/     - Core systems (renderer, input, game loop)
  entities/   - Game entities (player, enemies, pickups)
  weapons/    - Weapon system
  world/      - Map and collision
  audio/      - Procedural sound
  ui/         - HUD and particles
playtester/   - Playwright-based test suite
assets/       - Sprites and textures
blog/         - Development blog entries
devlog/       - Per-session development logs
```

## Testing

- **Tier 1 (T1-01 to T1-09):** Engine baseline tests. Must always pass. Never remove.
- **Tier 2 (T2-XX):** Feature tests. Add one per feature/bugfix. Reference the issue number.
- **Tier 3 (T3-XX):** Vision tests using Claude API (optional, requires ANTHROPIC_API_KEY).

### Adding a New Test

```javascript
async function T2_XX_yourTestName(page, result) {
  // T2-XX: Description (issue: #XX)
  await page.waitForTimeout(1000);

  const data = await page.evaluate(() => {
    // Check your feature exists and works
    return { exists: true, works: true };
  });

  if (!data.exists || !data.works) {
    result.status = 'fail';
    result.note = 'Reason for failure';
  } else {
    result.status = 'pass';
    result.note = 'What passed';
  }
}
```

Then add it to the `TIER_2_TESTS` array at the bottom of `tests.js`.

## Code Style

- No build step required - vanilla JavaScript with ES6 classes
- Systems expose themselves on `window` for cross-system access
- Use `deltaTime` (already in seconds) for frame-independent movement
- Performance target: 60 FPS, minimum 20 FPS

## Roles

- **Owner:** Manages the repo, merges PRs, sets direction
- **Contributor:** Submits issues, PRs, and code changes
- **AI Assistant:** Claude Code handles implementation via `INSTRUCTIONS.MD`

## Starter Tasks

Good first issues for new contributors:
- Add a new wall texture type
- Create a new enemy behavior variant
- Add a new pickup/power-up type
- Improve an existing test with more validation cases
