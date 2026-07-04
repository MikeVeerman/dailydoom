#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';

import {
  extractAttributeReferences,
  getLocalReferencePath,
  isExternalReference
} from './render-versioned-index.mjs';
import { runAssetVersioningTests } from './test-asset-versioning.mjs';

const ASSET_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'json', 'mp3', 'wav', 'ogg'];
const KEY_RUNTIME_ASSETS = [
  'assets/images/hero.png',
  'assets/sprites/enemies/sprite_config.json',
  'assets/sprites/imp_fixed_transparent.png',
  'assets/sprites/items/barrel.png',
  'assets/sprites/weapons/fps_gun_idle.png',
  'assets/sprites/weapons/fps_melee_idle.png',
  'assets/sprites/weapons/fps_handgun.png',
  'assets/sprites/weapons/shotgun_pickup.png',
  'assets/sprites/weapons/rifle_pickup.png',
  'assets/sprites/weapons/rocket_pickup.png',
  'assets/sprites/weapons/chaingun_pickup.png',
  'assets/sprites/weapons/knife_pickup.png',
  'assets/textures/stone.png',
  'assets/textures/metal.png',
  'assets/textures/brick.png',
  'assets/textures/tech.png',
  'assets/textures/marble.png'
];

function nowIso() {
  return new Date().toISOString();
}

function createRecorder() {
  const assertions = [];

  return {
    assertions,
    pass(id, message, details = []) {
      assertions.push({ id, status: 'pass', message, details });
    },
    fail(id, message, details = []) {
      assertions.push({ id, status: 'fail', message, details });
    },
    warn(id, message, details = []) {
      assertions.push({ id, status: 'warn', message, details });
    }
  };
}

async function fileExists(rootDir, relativePath) {
  const normalized = path.normalize(relativePath);
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) return false;

  try {
    const stat = await fs.stat(path.join(rootDir, normalized));
    return stat.isFile();
  } catch {
    return false;
  }
}

function localReferenceFromValue(value) {
  if (!value || isExternalReference(value)) return null;

  const localPath = getLocalReferencePath(value);
  if (!localPath || localPath.startsWith('#')) return null;
  return localPath;
}

function extractScriptSrcs(html) {
  const scripts = [];
  const scriptPattern = /<script\b[^>]*\bsrc=("([^"]*)"|'([^']*)')[^>]*>/gi;
  let match;

  while ((match = scriptPattern.exec(html)) !== null) {
    scripts.push(match[2] ?? match[3] ?? '');
  }

  return scripts;
}

function extractIndexAssetRefs(html) {
  return extractAttributeReferences(html)
    .map(ref => localReferenceFromValue(ref.value))
    .filter(Boolean)
    .filter(ref => {
      const extension = path.extname(ref).slice(1).toLowerCase();
      return ref.startsWith('css/') || ref.startsWith('assets/') || ASSET_EXTENSIONS.includes(extension);
    });
}

