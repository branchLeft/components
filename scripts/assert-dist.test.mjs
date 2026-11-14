import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertDistPresent, assertPackedDist, distIsPackaged } from './assert-dist.mjs';

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assert-dist.mjs');
const temporaryDirs = [];

// Every spelling of a `files` entry that names the dist directory.
const distSpellings = [
  'dist',
  './dist',
  'dist/',
  './dist/',
  'dist/*',
  'dist/**',
  './dist/*',
  './dist/**',
  'dist/**/*',
  './dist/**/*',
];

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

  it.each(distSpellings)('is true when the files list names dist as %s', (spelling) => {
    expect(distIsPackaged({ files: [spelling] })).toBe(true);
  });

  it('is false when the files list does not name dist, or has no files list', () => {
    expect(distIsPackaged({ files: ['src'] })).toBe(false);
    expect(distIsPackaged({ files: ['dist-tools'] })).toBe(false);
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

  describe.each(distSpellings)('when the files entry is %s', (spelling) => {
    it('fails when dist/ is missing', () => {
      const dir = makePackage({ files: [spelling], withDist: false });
      expect(() => assertDistPresent(dir)).toThrow(/dist\/ is missing/);
    });

    it('passes when dist/ holds a built file', () => {
      const dir = makePackage({ files: [spelling], withDist: true });
      expect(() => assertDistPresent(dir)).not.toThrow();
    });
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
  function runCliAt(script, args) {
    try {
      execFileSync(process.execPath, [script, ...args], { stdio: 'pipe' });
      return 0;
    } catch (error) {
      return error.status;
    }
  }

  function runCli(args) {
    return runCliAt(scriptPath, args);
  }

  // A package whose dist/ is present, packed into a tarball that holds only package.json.
  function makeTarballWithoutDist() {
    const dir = makePackage({ files: ['dist'], withDist: true });
    const stage = mkdtempSync(path.join(tmpdir(), 'assert-dist-stage-'));
    temporaryDirs.push(stage);
    mkdirSync(path.join(stage, 'package'));
    copyFileSync(path.join(dir, 'package.json'), path.join(stage, 'package', 'package.json'));
    const tarball = path.join(stage, 'fixture.tgz');
    execFileSync('tar', ['-czf', tarball, '-C', stage, 'package']);
    return { dir, tarball };
  }

  it('exits 1 for a package with no dist/, and 0 once it is built', () => {
    const dir = makePackage({ files: ['dist'], withDist: false });
    expect(runCli([dir])).toBe(1);
    mkdirSync(path.join(dir, 'dist'));
    writeFileSync(path.join(dir, 'dist', 'index.js'), '// built\n');
    expect(runCli([dir])).toBe(0);
  });

  it('still checks the tarball when the script is run through a symlink', () => {
    const { dir, tarball } = makeTarballWithoutDist();
    const linkDir = mkdtempSync(path.join(tmpdir(), 'assert-dist-link-'));
    temporaryDirs.push(linkDir);
    const link = path.join(linkDir, 'assert-dist-link.mjs');
    symlinkSync(scriptPath, link);
    expect(runCliAt(link, [dir, tarball])).toBe(1);
  });
});
