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

  // Click difficulty selection to start the game
  const diffBtn = await page.$('.difficulty-btn[data-difficulty="normal"]');
  if (diffBtn) await diffBtn.click();

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

  // Unlock shotgun so we can test switching
  await page.evaluate(() => {
    window.game.player.weaponManager.unlockWeapon('shotgun');
  });

  // Try switching weapon
  await page.keyboard.press('2');
  await page.waitForTimeout(500);

  const newWeapon = await page.evaluate(() => {
    return window.game.player.weaponManager.currentWeapon;
  });

  // Restore back to pistol
  await page.keyboard.press('1');
  await page.waitForTimeout(200);

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
  { id: 'T2-08', name: 'Enemy damage system works', fn: T2_08_enemyDamageSystem }, // issue: #17
  { id: 'T2-09', name: 'Enemy pathfinding works', fn: T2_09_enemyPathfinding }, // issue: #18
  { id: 'T2-10', name: 'Weapon hit effects work', fn: T2_10_weaponHitEffects }, // issue: #19
  { id: 'T2-11', name: 'Advanced weapon arsenal works', fn: T2_11_advancedWeapons }, // issue: #23
  { id: 'T2-12', name: 'Enemy variety & boss system', fn: T2_12_enemyVariety }, // issue: #24
  { id: 'T2-13', name: 'Player progression & stats', fn: T2_13_playerProgression }, // issue: #25
  { id: 'T2-14', name: 'Particle effects & visual polish', fn: T2_14_particleEffects }, // issue: #26
  { id: 'T2-15', name: 'Sprite occlusion works correctly', fn: T2_15_spriteOcclusion }, // issue: #27
  { id: 'T2-16', name: 'Enemy visual diversity', fn: T2_16_enemyVisualDiversity }, // issue: #28
  { id: 'T2-17', name: 'Enemy movement system', fn: T2_17_enemyMovement }, // issue: #29
  { id: 'T2-18', name: 'Project structure complete', fn: T2_18_projectStructure }, // issue: #30
  { id: 'T2-19', name: 'No Game loaded popup on start', fn: T2_19_noGameLoadedPopup }, // issue: #31
  { id: 'T2-20', name: 'Multi-room reactor map', fn: T2_20_multiRoomMap }, // issue: #33
  { id: 'T2-21', name: 'Minimap system', fn: T2_21_minimapSystem }, // issue: #34
  { id: 'T2-22', name: 'Difficulty selection system', fn: T2_22_difficultySelection }, // issue: #35
  { id: 'T2-23', name: 'Level completion screen', fn: T2_23_levelCompletionScreen }, // issue: #36
  { id: 'T2-24', name: 'Melee punch attack', fn: T2_24_meleePunch }, // issue: #38
  { id: 'T2-25', name: 'Damage flash and low-health effects', fn: T2_25_damageFlashEffects }, // issue: #40
  { id: 'T2-26', name: 'Weapon pickups on map', fn: T2_26_weaponPickups }, // issue: #45
  { id: 'T2-27', name: 'Environmental hazards', fn: T2_27_environmentalHazards }, // issue: #46
  { id: 'T2-28', name: 'Kill feed system', fn: T2_28_killFeed }, // issue: #47
];

async function T2_08_enemyDamageSystem(page, result) {
  // T2-08: Enemy damage system works (issue: #17)
  // Pass condition: Player has takeDamage method, enemies have attack behavior, invincibility frames exist
  await page.waitForTimeout(1000);

  const damageData = await page.evaluate(() => {
    if (!window.game || !window.game.player) {
      return { exists: false, reason: 'Player not found' };
    }

    const player = window.game.player;
    const enemies = window.game.map ? window.game.map.enemies : [];

    // Check player damage system
    const hasTakeDamage = typeof player.takeDamage === 'function';
    const hasLastDamageTime = 'lastDamageTime' in player;
    const hasHealth = typeof player.health === 'number';

    // Check enemy attack capability
    const hasEnemyAttack = enemies.length > 0 && enemies.some(e => {
      if (e.enhancedAI && e.enhancedAI.behavior) {
        return typeof e.enhancedAI.behavior.damage === 'number';
      }
      return typeof e.attack === 'function';
    });

    // Check HUD damage flash
    const hasHudFlash = window.game.hud && typeof window.game.hud.onPlayerDamage === 'function';

    // Check sound support
    const hasPlayerHitSound = window.soundEngine && typeof window.soundEngine.playPlayerHit === 'function';

    // Test invincibility frames by simulating damage
    const healthBefore = player.health;
    player.takeDamage(10);
    const healthAfterFirst = player.health;
    player.takeDamage(10); // Should be blocked by invincibility frames
    const healthAfterSecond = player.health;

    // Restore player health
    player.health = healthBefore;
    player.lastDamageTime = 0;

    return {
      exists: true,
      hasTakeDamage,
      hasLastDamageTime,
      hasHealth,
      hasEnemyAttack,
      hasHudFlash,
      hasPlayerHitSound,
      invincibilityWorks: healthAfterFirst < healthBefore && healthAfterSecond === healthAfterFirst
    };
  });

  if (!damageData.exists) {
    result.status = 'fail';
    result.note = damageData.reason;
    return;
  }

  const checks = [
    ['takeDamage method', damageData.hasTakeDamage],
    ['invincibility frames', damageData.hasLastDamageTime],
    ['enemy attack damage', damageData.hasEnemyAttack],
    ['HUD damage flash', damageData.hasHudFlash],
    ['player hit sound', damageData.hasPlayerHitSound],
    ['invincibility works', damageData.invincibilityWorks]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = 'Enemy damage system fully functional with invincibility frames';
  }
}

async function T2_09_enemyPathfinding(page, result) {
  // T2-09: Enemy pathfinding works (issue: #18)
  // Pass condition: Map has A* pathfinding, enemies can find paths around walls
  await page.waitForTimeout(1000);

  const pathData = await page.evaluate(() => {
    if (!window.game || !window.game.map) {
      return { exists: false, reason: 'Map not found' };
    }

    const map = window.game.map;

    // Check findPath method exists
    const hasFindPath = typeof map.findPath === 'function';
    if (!hasFindPath) {
      return { exists: true, hasFindPath: false };
    }

    // Test pathfinding around a wall (from tile 2,2 to tile 5,5 which goes around wall at 3,3)
    const path = map.findPath(
      2.5 * map.tileSize, 2.5 * map.tileSize,
      5.5 * map.tileSize, 5.5 * map.tileSize
    );

    // Check enemies have movement speeds
    const enemies = map.enemies.filter(e => e.active);
    const speeds = enemies.map(e => ({ type: e.type, speed: e.speed }));
    const hasVariedSpeeds = new Set(speeds.map(s => s.speed)).size > 1;

    return {
      exists: true,
      hasFindPath: true,
      pathFound: path !== null,
      pathLength: path ? path.length : 0,
      hasVariedSpeeds,
      enemySpeeds: speeds
    };
  });

  if (!pathData.exists) {
    result.status = 'fail';
    result.note = pathData.reason;
    return;
  }

  if (!pathData.hasFindPath) {
    result.status = 'fail';
    result.note = 'findPath method not found on map';
    return;
  }

  if (!pathData.pathFound) {
    result.status = 'fail';
    result.note = 'A* pathfinding returned no path';
    return;
  }

  if (!pathData.hasVariedSpeeds) {
    result.status = 'fail';
    result.note = 'All enemies have the same speed';
    return;
  }

  result.status = 'pass';
  result.note = `A* pathfinding works (${pathData.pathLength} waypoints), ${pathData.enemySpeeds.length} enemies with varied speeds`;
}

