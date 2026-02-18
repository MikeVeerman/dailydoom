#!/usr/bin/env node

/**
 * DailyDoom Automated Playtester — Test Runner
 *
 * Launches Chromium via Playwright, runs all Tier 1 and Tier 2 tests against
 * the target URL, and writes a structured report to report.json.
 *
 * Usage:
 *   DAILYDOOM_URL=https://… node run-tests.js
 *
 * Environment variables:
 *   DAILYDOOM_URL  — URL of the deployed game (required)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { TIER_1_TESTS, TIER_2_TESTS } = require('./tests');

const TARGET_URL = process.env.DAILYDOOM_URL;
if (!TARGET_URL) {
  console.error('Error: DAILYDOOM_URL environment variable is required.');
  console.error('  Example: DAILYDOOM_URL=https://yourusername.github.io/dailydoom node run-tests.js');
  process.exit(1);
}

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

async function main() {
  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const allTests = [...TIER_1_TESTS, ...TIER_2_TESTS];
  const results = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  console.log(`\n  DailyDoom Playtester`);
  console.log(`  Target: ${TARGET_URL}`);
  console.log(`  Tests:  ${allTests.length}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
    // Grant permissions the game may need
    permissions: [],
  });
  const page = await context.newPage();

  // Navigate to the game
  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (err) {
    console.error(`  Failed to load ${TARGET_URL}: ${err.message}`);
    // Mark all tests as failed
    for (const test of allTests) {
      results.push({ id: test.id, status: 'fail', note: `Page failed to load: ${err.message}` });
      failed++;
    }
    writeReport(results, passed, failed, skipped);
    await browser.close();
    process.exit(1);
  }

  // Wait for the game to initialize
  await page.waitForTimeout(2000);

  // Run each test sequentially
  for (const test of allTests) {
    const result = { id: test.id, status: 'skip', note: '' };

    try {
      if (test.fn.length >= 3) {
        // Test needs screenshotsDir argument
        await test.fn(page, result, SCREENSHOTS_DIR);
      } else {
        await test.fn(page, result);
      }
    } catch (err) {
      result.status = 'fail';
      result.note = `Unexpected error: ${err.message}`;
    }

    switch (result.status) {
      case 'pass': passed++; break;
      case 'fail': failed++; break;
      default: skipped++; break;
    }

    const icon = result.status === 'pass' ? '\x1b[32m✓\x1b[0m'
               : result.status === 'fail' ? '\x1b[31m✗\x1b[0m'
               : '\x1b[33m-\x1b[0m';

    const noteStr = result.note ? ` — ${result.note}` : '';
    console.log(`  ${icon} ${result.id}: ${test.name}${noteStr}`);

    results.push(result);
  }

  await browser.close();

  // Write report
  writeReport(results, passed, failed, skipped);

  // Summary
  console.log(`\n  Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log(`  Report:  playtester/report.json\n`);

  process.exit(failed > 0 ? 1 : 0);
}

function writeReport(results, passed, failed, skipped) {
  const report = {
    timestamp: new Date().toISOString(),
    passed,
    failed,
    skipped,
    results,
    screenshotPath: 'screenshots/latest.png',
  };

  fs.writeFileSync(
    path.join(__dirname, 'report.json'),
    JSON.stringify(report, null, 2) + '\n'
  );
}

main().catch((err) => {
  console.error(`Playtester crashed: ${err.message}`);
  process.exit(1);
});
