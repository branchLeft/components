// Proof for .github/CODEOWNERS: a fixed list of sample paths (codeowners-samples.tsv)
// says whether each one has an owner. Run it against another copy of the file
// with CODEOWNERS_FILE=<path> to see which rows an older or edited file breaks.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isOwned, parseCodeowners, patternToRegExp } from './codeowners-match';

const OWNER = '@branchLeft/branchleft-admin';

// The five shared lines of the standards template (SYNC-1): they stay the final
// lines of the file, so a repo's own lines sit above them.
const TEMPLATE_TAIL: readonly string[] = [
  `/.standardsignore ${OWNER}`,
  `/.standards.mode ${OWNER}`,
  `/.docs-lint* ${OWNER}`,
  `/.standards-db-tooling ${OWNER}`,
  `/.github/ ${OWNER}`,
];

// Every kept class must have an owned sample, and every released class a free one.
const OWNED_CLASSES: readonly string[] = ['c1', 'c2', 'c3', 'c8'];
const FREE_CLASSES: readonly string[] = [
  'source',
  'test',
  'doc',
  'lockfile',
  'checker',
  'probe',
  'lint-config',
  'asset',
];

interface Sample {
  path: string;
  expected: 'owned' | 'free';
  cls: string;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const codeownersFile = process.env['CODEOWNERS_FILE'] ?? path.join(root, '.github', 'CODEOWNERS');
const text = readFileSync(codeownersFile, 'utf8');
const rules = parseCodeowners(text);

function readSamples(): Sample[] {
  const raw = readFileSync(path.join(root, 'scripts', 'codeowners-samples.tsv'), 'utf8');
  return raw
    .split('\n')
    .slice(1)
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [samplePath, expected, cls] = line.split('\t');
      if (
        samplePath === undefined ||
        cls === undefined ||
        (expected !== 'owned' && expected !== 'free')
      ) {
        throw new Error(`Malformed sample row: ${line}`);
      }
      return { path: samplePath, expected, cls };
    });
}

const samples = readSamples();

describe('CODEOWNERS sample paths', () => {
  it.each(samples)('$path is $expected ($cls)', (sample) => {
    expect(isOwned(rules, sample.path) ? 'owned' : 'free').toBe(sample.expected);
  });

  it('has an owned sample for every kept criterion', () => {
    for (const cls of OWNED_CLASSES) {
      expect(
        samples.some((s) => s.cls === cls && s.expected === 'owned'),
        `no owned sample for ${cls}`
      ).toBe(true);
    }
  });

  it('has a free sample for every released class', () => {
    for (const cls of FREE_CLASSES) {
      expect(
        samples.some((s) => s.cls === cls && s.expected === 'free'),
        `no free sample for ${cls}`
      ).toBe(true);
    }
  });
});

describe('CODEOWNERS file shape', () => {
  it('has no catch-all pattern', () => {
    const catchAll = rules.filter((r) => ['*', '/*', '**', '/**', '**/*'].includes(r.pattern));
    expect(catchAll.map((r) => r.pattern)).toEqual([]);
  });

  it('names no owner but the owner team', () => {
    const others = rules.flatMap((r) => r.owners).filter((o) => o !== OWNER);
    expect(others).toEqual([]);
  });

  it('ends with the five lines of the standards template', () => {
    const tail = rules
      .slice(-TEMPLATE_TAIL.length)
      .map((r) => `${r.pattern} ${r.owners.join(' ')}`);
    expect(tail).toEqual([...TEMPLATE_TAIL]);
  });
});

describe('CODEOWNERS matcher', () => {
  it('anchors a leading slash and lets a bare name match at any depth', () => {
    expect(patternToRegExp('/a.txt').test('a.txt')).toBe(true);
    expect(patternToRegExp('/a.txt').test('dir/a.txt')).toBe(false);
    expect(patternToRegExp('a.txt').test('dir/a.txt')).toBe(true);
  });

  it('treats a trailing slash as a directory and everything under it', () => {
    expect(patternToRegExp('/dir/').test('dir/x/y.txt')).toBe(true);
    expect(patternToRegExp('/dir/').test('dir')).toBe(false);
  });

  it('keeps * inside a path segment and lets ** cross segments', () => {
    expect(patternToRegExp('/a/*.txt').test('a/b/c.txt')).toBe(false);
    expect(patternToRegExp('/a/**/c.txt').test('a/b/c.txt')).toBe(true);
    expect(patternToRegExp('**/c.txt').test('c.txt')).toBe(true);
  });

  it('refuses syntax GitHub does not support in CODEOWNERS', () => {
    expect(() => patternToRegExp('!a.txt')).toThrow();
    expect(() => patternToRegExp('[ab].txt')).toThrow();
    expect(() => patternToRegExp('a\\ b')).toThrow();
  });
});
