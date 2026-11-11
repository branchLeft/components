#!/usr/bin/env node
// Fails when a package whose `files` lists `dist` would ship without its
// build output. `pnpm pack` takes whatever `dist/` holds at that moment, so a
// missing or empty `dist/` produces a tarball with only package.json, and
// nothing else in the release flow notices. This checks the package
// directory, and optionally the packed tarball's own entry list, before the
// tarball is attested or published.
//
// Usage: node scripts/assert-dist.mjs <packageDir> [tarball]

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** True when the package's `files` list names the `dist` directory. */
export function distIsPackaged(pkg) {
  if (!Array.isArray(pkg.files)) return false;
  return pkg.files.some((entry) => /^\.?\/?dist\/?$/.test(entry));
}

function listFilesRecursively(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? listFilesRecursively(full) : [full];
  });
}

/** Throws when `files` names dist and the package directory's dist/ is missing or empty. */
export function assertDistPresent(packageDir) {
  const pkg = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
  if (!distIsPackaged(pkg)) return;
  const distDir = path.join(packageDir, 'dist');
  if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
    throw new Error(`${packageDir}: dist/ is missing, but package.json files lists dist`);
  }
  if (listFilesRecursively(distDir).length === 0) {
    throw new Error(`${packageDir}: dist/ is empty, but package.json files lists dist`);
  }
}

/**
 * Throws when `files` names dist and the tarball's entry list (as `tar -tzf`
 * prints it) holds no file under dist/. Directory entries (trailing slash)
 * do not count: an empty dist/ directory still ships nothing.
 */
export function assertPackedDist(entries, pkg) {
  if (!distIsPackaged(pkg)) return;
  const hasDistFile = entries.some((entry) => /^[^/]+\/dist\/.+[^/]$/.test(entry));
  if (!hasDistFile) {
    throw new Error(`packed tarball lists no dist/ file (entries: ${entries.join(', ')})`);
  }
}

function main(argv) {
  const [packageDir, tarball] = argv;
  if (!packageDir) {
    process.stderr.write('usage: assert-dist.mjs <packageDir> [tarball]\n');
    return 2;
  }
  try {
    assertDistPresent(packageDir);
    if (tarball) {
      const pkg = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
      const entries = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
        .split('\n')
        .filter((line) => line !== '');
      assertPackedDist(entries, pkg);
    }
  } catch (error) {
    process.stderr.write(`::error::${error.message}\n`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exitCode = main(process.argv.slice(2));
}