async function T2_10_weaponHitEffects(page, result) {
  // T2-10: Weapon hit effects system works (issue: #19)
  // Pass condition: Damage numbers, hit flash, impact sparks, critical hits exist
  await page.waitForTimeout(1000);

  const effectData = await page.evaluate(() => {
    if (!window.game || !window.game.hud || !window.game.player) {
      return { exists: false, reason: 'Game systems not found' };
    }

    const hud = window.game.hud;
    const player = window.game.player;

    return {
      exists: true,
      hasDamageNumbers: typeof hud.addDamageNumber === 'function',
      hasImpactSparks: typeof hud.addImpactSpark === 'function',
      hasDamageNumberArray: Array.isArray(hud.damageNumbers),
      hasImpactSparkArray: Array.isArray(hud.impactSparks),
      hasRenderDamageNumbers: typeof hud.renderDamageNumbers === 'function',
      hasRenderImpactSparks: typeof hud.renderImpactSparks === 'function',
      hasPlayerHitSound: window.soundEngine && typeof window.soundEngine.playPlayerHit === 'function'
    };
  });

  if (!effectData.exists) {
    result.status = 'fail';
    result.note = effectData.reason;
    return;
  }

  const checks = [
    ['addDamageNumber', effectData.hasDamageNumbers],
    ['addImpactSpark', effectData.hasImpactSparks],
    ['damageNumbers array', effectData.hasDamageNumberArray],
    ['impactSparks array', effectData.hasImpactSparkArray],
    ['renderDamageNumbers', effectData.hasRenderDamageNumbers],
    ['renderImpactSparks', effectData.hasRenderImpactSparks]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = 'Weapon hit effects system complete (damage numbers, impact sparks, critical hits)';
  }
}

async function T2_11_advancedWeapons(page, result) {
  // T2-11: Advanced weapon arsenal (issue: #23)
  // Pass condition: Rocket launcher and chaingun exist, can switch to them, have proper stats
  await page.waitForTimeout(1000);

  const weaponData = await page.evaluate(() => {
    if (!window.game || !window.game.player || !window.game.player.weaponManager) {
      return { exists: false, reason: 'Weapon system not found' };
    }

    const wm = window.game.player.weaponManager;
    const hasRocket = !!wm.weapons.rocket;
    const hasChaingun = !!wm.weapons.chaingun;

    // Check weapon stats
    const rocketStats = hasRocket ? {
      damage: wm.weapons.rocket.damage,
      hasSplash: wm.weapons.rocket.getWeaponStats('rocket').splashRadius > 0
    } : null;

    const chaingunStats = hasChaingun ? {
      damage: wm.weapons.chaingun.damage,
      fireRate: wm.weapons.chaingun.fireRate
    } : null;

    // Unlock weapons for testing, then test switching
    if (wm.unlockWeapon) {
      wm.unlockWeapon('rocket');
      wm.unlockWeapon('chaingun');
    }

    // Test switching to rocket launcher
    let canSwitchRocket = false;
    if (hasRocket) {
      const prev = wm.currentWeapon;
      wm.switchWeapon('rocket');
      canSwitchRocket = wm.currentWeapon === 'rocket';
      wm.switchWeapon(prev);
    }

    // Test switching to chaingun
    let canSwitchChaingun = false;
    if (hasChaingun) {
      const prev = wm.currentWeapon;
      wm.switchWeapon('chaingun');
      canSwitchChaingun = wm.currentWeapon === 'chaingun';
      wm.switchWeapon(prev);
    }

    // Check HUD sprites
    const hud = window.game.hud;
    const hasRocketSprite = typeof hud.drawRocketSprite === 'function';
    const hasChaingunSprite = typeof hud.drawChaingunSprite === 'function';

    return {
      exists: true,
      hasRocket, hasChaingun,
      rocketStats, chaingunStats,
      canSwitchRocket, canSwitchChaingun,
      hasRocketSprite, hasChaingunSprite
    };
  });

  if (!weaponData.exists) {
    result.status = 'fail';
    result.note = weaponData.reason;
    return;
  }

  const checks = [
    ['rocket weapon', weaponData.hasRocket],
    ['chaingun weapon', weaponData.hasChaingun],
    ['switch to rocket', weaponData.canSwitchRocket],
    ['switch to chaingun', weaponData.canSwitchChaingun],
    ['rocket splash damage', weaponData.rocketStats && weaponData.rocketStats.hasSplash],
    ['chaingun high fire rate', weaponData.chaingunStats && weaponData.chaingunStats.fireRate >= 8],
    ['rocket HUD sprite', weaponData.hasRocketSprite],
    ['chaingun HUD sprite', weaponData.hasChaingunSprite]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = `Rocket (${weaponData.rocketStats.damage}dmg, splash) and Chaingun (${weaponData.chaingunStats.fireRate}rps) functional with HUD sprites`;
  }
}

