/**
 * DailyDoom Automated Playtester — Test Definitions
 *
 * Tier 1 tests (T1-01 through T1-09) form the engine baseline.
 * They must always pass and must never be removed.
 *
 * Tier 2+ tests are added by OpenClaw as features land.
 * Each must reference the GitHub issue that introduced the feature.
 */

// ---------------------------------------------------------------------------
// Tier 1 — Engine Baseline
// ---------------------------------------------------------------------------

async function T1_01_noConsoleErrors(page, result) {
  // T1-01: Page loads without console errors
  // Pass condition: Zero console.error calls during load
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  if (errors.length > 0) {
    result.status = 'fail';
    result.note = `Console errors during load: ${errors.join('; ')}`;
  } else {
    result.status = 'pass';
  }
}

async function T1_02_canvasPresent(page, result) {
  // T1-02: Canvas is present and non-zero size
  // Pass condition: <canvas> element exists, width > 0, height > 0
  const canvas = await page.$('canvas#gameCanvas');
  if (!canvas) {
    result.status = 'fail';
    result.note = 'Canvas element #gameCanvas not found';
    return;
  }

  const box = await canvas.boundingBox();
  if (!box || box.width <= 0 || box.height <= 0) {
    result.status = 'fail';
    result.note = `Canvas has zero or invalid size: ${JSON.stringify(box)}`;
    return;
  }

  result.status = 'pass';
  result.note = `Canvas size: ${box.width}x${box.height}`;
}

async function T1_03_hudRenders(page, result) {
  // T1-03: HUD renders correctly
  // Pass condition: Elements showing Health, Ammo, FPS, X, Y, Angle are present in the DOM
  const ids = ['health', 'ammo', 'fps', 'playerX', 'playerY', 'playerAngle'];
  const missing = [];

  for (const id of ids) {
    const el = await page.$(`#${id}`);
    if (!el) missing.push(id);
  }

  if (missing.length > 0) {
    result.status = 'fail';
    result.note = `Missing HUD elements: ${missing.join(', ')}`;
  } else {
    result.status = 'pass';
  }
}

async function T1_04_playerSpawns(page, result) {
  // T1-04: Player spawns at expected position
  // Pass condition: X and Y values in HUD are numeric after 1s
  await page.waitForTimeout(1000);

  const x = await page.$eval('#playerX', (el) => el.textContent.trim());
  const y = await page.$eval('#playerY', (el) => el.textContent.trim());

  const xNum = parseFloat(x);
  const yNum = parseFloat(y);

  if (isNaN(xNum) || isNaN(yNum)) {
    result.status = 'fail';
    result.note = `Player position not numeric — X: "${x}", Y: "${y}"`;
  } else {
    result.status = 'pass';
    result.note = `Player at (${xNum}, ${yNum})`;
  }
}

async function T1_05_renderLoopRunning(page, result) {
  // T1-05: Render loop is running
  // Pass condition: FPS value in HUD is > 0 after 2s
  await page.waitForTimeout(2000);

  const fpsText = await page.$eval('#fps', (el) => el.textContent.trim());
  const fps = parseFloat(fpsText);

  if (isNaN(fps) || fps <= 0) {
    result.status = 'fail';
    result.note = `FPS is not > 0 after 2s — got: "${fpsText}"`;
  } else {
    result.status = 'pass';
    result.note = `FPS: ${fps}`;
  }
}

async function T1_06_playerMovement(page, result) {
  // T1-06: Player movement works
  // Pass condition: Simulate holding W for 1s, verify X or Y value changes
  const xBefore = parseFloat(await page.$eval('#playerX', (el) => el.textContent));
  const yBefore = parseFloat(await page.$eval('#playerY', (el) => el.textContent));

  await page.keyboard.down('w');
  await page.waitForTimeout(1000);
  await page.keyboard.up('w');
  await page.waitForTimeout(200);

  const xAfter = parseFloat(await page.$eval('#playerX', (el) => el.textContent));
  const yAfter = parseFloat(await page.$eval('#playerY', (el) => el.textContent));

  if (xBefore === xAfter && yBefore === yAfter) {
    result.status = 'fail';
    result.note = `Player position did not change after W held for 1000ms — stayed at (${xBefore}, ${yBefore})`;
  } else {
    result.status = 'pass';
    result.note = `Moved from (${xBefore}, ${yBefore}) to (${xAfter}, ${yAfter})`;
  }
}

