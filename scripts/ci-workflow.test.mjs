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
});