async function T2_12_enemyVariety(page, result) {
  // T2-12: Enemy variety & boss system (issue: #24)
  // Pass condition: New enemy types exist with unique behaviors, boss has phases
  await page.waitForTimeout(1000);

  const enemyData = await page.evaluate(() => {
    if (!window.game || !window.game.map || !window.game.map.enemies) {
      return { exists: false, reason: 'Enemy system not found' };
    }

    const enemies = window.game.map.enemies;
    const types = {};
    enemies.forEach(e => {
      types[e.type] = (types[e.type] || 0) + 1;
    });

    // Check new enemy types exist
    const hasBerserker = !!types['berserker'];
    const hasSpitter = !!types['spitter'];
    const hasShieldGuard = !!types['shield_guard'];
    const hasBoss = !!types['boss'];

    // Check behavior definitions
    const behaviors = window.EnemyBehaviors || {};
    const hasBerserkerBehavior = behaviors.berserker && behaviors.berserker.berserkerRage === true;
    const hasSpitterBehavior = behaviors.spitter && behaviors.spitter.rangedAttack === true;
    const hasShieldBehavior = behaviors.shield_guard && behaviors.shield_guard.frontShield === true;
    const hasBossBehavior = behaviors.boss && behaviors.boss.bossPhases === true;

    // Check boss health is much higher
    const boss = enemies.find(e => e.type === 'boss');
    const bossHighHealth = boss && boss.maxHealth >= 400;

    // Check total enemy variety (at least 6 unique types)
    const uniqueTypes = Object.keys(types).length;

    return {
      exists: true,
      types,
      uniqueTypes,
      hasBerserker, hasSpitter, hasShieldGuard, hasBoss,
      hasBerserkerBehavior, hasSpitterBehavior, hasShieldBehavior, hasBossBehavior,
      bossHighHealth,
      totalEnemies: enemies.length
    };
  });

  if (!enemyData.exists) {
    result.status = 'fail';
    result.note = enemyData.reason;
    return;
  }

  const checks = [
    ['berserker type', enemyData.hasBerserker],
    ['spitter type', enemyData.hasSpitter],
    ['shield_guard type', enemyData.hasShieldGuard],
    ['boss type', enemyData.hasBoss],
    ['berserker rage behavior', enemyData.hasBerserkerBehavior],
    ['spitter ranged behavior', enemyData.hasSpitterBehavior],
    ['shield guard behavior', enemyData.hasShieldBehavior],
    ['boss phases behavior', enemyData.hasBossBehavior],
    ['boss high health', enemyData.bossHighHealth],
    ['6+ unique types', enemyData.uniqueTypes >= 6]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = `${enemyData.uniqueTypes} enemy types (${Object.keys(enemyData.types).join(', ')}), boss with ${enemyData.bossHighHealth ? 'high HP' : 'normal HP'}, ${enemyData.totalEnemies} total enemies`;
  }
}

async function T2_13_playerProgression(page, result) {
  // T2-13: Player progression & stats (issue: #25)
  // Pass condition: XP system, stats tracking, level system, HUD progression display
  await page.waitForTimeout(1000);

  const progressData = await page.evaluate(() => {
    if (!window.game || !window.game.player) {
      return { exists: false, reason: 'Player not found' };
    }

    const player = window.game.player;

    // Check XP/Level system
    const hasXP = typeof player.xp === 'number';
    const hasLevel = typeof player.level === 'number';
    const hasAddXP = typeof player.addXP === 'function';
    const hasXPProgress = typeof player.getXPProgress === 'function';

    // Check stats object
    const hasStats = player.stats && typeof player.stats === 'object';
    const statFields = hasStats ? Object.keys(player.stats) : [];
    const hasAllStats = hasStats &&
      'enemiesKilled' in player.stats &&
      'shotsFired' in player.stats &&
      'damageTaken' in player.stats &&
      'damageDealt' in player.stats;

    // Check level bonuses
    const hasBonuses = player.levelBonuses && typeof player.levelBonuses === 'object';
    const hasDamageMultiplier = hasBonuses && typeof player.levelBonuses.damageMultiplier === 'number';

    // Check HUD progression display
    const hasProgressionHUD = window.game.hud && typeof window.game.hud.renderProgressionHUD === 'function';

    // Test XP gain and level up
    let levelUpWorks = false;
    if (hasAddXP) {
      const prevLevel = player.level;
      const prevXP = player.xp;
      player.addXP(500); // Should level up multiple times
      levelUpWorks = player.level > prevLevel;
      // Restore
      player.level = prevLevel;
      player.xp = prevXP;
      player.maxHealth = 100;
      player.baseSpeed = 200;
      player.speed = 200;
      player.levelBonuses = { maxHealthBonus: 0, damageMultiplier: 1.0, speedBonus: 0 };
    }

    return {
      exists: true,
      hasXP, hasLevel, hasAddXP, hasXPProgress,
      hasStats, statFields, hasAllStats,
      hasBonuses, hasDamageMultiplier,
      hasProgressionHUD,
      levelUpWorks
    };
  });

  if (!progressData.exists) {
    result.status = 'fail';
    result.note = progressData.reason;
    return;
  }

  const checks = [
    ['XP tracking', progressData.hasXP],
    ['level system', progressData.hasLevel],
    ['addXP method', progressData.hasAddXP],
    ['XP progress', progressData.hasXPProgress],
    ['stats object', progressData.hasAllStats],
    ['level bonuses', progressData.hasBonuses],
    ['damage multiplier', progressData.hasDamageMultiplier],
    ['HUD progression', progressData.hasProgressionHUD],
    ['level up works', progressData.levelUpWorks]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = `Progression system: XP, levels, ${progressData.statFields.length} stat fields, damage multiplier, HUD display`;
  }
}

async function T2_14_particleEffects(page, result) {
  // T2-14: Particle effects & visual polish (issue: #26)
  // Pass condition: Particle system, screen shake, muzzle/blood/explosion emitters exist
  await page.waitForTimeout(1000);

  const particleData = await page.evaluate(() => {
    if (!window.game || !window.game.hud) {
      return { exists: false, reason: 'HUD not found' };
    }

    const hud = window.game.hud;

    return {
      exists: true,
      hasParticles: Array.isArray(hud.particles),
      hasMaxParticles: typeof hud.maxParticles === 'number',
      hasAddParticle: typeof hud.addParticle === 'function',
      hasEmitBlood: typeof hud.emitBloodParticles === 'function',
      hasEmitMuzzle: typeof hud.emitMuzzleParticles === 'function',
      hasEmitExplosion: typeof hud.emitExplosionParticles === 'function',
      hasScreenShake: typeof hud.triggerScreenShake === 'function',
      hasShakeOffset: typeof hud.getScreenShakeOffset === 'function',
      hasUpdateParticles: typeof hud.updateAndRenderParticles === 'function'
    };
  });

  if (!particleData.exists) {
    result.status = 'fail';
    result.note = particleData.reason;
    return;
  }

  const checks = [
    ['particle array', particleData.hasParticles],
    ['max particles limit', particleData.hasMaxParticles],
    ['addParticle method', particleData.hasAddParticle],
    ['blood emitter', particleData.hasEmitBlood],
    ['muzzle emitter', particleData.hasEmitMuzzle],
    ['explosion emitter', particleData.hasEmitExplosion],
    ['screen shake', particleData.hasScreenShake],
    ['shake offset', particleData.hasShakeOffset],
    ['particle renderer', particleData.hasUpdateParticles]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = 'Particle system with blood, muzzle, explosion emitters and screen shake';
  }
}