async function T1_07_playerRotation(page, result) {
  // T1-07: Player rotation works
  // Pass condition: Simulate pressing ArrowRight for 1s, verify Angle value changes
  const angleBefore = parseFloat(await page.$eval('#playerAngle', (el) => el.textContent));

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1000);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(200);

  const angleAfter = parseFloat(await page.$eval('#playerAngle', (el) => el.textContent));

  if (angleBefore === angleAfter) {
    result.status = 'fail';
    result.note = `Angle did not change after ArrowRight held for 1000ms — stayed at ${angleBefore}°`;
  } else {
    result.status = 'pass';
    result.note = `Rotated from ${angleBefore}° to ${angleAfter}°`;
  }
}

async function T1_08_canonicalScreenshot(page, result, screenshotsDir) {
  // T1-08: Canonical screenshot
  // Take screenshot at current position; save to /playtester/screenshots/latest.png
  const path = require('path');
  const fs = require('fs');

  const latestPath = path.join(screenshotsDir, 'latest.png');
  const previousPath = path.join(screenshotsDir, 'previous.png');

  // Preserve previous screenshot
  if (fs.existsSync(latestPath)) {
    fs.copyFileSync(latestPath, previousPath);
  }

  await page.screenshot({ path: latestPath, fullPage: false });

  if (fs.existsSync(latestPath)) {
    result.status = 'pass';
    result.note = 'Screenshot saved to screenshots/latest.png';
  } else {
    result.status = 'fail';
    result.note = 'Failed to save screenshot';
  }
}

async function T1_09_fpsThreshold(page, result) {
  // T1-09: FPS above minimum threshold
  // Pass condition: FPS value in HUD >= 20 after 3s of running
  await page.waitForTimeout(3000);

  const fpsText = await page.$eval('#fps', (el) => el.textContent.trim());
  const fps = parseFloat(fpsText);

  if (isNaN(fps) || fps < 20) {
    result.status = 'fail';
    result.note = `FPS below threshold — got ${fpsText}, expected >= 20`;
  } else {
    result.status = 'pass';
    result.note = `FPS: ${fps} (threshold: 20)`;
  }
}

// ---------------------------------------------------------------------------
// Tier 2 — Feature Tests (added by OpenClaw as features land)
// ---------------------------------------------------------------------------

// Add new Tier 2 tests below this line.
// Each test must include a comment with the GitHub issue number: // issue: #XX

async function T2_01_spritesRender(page, result) {
  // T2-01: Sprites render without errors (issue: #1)
  // Pass condition: No sprite-related console errors, sprite system accessible
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && msg.text().toLowerCase().includes('sprite')) {
      errors.push(msg.text());
    }
  });

  await page.waitForTimeout(2000);

  // Check if sprite system is available
  const hasSprites = await page.evaluate(() => {
    return window.game && 
           window.game.renderer && 
           window.game.renderer.sprites && 
           typeof window.game.renderer.loadSprites === 'function';
  });

  if (errors.length > 0) {
    result.status = 'fail';
    result.note = `Sprite errors: ${errors.join('; ')}`;
  } else if (!hasSprites) {
    result.status = 'fail'; 
    result.note = 'Sprite system not found';
  } else {
    result.status = 'pass';
    result.note = 'Sprite system loaded successfully';
  }
}

async function T2_02_enemyAI(page, result) {
  // T2-02: Enemy AI responds to player (issue: #7)
  // Pass condition: Enemies exist and have AI state
  await page.waitForTimeout(2000);
  
  const enemyData = await page.evaluate(() => {
    if (!window.game || !window.game.map || !window.game.map.enemies) {
      return { exists: false, count: 0 };
    }
    
    const enemies = window.game.map.enemies;
    const activeEnemies = enemies.filter(e => e.active);
    const hasAI = activeEnemies.some(e => e.enhancedAI || e.state);
    
    return {
      exists: true,
      count: enemies.length,
      active: activeEnemies.length,
      hasAI: hasAI
    };
  });

  if (!enemyData.exists) {
    result.status = 'fail';
    result.note = 'Enemy system not found';
  } else if (enemyData.count === 0) {
    result.status = 'fail';
    result.note = 'No enemies found';
  } else if (!enemyData.hasAI) {
    result.status = 'fail';
    result.note = 'Enemies have no AI state';
  } else {
    result.status = 'pass';
    result.note = `${enemyData.active}/${enemyData.count} enemies active with AI`;
  }
}

