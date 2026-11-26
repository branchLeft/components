// Proof for .github/CODEOWNERS: a fixed list of sample paths (codeowners-samples.tsv)
// says whether each one has an owner. Run it against another copy of the file
// with CODEOWNERS_FILE=<path> to see which rows an older or edited file breaks.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isOwned, parseCodeowners, patternToRegExp } from './codeowners-match';

const OWNER = '@branchLeft/branchleft-admin';

// The seven shared lines of the standards template (SYNC-1): they stay the final
// lines of the file, so a repo's own lines sit above them.
const TEMPLATE_TAIL: readonly string[] = [
  `/.standardsignore ${OWNER}`,
  `/.standards.mode ${OWNER}`,
  `/.docs-lint* ${OWNER}`,
  `/.standards-db-tooling ${OWNER}`,
  `/.github/CODEOWNERS ${OWNER}`,
  `/.github/workflows/standards.yml ${OWNER}`,
  `/.github/workflows/docs-lint.yml ${OWNER}`,
];

// Every kept class must have an owned sample, and every released class a free one.
const OWNED_CLASSES: readonly string[] = ['c1', 'c3', 'c8'];
const FREE_CLASSES: readonly string[] = [
  'source',
  'test',
  'doc',
  'lockfile',
  'checker',
  'probe',
  'lint-config',
  'ci-config',
  'asset',
  'changeset',
  'install-config',
  'manifest',
  'vite',
  'storybook',
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

  it('ends with the seven lines of the standards template', () => {
    const tail = rules
      .slice(-TEMPLATE_TAIL.length)
      .map((r) => `${r.pattern} ${r.owners.join(' ')}`);
    expect(tail).toEqual([...TEMPLATE_TAIL]);
  });
});

// Sabotage: delete the one line that owns each path of the publish gate and the
// path must turn free, which proves the line is what owns it (not a later line).
const SABOTAGE: ReadonlyArray<readonly [string, string]> = [
  ['/scripts/release-plan.mjs', 'scripts/release-plan.mjs'],
  ['/scripts/peer-bump-safety.mjs', 'scripts/peer-bump-safety.mjs'],
  ['/scripts/storybook-a11y-check*', 'scripts/storybook-a11y-check.mjs'],
  ['/scripts/storybook-a11y-check*', 'scripts/storybook-a11y-check.test.mjs'],
  ['/.pre-commit-config.yaml', '.pre-commit-config.yaml'],
  ['/eslint.config.js', 'eslint.config.js'],
  ['/.prettierignore', '.prettierignore'],
  ['**/.gitignore', '.gitignore'],
  ['**/vitest.config.*', 'packages/components/vitest.config.ts'],
  ['**/vitest.config.*', 'packages/brand-branchleft/vitest.config.ts'],
  ['/test-utils/', 'test-utils/axe-setup.ts'],
  ['/test-utils/', 'test-utils/localstorage-setup.ts'],
  ['/scripts/assert-dist*', 'scripts/assert-dist.mjs'],
  ['/.github/workflows/ci.yml', '.github/workflows/ci.yml'],
  ['/.github/workflows/publish.yml', '.github/workflows/publish.yml'],
  ['/.github/workflows/codeql.yml', '.github/workflows/codeql.yml'],
  ['/.github/actions/', '.github/actions/example/action.yml'],
];

describe('CODEOWNERS sabotage', () => {
  it.each(SABOTAGE)('deleting %s releases %s', (pattern, samplePath) => {
    expect(isOwned(rules, samplePath)).toBe(true);
    const without = rules.filter((r) => r.pattern !== pattern);
    expect(without.length).toBe(rules.length - 1);
    expect(isOwned(without, samplePath)).toBe(false);
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

// The hold rule, read from the workflow text itself. A workflow or local action
// stays owned when it names a secret other than GITHUB_TOKEN, carries an
// environment, grants any write permission, has no explicit permissions block,
// or declares secrets on workflow_call. A file that matches and is not owned
// turns this test red, so a new workflow cannot be released by accident.
function holdReasons(body: string, isAction: boolean): string[] {
  const out: string[] = [];
  if (
    /(?<![\w-])secrets\.(?!GITHUB_TOKEN\b)[A-Za-z_]/.test(body) ||
    /(?<![\w-])secrets\[/.test(body) ||
    /secrets:\s*inherit/.test(body)
  ) {
    out.push('secrets');
  }
  if (/^\s+environment:/m.test(body)) out.push('environment');
  if (/^\s+[a-z-]+:\s*write\s*(#.*)?$/m.test(body) || /permissions:\s*write-all/.test(body)) {
    out.push('write permission');
  }
  if (/workflow_call:/.test(body) && /^\s{4}secrets:\s*$/m.test(body)) {
    out.push('workflow_call secrets');
  }
  if (!isAction && !/^permissions:/m.test(body)) {
    const jobsAt = body.search(/^jobs:\s*$/m);
    const jobsText = jobsAt < 0 ? '' : body.slice(jobsAt).replace(/^jobs:\s*\n/, '');
    const jobs = jobsText.split(/^ {2}(?=[A-Za-z0-9_.-]+:\s*(?:#.*)?$)/m).slice(1);
    if (jobs.length === 0 || jobs.some((job) => !/^ {4}permissions:/m.test(job))) {
      out.push('no permissions block');
    }
  }
  return out;
}

function automationFiles(): string[] {
  const found: string[] = [];
  const workflows = path.join(root, '.github', 'workflows');
  if (existsSync(workflows)) {
    for (const name of readdirSync(workflows)) {
      if (/\.ya?ml$/.test(name)) found.push(`.github/workflows/${name}`);
    }
  }
  const actions = path.join(root, '.github', 'actions');
  if (existsSync(actions)) {
    for (const dir of readdirSync(actions)) {
      for (const leaf of ['action.yml', 'action.yaml']) {
        if (existsSync(path.join(actions, dir, leaf))) {
          found.push(`.github/actions/${dir}/${leaf}`);
        }
      }
    }
  }
  return found.sort();
}

describe('CODEOWNERS holds every workflow that matches the rule', () => {
  const files = automationFiles();

  it('finds the workflows', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s is owned when the rule matches it', (file) => {
    const reasons = holdReasons(
      readFileSync(path.join(root, file), 'utf8'),
      file.startsWith('.github/actions/')
    );
    if (reasons.length > 0) {
      expect(isOwned(rules, file), `${file} (${reasons.join(', ')})`).toBe(true);
    }
  });
});