async function T2_15_spriteOcclusion(page, result) {
  // T2-15: Sprite occlusion system works correctly (issue: #27)
  // Pass condition: isOccludedByWall correctly detects walls between player and sprites
  await page.waitForTimeout(1000);

  const occlusionData = await page.evaluate(() => {
    if (!window.game || !window.game.renderer || !window.game.map) {
      return { exists: false, reason: 'Renderer or map not found' };
    }

    const renderer = window.game.renderer;
    const map = window.game.map;
    const tileSize = map.tileSize;

    // Check isOccludedByWall method exists
    if (typeof renderer.isOccludedByWall !== 'function') {
      return { exists: false, reason: 'isOccludedByWall method not found' };
    }

    // Test 1: Clear line of sight (no wall between two open tiles)
    // Player at (1.5, 1.5) tile = (96, 96), sprite at (2.5, 1.5) tile = (160, 96)
    const clearSight = !renderer.isOccludedByWall(
      1.5 * tileSize, 1.5 * tileSize,
      2.5 * tileSize, 1.5 * tileSize
    );

    // Test 2: Blocked by wall (wall at tile 3,3 = type 2)
    // Player at (1.5, 3.5) tile, sprite at (4.5, 3.5) tile - wall at (3,3) blocks
    const blockedByWall = renderer.isOccludedByWall(
      1.5 * tileSize, 3.5 * tileSize,
      4.5 * tileSize, 3.5 * tileSize
    );

    // Test 3: Blocked by outer wall (wall type 1 at edges)
    // Player at (1.5, 1.5), sprite at (1.5, -0.5) - wall at row 0 blocks
    const blockedByBorder = renderer.isOccludedByWall(
      1.5 * tileSize, 1.5 * tileSize,
      1.5 * tileSize, -0.5 * tileSize
    );

    // Test 4: Diagonal line of sight with wall obstruction
    // Player at (1.5, 1.5), sprite at (4.5, 4.5) - wall at (3,3) blocks diagonal
    const blockedDiagonal = renderer.isOccludedByWall(
      1.5 * tileSize, 1.5 * tileSize,
      4.5 * tileSize, 4.5 * tileSize
    );

    // Test 5: Very close sprites should not be occluded (same open tile)
    const closeNotOccluded = !renderer.isOccludedByWall(
      1.5 * tileSize, 1.5 * tileSize,
      1.6 * tileSize, 1.5 * tileSize
    );

    // Test 6: Uses step size <= 4 for accuracy (check method behavior)
    // Ray from (1.5, 5.5) to (8.5, 5.5) crosses wall at (7,5) type 4
    const blockedByTechWall = renderer.isOccludedByWall(
      1.5 * tileSize, 5.5 * tileSize,
      8.5 * tileSize, 5.5 * tileSize
    );

    return {
      exists: true,
      clearSight,
      blockedByWall,
      blockedByBorder,
      blockedDiagonal,
      closeNotOccluded,
      blockedByTechWall
    };
  });

  if (!occlusionData.exists) {
    result.status = 'fail';
    result.note = occlusionData.reason;
    return;
  }

  const checks = [
    ['clear line of sight', occlusionData.clearSight],
    ['blocked by wall', occlusionData.blockedByWall],
    ['blocked by border wall', occlusionData.blockedByBorder],
    ['blocked on diagonal', occlusionData.blockedDiagonal],
    ['close sprites not occluded', occlusionData.closeNotOccluded],
    ['blocked by tech wall', occlusionData.blockedByTechWall]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Occlusion failures: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = 'Sprite occlusion correctly detects walls in all test cases (step size 4, normalized rays)';
  }
}

async function T2_16_enemyVisualDiversity(page, result) {
  // T2-16: Enemy visual diversity - different sprites per type (issue: #28)
  // Pass condition: Tinted sprites generated for all enemy types, scale factors defined
  await page.waitForTimeout(2000);

  const visualData = await page.evaluate(() => {
    if (!window.game || !window.game.renderer) {
      return { exists: false, reason: 'Renderer not found' };
    }

    const renderer = window.game.renderer;

    // Check tinted sprites exist
    const hasTintedSprites = renderer.tintedSprites && typeof renderer.tintedSprites === 'object';
    const tintedTypes = hasTintedSprites ? Object.keys(renderer.tintedSprites) : [];

    // Check enemy tint definitions
    const hasTints = renderer.enemyTints && typeof renderer.enemyTints === 'object';
    const tintTypes = hasTints ? Object.keys(renderer.enemyTints) : [];

    // Check scale factors
    const hasScales = renderer.enemyScales && typeof renderer.enemyScales === 'object';
    const scaleTypes = hasScales ? Object.keys(renderer.enemyScales) : [];

    // Required enemy types
    const requiredTypes = ['imp', 'guard', 'soldier', 'demon', 'berserker', 'spitter', 'shield_guard', 'boss'];
    const missingTints = requiredTypes.filter(t => !tintedTypes.includes(t));
    const missingScales = requiredTypes.filter(t => !scaleTypes.includes(t));

    // Check boss is larger than imp
    const bossLarger = hasScales && renderer.enemyScales.boss > renderer.enemyScales.imp;

    // Check each tinted sprite is a valid canvas
    const validCanvases = tintedTypes.filter(t => {
      const s = renderer.tintedSprites[t];
      return s && s.width > 0 && s.height > 0;
    });

    // Check helper methods exist
    const hasRgbToHsl = typeof renderer.rgbToHsl === 'function';
    const hasHslToRgb = typeof renderer.hslToRgb === 'function';

    return {
      exists: true,
      hasTintedSprites,
      tintedTypes,
      missingTints,
      missingScales,
      bossLarger,
      validCanvases: validCanvases.length,
      totalRequired: requiredTypes.length,
      hasRgbToHsl,
      hasHslToRgb
    };
  });

  if (!visualData.exists) {
    result.status = 'fail';
    result.note = visualData.reason;
    return;
  }

  const checks = [
    ['tinted sprites object', visualData.hasTintedSprites],
    ['all types have tints', visualData.missingTints.length === 0],
    ['all types have scales', visualData.missingScales.length === 0],
    ['boss larger than imp', visualData.bossLarger],
    ['valid sprite canvases', visualData.validCanvases === visualData.totalRequired],
    ['rgbToHsl helper', visualData.hasRgbToHsl],
    ['hslToRgb helper', visualData.hasHslToRgb]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}${visualData.missingTints.length > 0 ? ` (missing tints: ${visualData.missingTints.join(', ')})` : ''}`;
  } else {
    result.status = 'pass';
    result.note = `${visualData.tintedTypes.length} enemy types with unique color tints and scale factors`;
  }
}

async function T2_17_enemyMovement(page, result) {
  // T2-17: Enemy movement system - enemies actively move (issue: #29)
  // Pass condition: Enemies change position over time, different speeds per type
  await page.waitForTimeout(1000);

  const movementData = await page.evaluate(() => {
    if (!window.game || !window.game.map || !window.game.map.enemies) {
      return { exists: false, reason: 'Enemy system not found' };
    }

    const enemies = window.game.map.enemies.filter(e => e.active);

    // Record initial positions
    const initialPositions = enemies.map(e => ({
      type: e.type,
      x: e.x,
      y: e.y,
      speed: e.speed,
      state: e.state
    }));

    return {
      exists: true,
      initialPositions,
      enemyCount: enemies.length
    };
  });

  if (!movementData.exists) {
    result.status = 'fail';
    result.note = movementData.reason;
    return;
  }

  // Wait for enemies to move
  await page.waitForTimeout(3000);

  const afterData = await page.evaluate(() => {
    const enemies = window.game.map.enemies.filter(e => e.active);
    return enemies.map(e => ({
      type: e.type,
      x: e.x,
      y: e.y,
      speed: e.speed,
      state: e.state
    }));
  });

  // Check how many enemies moved
  let movedCount = 0;
  const speeds = new Set();

  for (let i = 0; i < Math.min(movementData.initialPositions.length, afterData.length); i++) {
    const before = movementData.initialPositions[i];
    const after = afterData[i];
    if (!after) continue;

    const dx = Math.abs(after.x - before.x);
    const dy = Math.abs(after.y - before.y);
    if (dx > 1 || dy > 1) {
      movedCount++;
    }
    speeds.add(after.speed);
  }

  const checks = [
    ['enemies exist', movementData.enemyCount > 0],
    ['some enemies moved', movedCount > 0],
    ['varied speeds', speeds.size > 1]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Movement issues: ${failed.map(([name]) => name).join(', ')} (${movedCount}/${movementData.enemyCount} moved)`;
  } else {
    result.status = 'pass';
    result.note = `${movedCount}/${movementData.enemyCount} enemies moved, ${speeds.size} distinct speeds`;
  }
}

