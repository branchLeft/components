import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertDistPresent, assertPackedDist, distIsPackaged } from './assert-dist.mjs';

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assert-dist.mjs');
const temporaryDirs = [];

function makePackage({ files, withDist, distFiles = ['index.js'] }) {
  const dir = mkdtempSync(path.join(tmpdir(), 'assert-dist-'));
  temporaryDirs.push(dir);
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'fixture', files }));
  if (withDist) {
    mkdirSync(path.join(dir, 'dist'));
    for (const file of distFiles) {
      writeFileSync(path.join(dir, 'dist', file), '// built\n');
    }
  }
  return dir;
}

afterEach(() => {
  for (const dir of temporaryDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('distIsPackaged', () => {
  it('is true when the files list names dist', () => {
    expect(distIsPackaged({ files: ['dist'] })).toBe(true);
    expect(distIsPackaged({ files: ['./dist/'] })).toBe(true);
  });

  it('is false when the files list does not name dist, or has no files list', () => {
    expect(distIsPackaged({ files: ['src'] })).toBe(false);
    expect(distIsPackaged({})).toBe(false);
  });
});

describe('assertDistPresent', () => {
  it('fails when dist/ is missing', () => {
    const dir = makePackage({ files: ['dist'], withDist: false });
    expect(() => assertDistPresent(dir)).toThrow(/dist\/ is missing/);
  });

  it('fails when dist/ exists but holds no file', () => {
    const dir = makePackage({ files: ['dist'], withDist: true, distFiles: [] });
    expect(() => assertDistPresent(dir)).toThrow(/dist\/ is empty/);
  });

  it('passes when dist/ holds a built file', () => {
    const dir = makePackage({ files: ['dist'], withDist: true });
    expect(() => assertDistPresent(dir)).not.toThrow();
  });

  it('does not require dist/ when the files list does not name it', () => {
    const dir = makePackage({ files: ['src'], withDist: false });
    expect(() => assertDistPresent(dir)).not.toThrow();
  });
});

describe('assertPackedDist', () => {
  it('fails when the tarball lists only package.json', () => {
    expect(() => assertPackedDist(['package/package.json'], { files: ['dist'] })).toThrow(
      /lists no dist\/ file/
    );
  });

  it('passes when the tarball lists a file under dist/', () => {
    expect(() =>
      assertPackedDist(['package/package.json', 'package/dist/index.js'], { files: ['dist'] })
    ).not.toThrow();
  });

  it('does not require dist/ in the tarball when the files list does not name it', () => {
    expect(() => assertPackedDist(['package/package.json'], { files: ['src'] })).not.toThrow();
  });
});

describe('command line', () => {
  function runCli(args) {
    try {
      execFileSync(process.execPath, [scriptPath, ...args], { stdio: 'pipe' });
      return 0;
    } catch (error) {
      return error.status;
    }
  }

  it('exits 1 for a package with no dist/, and 0 once it is built', () => {
    const dir = makePackage({ files: ['dist'], withDist: false });
    expect(runCli([dir])).toBe(1);
    mkdirSync(path.join(dir, 'dist'));
    writeFileSync(path.join(dir, 'dist', 'index.js'), '// built\n');
    expect(runCli([dir])).toBe(0);
  });
});
