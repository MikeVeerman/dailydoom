#!/usr/bin/env node

import { execFile } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath, pathToFileURL } from 'url';

import {
  addVersionToReference,
  extractAttributeReferences,
  renderVersionedIndex,
  shouldVersionReference
} from './render-versioned-index.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(new URL('./render-versioned-index.mjs', import.meta.url));

async function removeDir(dir) {
  if (fs.rm) {
    await fs.rm(dir, { recursive: true, force: true });
    return;
  }
  await fs.rmdir(dir, { recursive: true });
}

function fail(failures, message) {
  failures.push(message);
}

export async function runAssetVersioningTests(options = {}) {
  const cwd = options.cwd || process.cwd();
  const silent = Boolean(options.silent);
  const version = 'asset-versioning-test';
  const failures = [];
  let passed = 0;

  const indexPath = path.join(cwd, 'index.html');
  const source = await fs.readFile(indexPath, 'utf8');
  const rendered = renderVersionedIndex(source, version);
  const refs = extractAttributeReferences(source);
  const versionedRefs = refs.filter(ref => shouldVersionReference(ref.value));

  if (versionedRefs.length === 0) {
    fail(failures, 'Expected at least one first-party css/ or js/ reference in index.html.');
  } else {
    passed += 1;
  }

  for (const ref of versionedRefs) {
    const expected = addVersionToReference(ref.value, version);
    if (!rendered.includes(`${ref.attr}="${expected}"`) && !rendered.includes(`${ref.attr}='${expected}'`)) {
      fail(failures, `Expected ${ref.value} to render as ${expected}.`);
    } else {
      passed += 1;
    }

    if (rendered.includes(`${ref.attr}="${ref.value}"`) || rendered.includes(`${ref.attr}='${ref.value}'`)) {
      fail(failures, `Found unversioned first-party reference after rendering: ${ref.value}.`);
    } else {
      passed += 1;
    }
  }

  const analyticsUrl = 'https://www.googletagmanager.com/gtag/js?id=G-RRV1Y2CNFG';
  if (!rendered.includes(analyticsUrl)) {
    fail(failures, 'Expected third-party Google Analytics URL to remain unchanged.');
  } else {
    passed += 1;
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dailydoom-asset-versioning-'));
  try {
    const outputPath = path.join(tempDir, 'index.html');
    await execFileAsync(process.execPath, [
      SCRIPT_PATH,
      '--version',
      version,
      '--input',
      indexPath,
      '--output',
      outputPath
    ], { cwd });

    const cliRendered = await fs.readFile(outputPath, 'utf8');
    if (cliRendered !== rendered) {
      fail(failures, 'CLI output did not match renderVersionedIndex() output.');
    } else {
      passed += 1;
    }
  } finally {
    await removeDir(tempDir);
  }

  const result = {
    passed,
    failed: failures.length,
    failures
  };

  if (!silent) {
    if (failures.length > 0) {
      console.error('Asset versioning test failed:');
      for (const failure of failures) {
        console.error(`- ${failure}`);
      }
    } else {
      console.log(`Asset versioning test passed (${passed} checks).`);
    }
  }

  return result;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  runAssetVersioningTests().then(result => {
    process.exitCode = result.failed > 0 ? 1 : 0;
  }).catch(error => {
    console.error(`test-asset-versioning: ${error.message}`);
    process.exitCode = 2;
  });
}
