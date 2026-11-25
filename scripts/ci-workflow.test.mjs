// Reads the real setup composite, .github/actions/setup-pnpm-node/action.yml, and
// the workflows that call it. It asserts that the Playwright steps stay
// resilient to a runner-network fault on apt: the browser cache is SHA-pinned
// and keyed on the locked version, and the system-dependency and browser
// installs each carry a bounded retry that fails closed. The ci job turns them
// on; the deploy and publish jobs do not. This reads the file text (no YAML
// parser), so it checks the shape the steps are written in, not that GitHub
// runs them.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (...parts) => readFileSync(path.resolve(here, '..', ...parts), 'utf8');
const action = read('.github', 'actions', 'setup-pnpm-node', 'action.yml');
const ci = read('.github', 'workflows', 'ci.yml');
const publish = read('.github', 'workflows', 'publish.yml');

const COMPOSITE = './.github/actions/setup-pnpm-node';

// The body of one named step in the composite: from its four-space `- name:`
// line to the next step.
function actionStep(name) {
  const lines = action.split('\n');
  const start = lines.findIndex((line) => line === `    - name: ${name}`);
  if (start === -1) throw new Error(`no step named "${name}" in the composite`);
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (/^ {4}- name: /.test(line) || /^\S/.test(line)) break;
    body.push(line);
  }
  return body.join('\n');
}

// The shell lines of one composite step: under its `run: |`, trimmed, blank
// lines dropped.
function runScript(name) {
  const lines = actionStep(name).split('\n');
  const at = lines.findIndex((line) => line.trim() === 'run: |');
  if (at === -1) throw new Error(`step "${name}" has no run: | script`);
  return lines
    .slice(at + 1)
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

// The body of one named step in a workflow job: from its six-space `- name:`
// line to the next step.
function workflowStep(source, name) {
  const lines = source.split('\n');
  const start = lines.findIndex((line) => line.trim() === `- name: ${name}`);
  if (start === -1) throw new Error(`no step named "${name}"`);
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (/^ {6}- /.test(line) || /^ {0,4}\S/.test(line)) break;
    body.push(line);
  }
  return body.join('\n');
}

// A retry loop fails closed when, after its final `done`, only the `::error::`
// echo and `exit 1` remain; its one `exit 0` is the success exit inside the `if`
// that wraps the install; and it has no other exit.
function expectRetryFailsClosed(name, installCommand, errorText) {
  const script = runScript(name);
  const loopOpen = script.indexOf('for attempt in 1 2 3; do');
  const loopDone = script.indexOf('done');
  expect(loopOpen).toBeGreaterThanOrEqual(0);
  expect(loopDone).toBeGreaterThan(loopOpen);

  expect(script.slice(loopDone + 1)).toEqual([`echo "::error::${errorText}"`, 'exit 1']);

  const exits = script.filter((line) => /^exit\b/.test(line));
  expect(exits).toEqual(['exit 0', 'exit 1']);

  const successExit = script.indexOf('exit 0');
  expect(successExit).toBeGreaterThan(loopOpen);
  expect(successExit).toBeLessThan(loopDone);
  expect(script[successExit - 1]).toBe(`if timeout 50 ${installCommand}; then`);
}

describe('setup composite Playwright steps', () => {
  it('pins every uses: line in the composite and the workflows to a 40-character commit SHA', () => {
    for (const source of [action, ci, publish]) {
      const refs = [...source.matchAll(/^\s*(?:- )?uses:\s*(\S+)/gm)]
        .map((m) => m[1])
        .filter((ref) => !ref.startsWith('./'));
      expect(refs.length).toBeGreaterThan(0);
      for (const ref of refs) {
        expect(ref).toMatch(/@[0-9a-f]{40}$/);
      }
    }
  });

  it('caches the Playwright browsers with a SHA-pinned actions/cache keyed on the locked version', () => {
    const block = actionStep('Cache Playwright browsers');
    expect(block).toMatch(/uses: actions\/cache@[0-9a-f]{40} # v\d+\.\d+\.\d+/);
    expect(block).toContain('path: ~/.cache/ms-playwright');
    expect(block).toContain(
      'key: playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}'
    );
    expect(block).not.toContain('restore-keys');
  });

  it('gives the system-dependency install and the browser install a bounded retry, separate from apt', () => {
    const deps = actionStep('Install Playwright system dependencies');
    const browsers = actionStep('Install Playwright Chromium');
    expect(deps).toMatch(/for attempt in 1 2 3; do/);
    expect(deps).toContain('npx playwright install-deps chromium');
    expect(deps).toMatch(/sleep \$\(\(attempt \* \d+\)\)/);
    expect(browsers).toMatch(/for attempt in 1 2 3; do/);
    expect(browsers).toContain('npx playwright install chromium');
    expect(browsers).not.toContain('--with-deps');
    expect(browsers).not.toContain('install-deps');
  });

  it('gates every Playwright step on the playwright input', () => {
    for (const name of [
      'Get Playwright version',
      'Cache Playwright browsers',
      'Install Playwright system dependencies',
      'Install Playwright Chromium',
    ]) {
      expect(actionStep(name)).toContain("if: inputs.playwright == 'true'");
    }
  });

  it('system-dependency retry fails closed: its last failed attempt prints ::error:: and exits 1', () => {
    expectRetryFailsClosed(
      'Install Playwright system dependencies',
      'npx playwright install-deps chromium',
      'install-deps failed after 3 attempts'
    );
  });

  it('browser retry fails closed: its last failed attempt prints ::error:: and exits 1', () => {
    expectRetryFailsClosed(
      'Install Playwright Chromium',
      'npx playwright install chromium',
      'browser install failed after 3 attempts'
    );
  });
});

describe('workflows call the setup composite', () => {
  it('the ci job installs with Playwright on', () => {
    const block = workflowStep(ci, 'Setup pnpm, Node and dependencies');
    expect(block).toContain(`uses: ${COMPOSITE}`);
    expect(block).toContain("playwright: 'true'");
    expect(block).toContain('node-auth-token: ${{ secrets.GITHUB_TOKEN }}');
  });

  it('the publish job installs with Playwright off', () => {
    const block = workflowStep(publish, 'Setup pnpm, Node and dependencies');
    expect(block).toContain(`uses: ${COMPOSITE}`);
    expect(block).not.toContain('playwright:');
  });

  it('no workflow still carries an inline Playwright install', () => {
    expect(ci).not.toContain('npx playwright');
    expect(ci).not.toContain('Install Playwright');
    expect(publish).not.toContain('playwright install');
  });
});

describe('ci.yml job timeout', () => {
  // The `ci` job's timeout: the 4-space `timeout-minutes` between `  ci:` and
  // its `    steps:`. Playwright's bound is the job timeout now, since a
  // composite step takes no timeout-minutes.
  it('holds the 10-minute job timeout', () => {
    const lines = ci.split('\n');
    const start = lines.findIndex((line) => line === '  ci:');
    const steps = lines.findIndex((line, i) => i > start && line === '    steps:');
    const hit = lines
      .slice(start, steps)
      .map((line) => /^ {4}timeout-minutes: (\d+)$/.exec(line))
      .find((m) => m !== null);
    expect(hit).toBeDefined();
    expect(Number(hit[1])).toBe(10);
  });
});