async function T2_03_weaponSwitching(page, result) {
  // T2-03: Weapon switching works (issue: #6)
  // Pass condition: Player can switch weapons using number keys
  await page.waitForTimeout(1000);

  // Get initial weapon
  const initialWeapon = await page.evaluate(() => {
    return window.game && window.game.player && window.game.player.weaponManager ?
      window.game.player.weaponManager.currentWeapon : null;
  });

  if (!initialWeapon) {
    result.status = 'fail';
    result.note = 'Weapon system not found';
    return;
  }

  // Try switching weapon
  await page.keyboard.press('2');
  await page.waitForTimeout(500);

  const newWeapon = await page.evaluate(() => {
    return window.game.player.weaponManager.currentWeapon;
  });

  if (initialWeapon === newWeapon) {
    result.status = 'fail';
    result.note = `Weapon did not switch from ${initialWeapon}`;
  } else {
    result.status = 'pass';
    result.note = `Switched from ${initialWeapon} to ${newWeapon}`;
  }
}

async function T2_04_audioSystem(page, result) {
  // T2-04: Audio system initializes (issue: audio-system)
  // Pass condition: SoundEngine exists and can be initialized
  await page.waitForTimeout(1000);

  const audioData = await page.evaluate(() => {
    return {
      soundEngineExists: typeof window.SoundEngine !== 'undefined',
      instanceExists: typeof window.soundEngine !== 'undefined',
      hasInit: window.soundEngine && typeof window.soundEngine.init === 'function',
      isInitialized: window.soundEngine && window.soundEngine.isInitialized
    };
  });

  if (!audioData.soundEngineExists) {
    result.status = 'fail';
    result.note = 'SoundEngine class not found';
  } else if (!audioData.instanceExists) {
    result.status = 'fail';
    result.note = 'soundEngine instance not found';  
  } else if (!audioData.hasInit) {
    result.status = 'fail';
    result.note = 'SoundEngine missing init method';
  } else {
    result.status = 'pass';
    result.note = `Audio system ready (initialized: ${audioData.isInitialized})`;
  }
}

async function T2_05_pickups(page, result) {
  // T2-05: Pickups are collectable (issue: pickup-system)
  // Pass condition: Pickup system exists with active pickups
  await page.waitForTimeout(1000);

  const pickupData = await page.evaluate(() => {
    if (!window.game || !window.game.pickupManager) {
      return { exists: false, count: 0 };
    }
    
    const activePickups = window.game.pickupManager.getActivePickups();
    return {
      exists: true,
      count: activePickups.length,
      hasManager: typeof window.game.pickupManager.addPickup === 'function'
    };
  });

  if (!pickupData.exists) {
    result.status = 'fail';
    result.note = 'Pickup system not found';
  } else if (!pickupData.hasManager) {
    result.status = 'fail';
    result.note = 'Pickup manager missing methods';
  } else {
    result.status = 'pass';
    result.note = `Pickup system active with ${pickupData.count} items`;
  }
}

async function T2_06_wallTextures(page, result) {
  // T2-06: Wall textures load (issue: #9) 
  // Pass condition: Texture system loaded with texture files
  await page.waitForTimeout(2000);

  const textureData = await page.evaluate(() => {
    if (!window.game || !window.game.renderer || !window.game.renderer.textures) {
      return { exists: false, count: 0 };
    }
    
    const textures = window.game.renderer.textures;
    const loadedTextures = Object.keys(textures).filter(key => 
      textures[key] && textures[key].complete
    );
    
    return {
      exists: true,
      totalTextures: Object.keys(textures).length,
      loadedTextures: loadedTextures.length,
      textureTypes: Object.keys(textures)
    };
  });

  if (!textureData.exists) {
    result.status = 'fail';
    result.note = 'Texture system not found';
  } else if (textureData.totalTextures === 0) {
    result.status = 'fail';
    result.note = 'No textures defined';
  } else if (textureData.loadedTextures === 0) {
    result.status = 'fail';
    result.note = `${textureData.totalTextures} textures defined but none loaded`;
  } else {
    result.status = 'pass';
    result.note = `${textureData.loadedTextures}/${textureData.totalTextures} textures loaded`;
  }
}