function extractLiteralAssetRefs(source) {
  const refs = new Set();
  const assetPattern = /["'`](assets\/[^"'`$]+\.(?:png|jpg|jpeg|gif|webp|json|mp3|wav|ogg))["'`]/gi;
  let match;

  while ((match = assetPattern.exec(source)) !== null) {
    refs.add(match[1]);
  }

  return refs;
}

async function collectJsLiteralAssetRefs(rootDir, scriptRefs) {
  const refs = new Set();

  for (const scriptRef of scriptRefs) {
    const source = await fs.readFile(path.join(rootDir, scriptRef), 'utf8');
    for (const assetRef of extractLiteralAssetRefs(source)) {
      refs.add(assetRef);
    }
  }

  return refs;
}

async function collectSpriteConfigRefs(rootDir) {
  const configPath = path.join(rootDir, 'assets/sprites/enemies/sprite_config.json');
  const refs = new Set();
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

  for (const enemy of Object.values(config.enemies || {})) {
    for (const state of Object.values(enemy.states || {})) {
      for (const frame of state.frames || []) {
        refs.add(`assets/sprites/enemies/${frame}`);
      }
    }
  }

  return refs;
}

async function validateExistingFiles(rootDir, recorder, id, refs, sourceLabel) {
  const missing = [];
  const uniqueRefs = [...new Set(refs)].sort();

  for (const ref of uniqueRefs) {
    if (!(await fileExists(rootDir, ref))) {
      missing.push(ref);
    }
  }

  if (missing.length > 0) {
    recorder.fail(
      id,
      `${sourceLabel} references missing local files.`,
      missing.map(ref => `${ref} - create the file or update the stale reference.`)
    );
    return;
  }

  recorder.pass(id, `${sourceLabel} references exist.`, [`checked=${uniqueRefs.length}`]);
}

async function runQaGate(rootDir = process.cwd()) {
  const recorder = createRecorder();
  const indexPath = path.join(rootDir, 'index.html');
  const html = await fs.readFile(indexPath, 'utf8');

  const localScriptRefs = extractScriptSrcs(html)
    .map(localReferenceFromValue)
    .filter(Boolean);

  await validateExistingFiles(rootDir, recorder, 'HTML-SCRIPT-01', localScriptRefs, 'index.html script');

  const indexAssetRefs = extractIndexAssetRefs(html);
  await validateExistingFiles(rootDir, recorder, 'HTML-ASSET-01', indexAssetRefs, 'index.html asset');

  const existingScriptRefs = [];
  for (const scriptRef of localScriptRefs) {
    if (await fileExists(rootDir, scriptRef)) {
      existingScriptRefs.push(scriptRef);
    }
  }

  const jsAssetRefs = await collectJsLiteralAssetRefs(rootDir, existingScriptRefs);
  for (const keyAsset of KEY_RUNTIME_ASSETS) {
    jsAssetRefs.add(keyAsset);
  }
  await validateExistingFiles(rootDir, recorder, 'RUNTIME-ASSET-01', jsAssetRefs, 'runtime asset');

  const spriteConfigRefs = await collectSpriteConfigRefs(rootDir);
  await validateExistingFiles(rootDir, recorder, 'SPRITE-CONFIG-01', spriteConfigRefs, 'sprite_config.json frame');

  const assetVersioning = await runAssetVersioningTests({ cwd: rootDir, silent: true });
  if (assetVersioning.failed > 0) {
    recorder.fail(
      'ASSET-VERSIONING-01',
      'Asset versioning renderer test failed.',
      assetVersioning.failures.map(failure => `${failure} - run npm run test:asset-versioning for details.`)
    );
  } else {
    recorder.pass('ASSET-VERSIONING-01', 'Asset versioning renderer test passed.', [`checks=${assetVersioning.passed}`]);
  }

  const forcedFailureId = process.env.QA_GATE_FORCE_FAIL_ASSERTION;
  if (forcedFailureId) {
    recorder.fail(forcedFailureId, 'Forced failure requested by QA_GATE_FORCE_FAIL_ASSERTION.', [
      'Unset QA_GATE_FORCE_FAIL_ASSERTION to run the real gate.'
    ]);
  }

  return recorder.assertions;
}

function summarize(assertions) {
  return {
    passed: assertions.filter(assertion => assertion.status === 'pass').length,
    failed: assertions.filter(assertion => assertion.status === 'fail').length,
    warnings: assertions.filter(assertion => assertion.status === 'warn').length
  };
}

function printFailures(assertions) {
  const failures = assertions.filter(assertion => assertion.status === 'fail');
  if (failures.length === 0) return;

  console.error('Actionable failures:');
  for (const failure of failures) {
    console.error(`- [${failure.id}] ${failure.message}`);
    for (const detail of failure.details || []) {
      console.error(`  ${detail}`);
    }
  }
}

async function writeReport(rootDir, reportPath, assertions, status) {
  const absoluteReportPath = path.resolve(rootDir, reportPath);
  const report = {
    status,
    generatedAt: nowIso(),
    assertions
  };

  await fs.mkdir(path.dirname(absoluteReportPath), { recursive: true });
  await fs.writeFile(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`);
  return absoluteReportPath;
}

async function main() {
  const rootDir = process.cwd();
  const reportPath = process.env.QA_GATE_REPORT_PATH || 'artifacts/qa-gate/latest.json';
  let assertions;

  try {
    assertions = await runQaGate(rootDir);
  } catch (error) {
    const errorAssertions = [{
      id: 'QA-INFRA-01',
      status: 'fail',
      message: 'QA gate infrastructure error.',
      details: [`${error.message} - verify index.html, script paths, and JSON fixtures are readable.`]
    }];
    const absoluteReportPath = await writeReport(rootDir, reportPath, errorAssertions, 'ERROR');
    console.error(`QA_GATE ERROR passed=0 failed=1 warnings=0`);
    console.error(`reportPath=${path.relative(rootDir, absoluteReportPath)}`);
    printFailures(errorAssertions);
    process.exitCode = 2;
    return;
  }

  const summary = summarize(assertions);
  const status = summary.failed > 0 ? 'FAIL' : 'PASS';
  const absoluteReportPath = await writeReport(rootDir, reportPath, assertions, status);

  console.log(`QA_GATE ${status} passed=${summary.passed} failed=${summary.failed} warnings=${summary.warnings}`);
  console.log(`reportPath=${path.relative(rootDir, absoluteReportPath)}`);
  printFailures(assertions);
  process.exitCode = summary.failed > 0 ? 1 : 0;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  main().catch(error => {
    console.error(`run-qa-gate: ${error.message}`);
    process.exitCode = 2;
  });
}
