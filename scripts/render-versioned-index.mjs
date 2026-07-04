#!/usr/bin/env node

import { execFileSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';

export const VERSIONED_PREFIXES = ['css/', 'js/'];

function splitReference(value) {
  const hashIndex = value.indexOf('#');
  const beforeHash = hashIndex === -1 ? value : value.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : value.slice(hashIndex);
  const queryIndex = beforeHash.indexOf('?');

  if (queryIndex === -1) {
    return { pathname: beforeHash, query: '', hash };
  }

  return {
    pathname: beforeHash.slice(0, queryIndex),
    query: beforeHash.slice(queryIndex + 1),
    hash
  };
}

export function isExternalReference(value) {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(value)
    || /^[a-z][a-z0-9+.-]*:/i.test(value)
    || value.startsWith('#');
}

export function getLocalReferencePath(value) {
  if (!value || isExternalReference(value)) return null;

  const { pathname } = splitReference(value.trim());
  if (!pathname) return null;

  if (pathname.startsWith('/')) {
    return pathname.slice(1);
  }

  return pathname.replace(/^\.\//, '');
}

export function shouldVersionReference(value) {
  const localPath = getLocalReferencePath(value);
  return Boolean(localPath && VERSIONED_PREFIXES.some(prefix => localPath.startsWith(prefix)));
}

export function addVersionToReference(value, version) {
  const { pathname, query, hash } = splitReference(value);
  const params = new URLSearchParams(query);
  params.set('v', version);
  return `${pathname}?${params.toString()}${hash}`;
}

export function extractAttributeReferences(html, attributes = ['src', 'href']) {
  const wanted = new Set(attributes);
  const refs = [];
  const attrPattern = /\b(src|href)=("([^"]*)"|'([^']*)')/gi;
  let match;

  while ((match = attrPattern.exec(html)) !== null) {
    const attr = match[1].toLowerCase();
    if (!wanted.has(attr)) continue;
    refs.push({
      attr,
      value: match[3] ?? match[4] ?? '',
      index: match.index
    });
  }

  return refs;
}

export function renderVersionedIndex(html, version) {
  if (!version) {
    throw new Error('A non-empty version is required.');
  }

  return html.replace(/\b(src|href)=("([^"]*)"|'([^']*)')/gi, (full, attr, quoted, doubleValue, singleValue) => {
    const value = doubleValue ?? singleValue ?? '';
    if (!shouldVersionReference(value)) return full;

    const quote = quoted[0];
    return `${attr}=${quote}${addVersionToReference(value, version)}${quote}`;
  });
}

function readPackageVersion(rootDir) {
  try {
    const packageText = execFileSync(
      process.execPath,
      ['-p', 'require("./package.json").version || ""'],
      { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    return packageText || null;
  } catch {
    return null;
  }
}

function gitVersion(rootDir) {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return null;
  }
}

function defaultVersion(rootDir) {
  const envVersion = process.env.RELEASE_VERSION || process.env.GITHUB_SHA;
  if (envVersion) return envVersion.slice(0, 40);

  const gitSha = gitVersion(rootDir);
  if (gitSha) return gitSha;

  return readPackageVersion(rootDir) || 'dev';
}

function parseArgs(argv) {
  const options = {
    input: 'index.html',
    output: null,
    version: null,
    stdout: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) {
        throw new Error(`${arg} requires a value.`);
      }
      return argv[index];
    };

    if (arg === '--input') options.input = next();
    else if (arg === '--output') options.output = next();
    else if (arg === '--version') options.version = next();
    else if (arg === '--stdout') options.stdout = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function usage() {
  return [
    'Usage: node scripts/render-versioned-index.mjs [--version VERSION] [--input index.html] [--output build/index.html] [--stdout]',
    '',
    'Adds ?v=<version> to first-party css/ and js/ references in index.html.',
    'VERSION defaults to RELEASE_VERSION, GITHUB_SHA, git short SHA, package version, then dev.'
  ].join('\n');
}

export async function renderVersionedIndexFile(options, rootDir = process.cwd()) {
  const inputPath = path.resolve(rootDir, options.input || 'index.html');
  const version = options.version || defaultVersion(rootDir);
  const source = await fs.readFile(inputPath, 'utf8');
  const rendered = renderVersionedIndex(source, version);

  if (options.stdout || !options.output) {
    process.stdout.write(rendered);
    return { inputPath, outputPath: null, version, bytes: Buffer.byteLength(rendered) };
  }

  const outputPath = path.resolve(rootDir, options.output);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, rendered);
  return { inputPath, outputPath, version, bytes: Buffer.byteLength(rendered) };
}

async function main() {
  const rootDir = process.cwd();
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(usage());
    return;
  }

  const result = await renderVersionedIndexFile(options, rootDir);
  if (result.outputPath) {
    console.log(`Rendered ${path.relative(rootDir, result.outputPath)} with v=${result.version}`);
  }
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  main().catch(error => {
    console.error(`render-versioned-index: ${error.message}`);
    process.exitCode = 1;
  });
}