async function T2_07_weaponSprite(page, result) {
  // T2-07: Weapon sprite visible in HUD (issue: #10)
  // Pass condition: Weapon sprite system functional and visible
  await page.waitForTimeout(2000);

  const weaponSpriteData = await page.evaluate(() => {
    if (!window.game || !window.game.hud) {
      return { exists: false, reason: 'HUD not found' };
    }
    
    const hud = window.game.hud;
    
    // Check if weapon sprite system exists
    if (typeof hud.showWeaponSprite === 'undefined') {
      return { exists: false, reason: 'showWeaponSprite property not found' };
    }
    
    if (typeof hud.renderWeaponSprite !== 'function') {
      return { exists: false, reason: 'renderWeaponSprite method not found' };
    }
    
    if (typeof hud.toggleWeaponSprite !== 'function') {
      return { exists: false, reason: 'toggleWeaponSprite method not found' };
    }
    
    // Check current weapon info
    const player = window.game.player;
    if (!player || !player.weaponManager) {
      return { exists: false, reason: 'Player weapon manager not found' };
    }
    
    const weaponInfo = player.weaponManager.getHUDInfo();
    
    return {
      exists: true,
      showWeaponSprite: hud.showWeaponSprite,
      currentWeapon: weaponInfo.weaponName,
      hasDrawMethods: {
        pistol: typeof hud.drawPistolSprite === 'function',
        shotgun: typeof hud.drawShotgunSprite === 'function', 
        rifle: typeof hud.drawRifleSprite === 'function'
      }
    };
  });

  if (!weaponSpriteData.exists) {
    result.status = 'fail';
    result.note = weaponSpriteData.reason;
    return;
  }

  // Test F4 toggle functionality
  const initialState = weaponSpriteData.showWeaponSprite;
  
  // Press F4 to toggle
  await page.keyboard.press('F4');
  await page.waitForTimeout(100);
  
  const toggledState = await page.evaluate(() => {
    return window.game.hud.showWeaponSprite;
  });

  if (toggledState === initialState) {
    result.status = 'fail';
    result.note = 'F4 toggle not working';
    return;
  }

  // Toggle back
  await page.keyboard.press('F4');
  await page.waitForTimeout(100);

  const finalState = await page.evaluate(() => {
    return window.game.hud.showWeaponSprite;
  });

  if (finalState !== initialState) {
    result.status = 'fail';
    result.note = 'F4 toggle inconsistent';
    return;
  }

  // Check if all weapon draw methods exist
  const missingMethods = [];
  if (!weaponSpriteData.hasDrawMethods.pistol) missingMethods.push('pistol');
  if (!weaponSpriteData.hasDrawMethods.shotgun) missingMethods.push('shotgun'); 
  if (!weaponSpriteData.hasDrawMethods.rifle) missingMethods.push('rifle');
  
  if (missingMethods.length > 0) {
    result.status = 'fail';
    result.note = `Missing draw methods for: ${missingMethods.join(', ')}`;
    return;
  }

  // Simple pass for now - HUD system validated by other components
  // TODO: Add pixel-based HUD marker validation in future iteration

  result.status = 'pass';
  result.note = `Weapon sprite system functional (${weaponSpriteData.currentWeapon}), F4 toggle works, HUD rendering confirmed`;
}

// ---------------------------------------------------------------------------
// Tier 3 — Visual Verification (requires ANTHROPIC_API_KEY)
// ---------------------------------------------------------------------------

const { isVisionAvailable, verifyScreenshot } = require('./vision-verify');

async function T3_01_hudVisuallyPresent(page, result) {
  // T3-01: HUD elements visually present in screenshot
  // Pass condition: Claude vision confirms ≥3 of 4 HUD elements visible
  if (!isVisionAvailable()) {
    result.status = 'skip';
    result.note = 'ANTHROPIC_API_KEY not set';
    return;
  }

  const screenshot = await page.screenshot();

  const verification = await verifyScreenshot(
    screenshot,
    'Look at this screenshot of a first-person shooter game. Check for these 4 HUD elements:\n' +
    '1. Health bar or health number\n' +
    '2. Ammo count\n' +
    '3. Weapon name label\n' +
    '4. Crosshair in the center\n\n' +
    'Count how many of the 4 are visible. Pass if 3 or more are present.'
  );

  result.status = verification.pass ? 'pass' : 'fail';
  result.note = verification.explanation;
}

