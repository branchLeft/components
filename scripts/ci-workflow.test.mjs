// Reads the real .github/workflows/ci.yml and asserts the Playwright steps
// stay resilient to a runner-network fault on apt: the browser cache is
// SHA-pinned and keyed on the locked version, and the system-dependency and
// browser installs each carry a step timeout and a bounded retry. This reads
// the file text (no YAML parser), so it checks the shape the steps are written
// in, not that GitHub runs them.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ci = readFileSync(path.resolve(here, '..', '.github', 'workflows', 'ci.yml'), 'utf8');

// The body of one named step: from its `- name:` line to the next step (a
// line at the same `- ` indent) or the next job or top-level key.
function stepBlock(name) {
  const lines = ci.split('\n');
  const start = lines.findIndex((line) => line.trim() === `- name: ${name}`);
  if (start === -1) throw new Error(`no step named "${name}" in ci.yml`);
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (/^ {6}- /.test(line) || /^ {0,4}\S/.test(line)) break;
    body.push(line);
  }
  return body.join('\n');
}

// The shell lines of one named step: the lines under its `run: |`, trimmed and
// with blank lines dropped.
function runScript(name) {
  const lines = stepBlock(name).split('\n');
  const at = lines.findIndex((line) => line.trim() === 'run: |');
  if (at === -1) throw new Error(`step "${name}" has no run: | script`);
  return lines
    .slice(at + 1)
    .map((line) => line.trim())
    .filter((line) => line !== '');
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

describe('ci.yml Playwright steps', () => {
  it('pins every uses: line to a 40-character commit SHA', () => {
    const refs = [...ci.matchAll(/^\s*(?:- )?uses:\s*(\S+)/gm)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(ref).toMatch(/@[0-9a-f]{40}$/);
    }
  });

  it('caches the Playwright browsers with a SHA-pinned actions/cache keyed on the locked version', () => {
    const block = stepBlock('Cache Playwright browsers');
    expect(block).toMatch(/uses: actions\/cache@[0-9a-f]{40} # v\d+\.\d+\.\d+/);
    expect(block).toContain('path: ~/.cache/ms-playwright');
    expect(block).toContain(
      'key: playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}'
    );
  });

  it('gives the system-dependency install a step timeout and a bounded retry', () => {
    const block = stepBlock('Install Playwright system dependencies');
    expect(block).toMatch(/timeout-minutes: \d+/);
    expect(block).toMatch(/for attempt in 1 2 3; do/);
    expect(block).toContain('npx playwright install-deps chromium');
    expect(block).toMatch(/sleep \$\(\(attempt \* \d+\)\)/);
  });

  it('gives the browser download a step timeout and a bounded retry, separate from apt', () => {
    const block = stepBlock('Install Playwright Chromium');
    expect(block).toMatch(/timeout-minutes: \d+/);
    expect(block).toMatch(/for attempt in 1 2 3; do/);
    expect(block).toContain('npx playwright install chromium');
    expect(block).not.toContain('--with-deps');
    expect(block).not.toContain('install-deps');
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

// The Playwright steps are bounded so that a hang in both still fits inside the
// job's own timeout. REST_OF_JOB_MAX_MINUTES is the measured ceiling for every
// other step (3.6 minutes over the 12 runs since the accessibility check went
// parallel), rounded up.
const REST_OF_JOB_MAX_MINUTES = 4;
const PLAYWRIGHT_STEPS = ['Install Playwright system dependencies', 'Install Playwright Chromium'];

// The `ci` job's timeout: the 4-space `timeout-minutes` between `  ci:` and
// its `    steps:`.
function jobTimeoutMinutes() {
  const lines = ci.split('\n');
  const start = lines.findIndex((line) => line === '  ci:');
  const steps = lines.findIndex((line, i) => i > start && line === '    steps:');
  if (start === -1 || steps === -1) throw new Error('no ci job in ci.yml');
  const hit = lines
    .slice(start, steps)
    .map((line) => /^ {4}timeout-minutes: (\d+)$/.exec(line))
    .find((m) => m !== null);
  if (!hit) throw new Error('the ci job has no timeout-minutes');
  return Number(hit[1]);
}

function stepTimeoutMinutes(name) {
  const hit = /^ {8}timeout-minutes: (\d+)$/m.exec(stepBlock(name));
  if (!hit) throw new Error(`step "${name}" has no timeout-minutes`);
  return Number(hit[1]);
}

describe('ci.yml job timeout', () => {
  it('holds the 10-minute job timeout', () => {
    expect(jobTimeoutMinutes()).toBe(10);
  });

  it('fits both Playwright step bounds plus the rest of the job', () => {
    const bounds = PLAYWRIGHT_STEPS.map(stepTimeoutMinutes);
    const total = bounds.reduce((a, b) => a + b, 0) + REST_OF_JOB_MAX_MINUTES;
    expect(jobTimeoutMinutes()).toBeGreaterThanOrEqual(total);
  });

  it.each(PLAYWRIGHT_STEPS)('%s: three attempts and their sleeps fit the step bound', (name) => {
    const script = runScript(name).join('\n');
    const attempt = /timeout (\d+) npx playwright/.exec(script);
    const sleep = /sleep \$\(\(attempt \* (\d+)\)\)/.exec(script);
    expect(attempt).not.toBeNull();
    expect(sleep).not.toBeNull();
    // Attempts 1 and 2 sleep before the next; attempt 3 does not.
    const worstSeconds = 3 * Number(attempt?.[1]) + Number(sleep?.[1]) * (1 + 2);
    expect(worstSeconds).toBeLessThanOrEqual(stepTimeoutMinutes(name) * 60);
  });
});