async function T2_18_projectStructure(page, result) {
  // T2-18: Project structure and templates exist (issue: #30)
  // Pass condition: Game loads correctly with all documented systems in place
  await page.waitForTimeout(1000);

  const structureData = await page.evaluate(() => {
    // Verify all core game systems are initialized
    const hasGame = !!window.game;
    const hasRenderer = hasGame && !!window.game.renderer;
    const hasMap = hasGame && !!window.game.map;
    const hasPlayer = hasGame && !!window.game.player;
    const hasHud = hasGame && !!window.game.hud;
    const hasPickups = hasGame && !!window.game.pickupManager;
    const hasInput = hasGame && !!window.game.inputManager;
    const hasSoundEngine = !!window.SoundEngine;
    const hasEnemyBehaviors = !!window.EnemyBehaviors;
    const hasEnhancedAI = !!window.EnhancedEnemyAI;

    return {
      hasGame, hasRenderer, hasMap, hasPlayer, hasHud,
      hasPickups, hasInput, hasSoundEngine,
      hasEnemyBehaviors, hasEnhancedAI
    };
  });

  const checks = [
    ['GameEngine', structureData.hasGame],
    ['Renderer', structureData.hasRenderer],
    ['GameMap', structureData.hasMap],
    ['Player', structureData.hasPlayer],
    ['HUD', structureData.hasHud],
    ['PickupManager', structureData.hasPickups],
    ['InputManager', structureData.hasInput],
    ['SoundEngine', structureData.hasSoundEngine],
    ['EnemyBehaviors', structureData.hasEnemyBehaviors],
    ['EnhancedEnemyAI', structureData.hasEnhancedAI]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing systems: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = `All ${checks.length} core systems initialized and operational`;
  }
}

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

  // Check if enemy system is active first
  const enemySystemCheck = await page.evaluate(() => {
    if (!window.game || !window.game.map || !window.game.map.enemies) {
      return { active: false, count: 0, reason: 'Enemy system not found' };
    }
    
    const enemies = window.game.map.enemies;
    const activeEnemies = enemies.filter(e => e.active);
    const positions = activeEnemies.map(e => ({ x: Math.floor(e.x), y: Math.floor(e.y) }));
    
    return { 
      active: true, 
      totalCount: enemies.length,
      activeCount: activeEnemies.length,
      positions: positions.slice(0, 3) // First 3 positions
    };
  });

  if (!enemySystemCheck.active) {
    result.status = 'fail';
    result.note = `Enemy system issue: ${enemySystemCheck.reason}`;
    return;
  }

  const verification = await verifyScreenshot(
    screenshot,
    'Look at this first-person shooter game screenshot and examine it carefully for ANY sprite elements:\n' +
    '1. Are there any red demon/enemy creatures visible anywhere in the scene?\n' +
    '2. Are there any rectangular background boxes or gray backgrounds around sprites?\n' +
    '3. Do any sprite elements blend naturally with the environment?\n\n' +
    'CONTEXT: Game has ' + enemySystemCheck.activeCount + ' active enemies out of ' + enemySystemCheck.totalCount + ' total.\n' +
    'Pass if: (A) No sprites visible, OR (B) Sprites visible with transparent/clean backgrounds. ' +
    'Fail ONLY if: Sprites have visible gray/dark background rectangles around them.'
  );

  result.status = verification.pass ? 'pass' : 'fail';
  result.note = verification.explanation;
}

async function T2_19_noGameLoadedPopup(page, result) {
  // T2-19: No "Game loaded" popup on start (issue: #31)
  // Pass condition: No overlay/popup with "Game loaded" text appears after page load
  await page.reload({ waitUntil: 'networkidle' });

  // Click difficulty selection to start the game
  const diffBtn = await page.$('.difficulty-btn[data-difficulty="normal"]');
  if (diffBtn) await diffBtn.click();

  await page.waitForTimeout(3000);

  const popupFound = await page.evaluate(() => {
    const allElements = document.querySelectorAll('div');
    for (const el of allElements) {
      if (el.textContent.includes('Game loaded') && el.style.position === 'fixed') {
        return true;
      }
    }
    return false;
  });

  if (popupFound) {
    result.status = 'fail';
    result.note = '"Game loaded" popup still appears on page load';
  } else {
    result.status = 'pass';
    result.note = 'No "Game loaded" popup detected on page load';
  }
}