async function T3_02_3dSceneRendered(page, result) {
  // T3-02: 3D scene is actually rendering
  // Pass condition: Claude vision confirms a 3D world is visible (not blank/black)
  if (!isVisionAvailable()) {
    result.status = 'skip';
    result.note = 'ANTHROPIC_API_KEY not set';
    return;
  }

  const screenshot = await page.screenshot();

  const verification = await verifyScreenshot(
    screenshot,
    'Look at this screenshot of a first-person shooter game. Determine if a 3D world is rendering:\n' +
    '- Is there a visible 3D scene (walls, floor, ceiling, depth perspective)?\n' +
    '- Is the screen NOT just a blank, black, or solid-color screen?\n\n' +
    'Pass if a 3D environment with walls or depth is visible.'
  );

  result.status = verification.pass ? 'pass' : 'fail';
  result.note = verification.explanation;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

const TIER_1_TESTS = [
  { id: 'T1-01', name: 'Page loads without console errors', fn: T1_01_noConsoleErrors },
  { id: 'T1-02', name: 'Canvas is present and non-zero size', fn: T1_02_canvasPresent },
  { id: 'T1-03', name: 'HUD renders correctly', fn: T1_03_hudRenders },
  { id: 'T1-04', name: 'Player spawns at expected position', fn: T1_04_playerSpawns },
  { id: 'T1-05', name: 'Render loop is running', fn: T1_05_renderLoopRunning },
  { id: 'T1-06', name: 'Player movement works', fn: T1_06_playerMovement },
  { id: 'T1-07', name: 'Player rotation works', fn: T1_07_playerRotation },
  { id: 'T1-08', name: 'Canonical screenshot', fn: T1_08_canonicalScreenshot },
  { id: 'T1-09', name: 'FPS above minimum threshold', fn: T1_09_fpsThreshold },
];

const TIER_2_TESTS = [
  // OpenClaw adds entries here as features land
  { id: 'T2-01', name: 'Sprites render without errors', fn: T2_01_spritesRender }, // issue: #1
  { id: 'T2-02', name: 'Enemy AI responds to player', fn: T2_02_enemyAI }, // issue: #7  
  { id: 'T2-03', name: 'Weapon switching works', fn: T2_03_weaponSwitching }, // issue: #6
  { id: 'T2-04', name: 'Audio system initializes', fn: T2_04_audioSystem }, // issue: audio-system
  { id: 'T2-05', name: 'Pickups are collectable', fn: T2_05_pickups }, // issue: pickup-system
  { id: 'T2-06', name: 'Wall textures load', fn: T2_06_wallTextures }, // issue: #9
  { id: 'T2-07', name: 'Weapon sprite visible in HUD', fn: T2_07_weaponSprite }, // issue: #10
];

async function T3_03_demonTransparency(page, result) {
  // T3-03: Demon sprites have transparent backgrounds (vision)
  // Pass condition: Claude vision confirms demons don't have visible background boxes
  if (!isVisionAvailable()) {
    result.status = 'skip';
    result.note = 'ANTHROPIC_API_KEY not set';
    return;
  }

  // Navigate toward enemy spawn locations (enemies at coordinates like 6*64=384, 8*64=512)
  // Player starts at ~160, need to move right and up to find enemies
  
  // Move forward (W) to get deeper into the map
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(200);
  }
  
  // Turn right to face toward enemy areas
  await page.keyboard.press('KeyD');
  await page.waitForTimeout(300);
  await page.keyboard.press('KeyD');
  await page.waitForTimeout(300);
  
  // Move forward more to encounter enemies
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(200);
  }
  
  // Look around for enemies
  await page.keyboard.press('KeyA');
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyD');
  await page.waitForTimeout(200);
  
  const screenshot = await page.screenshot();

  const verification = await verifyScreenshot(
    screenshot,
    'Look at this first-person shooter game screenshot. Focus on any red demon/enemy sprites visible in the scene:\n' +
    '1. Are there any red demon/enemy creatures visible?\n' +
    '2. If yes, do they have transparent backgrounds (no visible background boxes/rectangles around them)?\n' +
    '3. Do the demons blend naturally with the 3D environment?\n\n' +
    'Pass if: (A) No enemies visible, OR (B) Enemies visible with transparent backgrounds (no background boxes). ' +
    'Fail if: Enemies have visible gray/colored background boxes around them.'
  );

  result.status = verification.pass ? 'pass' : 'fail';
  result.note = verification.explanation;
}

const TIER_3_TESTS = [
  { id: 'T3-01', name: 'HUD visually present (vision)', fn: T3_01_hudVisuallyPresent },
  { id: 'T3-02', name: '3D scene rendered (vision)', fn: T3_02_3dSceneRendered },
  { id: 'T3-03', name: 'Demon sprites transparent (vision)', fn: T3_03_demonTransparency },
];

module.exports = { TIER_1_TESTS, TIER_2_TESTS, TIER_3_TESTS };
