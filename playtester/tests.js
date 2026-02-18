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
];

module.exports = { TIER_1_TESTS, TIER_2_TESTS };