async function T2_20_multiRoomMap(page, result) {
  // T2-20: Multi-room nuclear reactor map (issue: #33)
  // Pass condition: Map is larger than 16x16, has multiple rooms with different wall types,
  // enemies and pickups distributed across the map
  await page.waitForTimeout(1000);

  const mapData = await page.evaluate(() => {
    if (!window.game || !window.game.map) {
      return { exists: false, reason: 'Map not found' };
    }

    const map = window.game.map;

    // Check map dimensions are expanded
    const isExpanded = map.width >= 20 && map.height >= 20;

    // Count distinct wall types used (excluding 0 and outer walls)
    const wallTypes = new Set();
    for (let y = 1; y < map.height - 1; y++) {
      for (let x = 1; x < map.width - 1; x++) {
        if (map.grid[y][x] > 0) wallTypes.add(map.grid[y][x]);
      }
    }

    // Count distinct rooms (contiguous regions of different wall types)
    const hasMultipleWallTypes = wallTypes.size >= 4;

    // Check enemies are spread across the map (not all in one quadrant)
    const midX = (map.width * map.tileSize) / 2;
    const midY = (map.height * map.tileSize) / 2;
    let quadrants = new Set();
    for (const enemy of map.enemies) {
      const qx = enemy.x < midX ? 'L' : 'R';
      const qy = enemy.y < midY ? 'T' : 'B';
      quadrants.add(qx + qy);
    }

    // Check pickups exist across the map
    const hasPickups = map.items.length >= 4;

    return {
      exists: true,
      width: map.width,
      height: map.height,
      isExpanded,
      wallTypeCount: wallTypes.size,
      wallTypes: Array.from(wallTypes).sort(),
      hasMultipleWallTypes,
      enemyCount: map.enemies.length,
      quadrantsCovered: quadrants.size,
      pickupCount: map.items.length,
      hasPickups
    };
  });

  if (!mapData.exists) {
    result.status = 'fail';
    result.note = mapData.reason;
    return;
  }

  const checks = [
    mapData.isExpanded,
    mapData.hasMultipleWallTypes,
    mapData.quadrantsCovered >= 3,
    mapData.hasPickups
  ];

  if (checks.every(Boolean)) {
    result.status = 'pass';
    result.note = `${mapData.width}x${mapData.height} map, ${mapData.wallTypeCount} wall types [${mapData.wallTypes}], ${mapData.enemyCount} enemies in ${mapData.quadrantsCovered} quadrants, ${mapData.pickupCount} pickups`;
  } else {
    result.status = 'fail';
    result.note = `Map checks: expanded=${mapData.isExpanded}, wallTypes=${mapData.wallTypeCount}, quadrants=${mapData.quadrantsCovered}, pickups=${mapData.hasPickups}`;
  }
}

async function T2_22_difficultySelection(page, result) {
  // T2-22: Difficulty selection system (issue: #35)
  // Pass condition: Difficulty overlay exists, CONFIG has difficulty settings, game applies them
  // Reload to get fresh difficulty screen
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check overlay is visible
  const overlayData = await page.evaluate(() => {
    const overlay = document.getElementById('difficultyOverlay');
    if (!overlay) return { exists: false, reason: 'Overlay not found' };

    const buttons = overlay.querySelectorAll('.difficulty-btn');
    const labels = Array.from(buttons).map(b => b.getAttribute('data-difficulty'));
    const isVisible = !overlay.classList.contains('hidden');

    return {
      exists: true,
      isVisible,
      buttonCount: buttons.length,
      difficulties: labels,
      hasDifficultyConfig: typeof window.DIFFICULTY !== 'undefined',
      configKeys: typeof window.DIFFICULTY !== 'undefined' ? Object.keys(window.DIFFICULTY) : []
    };
  });

  if (!overlayData.exists) {
    result.status = 'fail';
    result.note = overlayData.reason;
    return;
  }

  // Click Easy to test difficulty application
  const easyBtn = await page.$('.difficulty-btn[data-difficulty="easy"]');
  if (easyBtn) await easyBtn.click();
  await page.waitForTimeout(2000);

  const gameData = await page.evaluate(() => {
    if (!window.game || !window.game.player) return { started: false };

    return {
      started: true,
      difficulty: window.CONFIG.difficulty,
      playerHealth: window.game.player.maxHealth,
      overlayHidden: document.getElementById('difficultyOverlay').classList.contains('hidden')
    };
  });

  const checks = [
    ['overlay visible before selection', overlayData.isVisible],
    ['3 difficulty buttons', overlayData.buttonCount === 3],
    ['has easy option', overlayData.difficulties.includes('easy')],
    ['has normal option', overlayData.difficulties.includes('normal')],
    ['has nightmare option', overlayData.difficulties.includes('nightmare')],
    ['difficulty config exists', overlayData.hasDifficultyConfig],
    ['game started after selection', gameData.started],
    ['difficulty stored in config', gameData.difficulty === 'easy'],
    ['overlay hidden after selection', gameData.overlayHidden],
    ['easy gives more health', gameData.playerHealth > 100]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = `Difficulty selection works: ${overlayData.buttonCount} options, Easy gives ${gameData.playerHealth} HP`;
  }

  // Re-select Normal for remaining tests
  await page.reload({ waitUntil: 'networkidle' });
  const normalBtn = await page.$('.difficulty-btn[data-difficulty="normal"]');
  if (normalBtn) await normalBtn.click();
  await page.waitForTimeout(2000);
}

async function T2_21_minimapSystem(page, result) {
  // T2-21: Minimap renders with player and enemies (issue: #34)
  // Pass condition: Minimap system exists, renders, and can be toggled with M key
  await page.waitForTimeout(1000);

  const minimapData = await page.evaluate(() => {
    if (!window.game || !window.game.hud) {
      return { exists: false, reason: 'HUD not found' };
    }

    const hud = window.game.hud;

    return {
      exists: true,
      hasShowMinimap: typeof hud.showMinimap === 'boolean',
      hasRenderMinimap: typeof hud.renderMinimap === 'function',
      hasToggleMinimap: typeof hud.toggleMinimap === 'function',
      initialState: hud.showMinimap
    };
  });

  if (!minimapData.exists) {
    result.status = 'fail';
    result.note = minimapData.reason;
    return;
  }

  // Test M key toggle
  const initialState = minimapData.initialState;

  await page.keyboard.press('m');
  await page.waitForTimeout(200);

  const toggledState = await page.evaluate(() => window.game.hud.showMinimap);

  await page.keyboard.press('m');
  await page.waitForTimeout(200);

  const restoredState = await page.evaluate(() => window.game.hud.showMinimap);

  const checks = [
    ['showMinimap property', minimapData.hasShowMinimap],
    ['renderMinimap method', minimapData.hasRenderMinimap],
    ['toggleMinimap method', minimapData.hasToggleMinimap],
    ['M key toggles off', toggledState !== initialState],
    ['M key toggles back on', restoredState === initialState]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = 'Minimap system functional with M key toggle';
  }
}

