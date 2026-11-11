// Holds the CI job that verifies the signed build attestation of every locked
// @branchleft package to what it must be: present, pinned to a commit SHA with
// a version comment, running with exactly `contents: read` and
// `packages: read`, and scanning the whole workspace.
//
// The check is a function of the workflow text, so each control is proven by
// handing it a copy with that control broken and requiring a named problem.
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const CI_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '.github',
  'workflows',
  'ci.yml'
);

const JOB = 'verify-package-attestations';
const ACTION = 'branchLeft/github-workflows/.github/actions/verify-package-attestations';
const PINNED_SHA = '231e592397f4c94668c64646c14160d9d497bdde';
const PINNED_TAG = 'v1.2.2';

const indentOf = (line) => line.length - line.trimStart().length;

/** The lines of one top-level job, from its key to the next key at the same depth. */
function jobLines(text, job) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line === `  ${job}:`);
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].trim() !== '' && indentOf(lines[i]) <= 2 && !lines[i].trim().startsWith('#')) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end);
}

/** The `key: value` pairs under the job's own `permissions:` block. */
function permissionsOf(lines) {
  const at = lines.findIndex((line) => line === '    permissions:');
  if (at === -1) return null;
  const granted = {};
  for (let i = at + 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '' || indentOf(lines[i]) <= 4) break;
    const match = lines[i].trim().match(/^([a-z-]+):\s*(\S+)$/);
    if (match) granted[match[1]] = match[2];
  }
  return granted;
}

/** Every way the verify job differs from what it must be; empty when it is right. */
function problemsWith(text) {
  const lines = jobLines(text, JOB);
  if (!lines) return [`job ${JOB} is missing`];
  const problems = [];

  const granted = permissionsOf(lines);
  if (granted === null) {
    problems.push('the job has no permissions block of its own');
  } else if (JSON.stringify(granted) !== JSON.stringify({ contents: 'read', packages: 'read' })) {
    problems.push(
      `permissions are ${JSON.stringify(granted)}, not contents: read and packages: read`
    );
  }

  const uses = lines.filter((line) => line.includes(`uses: ${ACTION}`));
  if (uses.length !== 1) {
    problems.push(`the verify action is used ${uses.length} times, not once`);
  } else {
    const wanted = `uses: ${ACTION}@${PINNED_SHA} # ${PINNED_TAG}`;
    if (!uses[0].trim().endsWith(wanted)) {
      problems.push(`the verify step is not pinned as "${PINNED_SHA} # ${PINNED_TAG}"`);
    }
  }

  const root = lines.find((line) => /^\s+root:/.test(line));
  if (root && !/root:\s*['"]?\.['"]?\s*$/.test(root)) {
    problems.push('the verify step narrows the scan root below the workspace root');
  }
  if (lines.some((line) => /continue-on-error:\s*true/.test(line))) {
    problems.push('the verify job may not continue on error');
  }
  if (lines.some((line) => /^\s{4}if:/.test(line))) {
    problems.push('the verify job is conditional, so it can be skipped');
  }
  return problems;
}

const real = fs.readFileSync(CI_PATH, 'utf8');

describe('the attestation verify job in ci.yml', () => {
  it('is present, SHA-pinned, with exactly the two read permissions', () => {
    expect(problemsWith(real)).toEqual([]);
  });

  it('goes red when the verify step is removed', () => {
    const without = real
      .split('\n')
      .filter((line) => !line.includes(ACTION) && !line.includes('Verify locked @branchleft'))
      .join('\n');
    expect(problemsWith(without)).toContain('the verify action is used 0 times, not once');
  });

  it('goes red when the step is pinned to a tag instead of the commit SHA', () => {
    const tagged = real.replace(`@${PINNED_SHA} # ${PINNED_TAG}`, `@${PINNED_TAG}`);
    expect(problemsWith(tagged).join('\n')).toContain('is not pinned as');
  });

  it('goes red when the version comment is dropped', () => {
    const bare = real.replace(`@${PINNED_SHA} # ${PINNED_TAG}`, `@${PINNED_SHA}`);
    expect(problemsWith(bare).join('\n')).toContain('is not pinned as');
  });

  it('goes red when the job gains a write permission', () => {
    const widened = real.replace(
      `  ${JOB}:\n    name: Verify package attestations\n    runs-on: ubuntu-latest\n    # The run's own token reads the private registry (\`packages: read\`), as the\n    # install steps above do. Nothing here writes or needs a secret.\n    permissions:\n      contents: read\n      packages: read\n`,
      `  ${JOB}:\n    name: Verify package attestations\n    runs-on: ubuntu-latest\n    permissions:\n      contents: read\n      packages: write\n`
    );
    expect(widened).not.toEqual(real);
    expect(problemsWith(widened).join('\n')).toContain('permissions are');
  });

  it('goes red when the job inherits the workflow permissions instead of stating its own', () => {
    const inherited = real.replace(
      /(\n {2}verify-package-attestations:[\s\S]*?)\n {4}permissions:\n {6}contents: read\n {6}packages: read/,
      '$1'
    );
    expect(problemsWith(inherited)).toContain('the job has no permissions block of its own');
  });

  it('goes red when the scan root is narrowed or the job can be skipped', () => {
    const narrowed = real.replace(
      `@${PINNED_SHA} # ${PINNED_TAG}`,
      `@${PINNED_SHA} # ${PINNED_TAG}\n        with:\n          root: packages`
    );
    expect(problemsWith(narrowed).join('\n')).toContain('narrows the scan root');
    const skippable = real.replace(
      '    runs-on: ubuntu-latest\n    # The run',
      "    runs-on: ubuntu-latest\n    if: github.event_name == 'push'\n    # The run"
    );
    expect(problemsWith(skippable).join('\n')).toContain('can be skipped');
  });
});