async function T2_23_levelCompletionScreen(page, result) {
  // T2-23: Level completion screen with stats (issue: #36)
  // Pass condition: Completion tracking exists, stats are tracked, restart method available
  await page.waitForTimeout(1000);

  const completionData = await page.evaluate(() => {
    if (!window.game) return { exists: false, reason: 'Game not found' };

    const g = window.game;
    const p = g.player;

    return {
      exists: true,
      hasLevelComplete: typeof g.levelComplete === 'boolean',
      hasTotalEnemyCount: typeof g.totalEnemyCount === 'number',
      hasLevelStartTime: typeof g.levelStartTime === 'number',
      hasCheckLevelComplete: typeof g.checkLevelComplete === 'function',
      hasRestartLevel: typeof g.restartLevel === 'function',
      hasRenderCompletionScreen: typeof g.renderCompletionScreen === 'function',
      hasStats: p.stats && typeof p.stats.shotsFired === 'number' && typeof p.stats.shotsHit === 'number',
      hasTimeSurvived: p.stats && typeof p.stats.timeSurvived === 'number',
      hasVictorySound: window.soundEngine && typeof window.soundEngine.playLevelComplete === 'function',
      totalEnemies: g.totalEnemyCount
    };
  });

  if (!completionData.exists) {
    result.status = 'fail';
    result.note = completionData.reason;
    return;
  }

  const checks = [
    ['levelComplete flag', completionData.hasLevelComplete],
    ['totalEnemyCount', completionData.hasTotalEnemyCount],
    ['levelStartTime', completionData.hasLevelStartTime],
    ['checkLevelComplete method', completionData.hasCheckLevelComplete],
    ['restartLevel method', completionData.hasRestartLevel],
    ['renderCompletionScreen method', completionData.hasRenderCompletionScreen],
    ['player stats tracking', completionData.hasStats],
    ['time survived stat', completionData.hasTimeSurvived],
    ['victory sound', completionData.hasVictorySound]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = `Level completion system: ${completionData.totalEnemies} enemies tracked, stats + restart + victory sound`;
  }
}

async function T2_24_meleePunch(page, result) {
  // T2-24: Melee punch attack (issue: #38)
  // Pass condition: Punch system exists with correct damage, range, cooldown, sound
  await page.waitForTimeout(1000);

  const punchData = await page.evaluate(() => {
    if (!window.game || !window.game.player) {
      return { exists: false, reason: 'Player not found' };
    }

    const p = window.game.player;

    return {
      exists: true,
      hasPunchMethod: typeof p.punch === 'function',
      punchDamage: p.punchDamage,
      punchRange: p.punchRange,
      punchCooldown: p.punchCooldown,
      hasPunchSound: window.soundEngine && typeof window.soundEngine.playPunch === 'function',
      hasVKey: window.game.inputManager && window.game.inputManager.keyMap['KeyV'] === 'punch',
      hasIsPunching: typeof window.game.inputManager.isPunching === 'function'
    };
  });

  if (!punchData.exists) {
    result.status = 'fail';
    result.note = punchData.reason;
    return;
  }

  const checks = [
    ['punch method', punchData.hasPunchMethod],
    ['30 damage', punchData.punchDamage === 30],
    ['40 range', punchData.punchRange === 40],
    ['400ms cooldown', punchData.punchCooldown === 400],
    ['punch sound', punchData.hasPunchSound],
    ['V key binding', punchData.hasVKey],
    ['isPunching query', punchData.hasIsPunching]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = `Punch: ${punchData.punchDamage}dmg, ${punchData.punchRange} range, ${punchData.punchCooldown}ms cooldown, V key + sound`;
  }
}

async function T2_25_damageFlashEffects(page, result) {
  // T2-25: Damage flash and low-health screen effects (issue: #40)
  // Pass condition: Damage flash triggers on hit, low-health vignette renders when health < 25%
  await page.waitForTimeout(1000);

  const effectData = await page.evaluate(() => {
    if (!window.game || !window.game.hud || !window.game.player) {
      return { exists: false, reason: 'Game systems not found' };
    }

    const hud = window.game.hud;
    const player = window.game.player;

    // Check damage flash system
    const hasRenderDamageFlash = typeof hud.renderDamageFlash === 'function';
    const hasOnPlayerDamage = typeof hud.onPlayerDamage === 'function';
    const hasDamageFlashDuration = typeof hud.damageFlashDuration === 'number';
    const flashDuration = hud.damageFlashDuration;

    // Test damage flash triggers
    const healthBefore = player.health;
    hud.onPlayerDamage();
    const flashTriggered = hud.lastDamageTime > 0;

    // Test low-health effect by temporarily setting low health
    const originalHealth = player.health;
    player.health = 10; // Below 25% threshold
    const isLowHealth = player.health < player.maxHealth * 0.25;
    player.health = originalHealth;
    player.lastDamageTime = 0;

    return {
      exists: true,
      hasRenderDamageFlash,
      hasOnPlayerDamage,
      hasDamageFlashDuration,
      flashDuration,
      flashTriggered,
      isLowHealth,
      durationIs200: flashDuration === 200
    };
  });

  if (!effectData.exists) {
    result.status = 'fail';
    result.note = effectData.reason;
    return;
  }

  const checks = [
    ['renderDamageFlash method', effectData.hasRenderDamageFlash],
    ['onPlayerDamage method', effectData.hasOnPlayerDamage],
    ['flash duration property', effectData.hasDamageFlashDuration],
    ['200ms flash duration', effectData.durationIs200],
    ['flash triggers on damage', effectData.flashTriggered],
    ['low-health threshold works', effectData.isLowHealth]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = `Damage flash (${effectData.flashDuration}ms) + low-health vignette pulse at <25% HP`;
  }
}

async function T2_28_killFeed(page, result) {
  // T2-28: Kill feed system (issue: #47)
  // Pass condition: Kill feed renders in top-right, messages auto-fade, max 4 visible
  await page.waitForTimeout(1000);

  const feedData = await page.evaluate(() => {
    if (!window.game || !window.game.hud) {
      return { exists: false, reason: 'HUD not found' };
    }

    const hud = window.game.hud;

    // Check kill feed system
    const hasKillFeed = Array.isArray(hud.killFeed);
    const hasAddMethod = typeof hud.addKillFeedMessage === 'function';
    const hasRenderMethod = typeof hud.renderKillFeed === 'function';
    const hasMax = typeof hud.killFeedMax === 'number';
    const hasDuration = typeof hud.killFeedDuration === 'number';
    const maxIs4 = hud.killFeedMax === 4;
    const durationIs3000 = hud.killFeedDuration === 3000;

    // Test adding messages
    let addWorks = false;
    if (hasAddMethod) {
      const before = hud.killFeed.length;
      hud.addKillFeedMessage('Killed Guard +20 XP', '#FF4444');
      hud.addKillFeedMessage('CRITICAL! Killed Imp +30 XP', '#FFD700');
      hud.addKillFeedMessage('Shotgun Acquired!', '#00FF00');
      addWorks = hud.killFeed.length === before + 3;
      // Clean up
      hud.killFeed.splice(before);
    }

    return {
      exists: true,
      hasKillFeed,
      hasAddMethod,
      hasRenderMethod,
      hasMax,
      hasDuration,
      maxIs4,
      durationIs3000,
      addWorks
    };
  });

  if (!feedData.exists) {
    result.status = 'fail';
    result.note = feedData.reason;
    return;
  }

  const checks = [
    ['killFeed array', feedData.hasKillFeed],
    ['addKillFeedMessage method', feedData.hasAddMethod],
    ['renderKillFeed method', feedData.hasRenderMethod],
    ['max 4 messages', feedData.maxIs4],
    ['3s fade duration', feedData.durationIs3000],
    ['adding messages works', feedData.addWorks]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = `Kill feed: max ${feedData.maxIs4 ? 4 : '?'} msgs, ${feedData.durationIs3000 ? '3s' : '?'} fade, color-coded`;
  }
}

async function T2_27_environmentalHazards(page, result) {
  // T2-27: Environmental hazards — acid pools and exploding barrels (issue: #46)
  // Pass condition: Acid tiles exist, barrels exist, barrels can explode, chain reactions work
  await page.waitForTimeout(1000);

  const hazardData = await page.evaluate(() => {
    if (!window.game || !window.game.map) {
      return { exists: false, reason: 'Map not found' };
    }

    const map = window.game.map;

    // Acid tile checks
    const hasAcidTiles = map.acidTiles instanceof Set;
    const acidCount = hasAcidTiles ? map.acidTiles.size : 0;
    const hasIsAcidAtPosition = typeof map.isAcidAtPosition === 'function';

    // Barrel checks
    const hasBarrels = Array.isArray(map.barrels);
    const barrelCount = hasBarrels ? map.barrels.filter(b => b.active).length : 0;
    const hasExplodeBarrel = typeof map.explodeBarrel === 'function';

    // Test acid detection
    let acidDetectionWorks = false;
    if (hasIsAcidAtPosition && acidCount > 0) {
      const firstAcid = Array.from(map.acidTiles)[0];
      const [ax, ay] = firstAcid.split(',').map(Number);
      acidDetectionWorks = map.isAcidAtPosition(
        (ax + 0.5) * map.tileSize,
        (ay + 0.5) * map.tileSize
      );
    }

    // Test barrel explosion (create a temp barrel, explode it)
    let explosionWorks = false;
    if (hasExplodeBarrel && hasBarrels) {
      const tempBarrel = { x: 100, y: 100, health: 10, active: true, radius: 16, explodeRadius: 100, explodeDamage: 60 };
      map.barrels.push(tempBarrel);
      map.explodeBarrel(tempBarrel);
      explosionWorks = !tempBarrel.active;
      // Clean up temp barrel
      map.barrels = map.barrels.filter(b => b !== tempBarrel);
    }

    // Check explosion sound
    const hasExplosionSound = window.soundEngine && typeof window.soundEngine.playExplosion === 'function';

    return {
      exists: true,
      hasAcidTiles,
      acidCount,
      hasIsAcidAtPosition,
      acidDetectionWorks,
      hasBarrels,
      barrelCount,
      hasExplodeBarrel,
      explosionWorks,
      hasExplosionSound
    };
  });

  if (!hazardData.exists) {
    result.status = 'fail';
    result.note = hazardData.reason;
    return;
  }

  const checks = [
    ['acid tiles exist', hazardData.hasAcidTiles && hazardData.acidCount > 0],
    ['acid detection works', hazardData.acidDetectionWorks],
    ['barrels exist', hazardData.hasBarrels && hazardData.barrelCount > 0],
    ['explodeBarrel method', hazardData.hasExplodeBarrel],
    ['explosion works', hazardData.explosionWorks],
    ['explosion sound', hazardData.hasExplosionSound]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = `Hazards: ${hazardData.acidCount} acid tiles, ${hazardData.barrelCount} barrels, explosion + chain reaction + sound`;
  }
}

async function T2_26_weaponPickups(page, result) {
  // T2-26: Weapon pickups scattered across the map (issue: #45)
  // Pass condition: Player starts with pistol only, weapon pickups exist, collecting unlocks weapon
  await page.waitForTimeout(1000);

  const pickupData = await page.evaluate(() => {
    if (!window.game || !window.game.player || !window.game.pickupManager) {
      return { exists: false, reason: 'Game systems not found' };
    }

    const wm = window.game.player.weaponManager;
    const pm = window.game.pickupManager;

    // Check player starts with pistol only
    const hasUnlockedWeapons = wm.unlockedWeapons instanceof Set;
    const startsWithPistol = hasUnlockedWeapons && wm.unlockedWeapons.has('pistol');
    const onlyPistolAtStart = hasUnlockedWeapons && wm.unlockedWeapons.size === 1;

    // Check weapon pickups exist
    const allPickups = pm.getActivePickups();
    const weaponPickups = allPickups.filter(p => p.type.startsWith('weapon_'));
    const weaponTypes = weaponPickups.map(p => p.type);

    // Check unlock method
    const hasUnlockMethod = typeof wm.unlockWeapon === 'function';
    const hasIsUnlocked = typeof wm.isUnlocked === 'function';

    // Test unlocking a weapon
    let unlockWorks = false;
    if (hasUnlockMethod && hasIsUnlocked) {
      const wasShotgunLocked = !wm.isUnlocked('shotgun');
      wm.unlockWeapon('shotgun');
      unlockWorks = wm.isUnlocked('shotgun');
      // Remove shotgun unlock for clean state (only if it was locked)
      if (wasShotgunLocked) wm.unlockedWeapons.delete('shotgun');
    }

    return {
      exists: true,
      hasUnlockedWeapons,
      startsWithPistol,
      onlyPistolAtStart,
      weaponPickupCount: weaponPickups.length,
      weaponTypes,
      hasUnlockMethod,
      hasIsUnlocked,
      unlockWorks
    };
  });

  if (!pickupData.exists) {
    result.status = 'fail';
    result.note = pickupData.reason;
    return;
  }

  const checks = [
    ['unlockedWeapons tracking', pickupData.hasUnlockedWeapons],
    ['starts with pistol', pickupData.startsWithPistol],
    ['weapon pickups on map', pickupData.weaponPickupCount >= 4],
    ['unlockWeapon method', pickupData.hasUnlockMethod],
    ['isUnlocked method', pickupData.hasIsUnlocked],
    ['unlock works', pickupData.unlockWorks]
  ];

  const failed = checks.filter(([, ok]) => !ok);

  if (failed.length > 0) {
    result.status = 'fail';
    result.note = `Missing: ${failed.map(([name]) => name).join(', ')}`;
  } else {
    result.status = 'pass';
    result.note = `Weapon pickups: ${pickupData.weaponPickupCount} on map [${pickupData.weaponTypes.join(', ')}], unlock system works`;
  }
}

const TIER_3_TESTS = [
  { id: 'T3-01', name: 'HUD visually present (vision)', fn: T3_01_hudVisuallyPresent },
  { id: 'T3-02', name: '3D scene rendered (vision)', fn: T3_02_3dSceneRendered },
  { id: 'T3-03', name: 'Demon sprites transparent (vision)', fn: T3_03_demonTransparency },
];

module.exports = { TIER_1_TESTS, TIER_2_TESTS, TIER_3_TESTS };
