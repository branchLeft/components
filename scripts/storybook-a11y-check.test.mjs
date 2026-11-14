import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { resolveStaticPath, runPool } from './storybook-a11y-check.mjs';

// The check visits every entry x theme; the pool is what keeps that from
// being one page at a time.
describe('runPool', () => {
  it('never runs more than `limit` tasks at once, and does run `limit` at once', async () => {
    let active = 0;
    let peak = 0;
    await runPool(
      Array.from({ length: 10 }, (_, i) => i),
      3,
      async () => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
      }
    );
    expect(peak).toBe(3);
  });

  it('runs every item exactly once and returns the results in input order', async () => {
    const seen = [];
    const results = await runPool([5, 1, 3, 2], 2, async (n) => {
      await new Promise((resolve) => setTimeout(resolve, n));
      seen.push(n);
      return n * 10;
    });
    expect(results).toEqual([50, 10, 30, 20]);
    expect([...seen].sort()).toEqual([1, 2, 3, 5]);
  });

  it('rejects when a task throws, rather than swallowing it', async () => {
    await expect(
      runPool([1, 2], 2, async (n) => {
        if (n === 2) throw new Error('boom');
      })
    ).rejects.toThrow('boom');
  });

  it('treats a limit below 1 as 1', async () => {
    await expect(runPool([1, 2, 3], 0, async (n) => n)).resolves.toEqual([1, 2, 3]);
  });
});

// The static server this guards is a throwaway fixture for the a11y check,
// but it still serves real files over a real (loopback-only) HTTP port —
// the guard is what stands between a request URL and the filesystem.
describe('resolveStaticPath', () => {
  let root;

  beforeAll(() => {
    root = mkdtempSync(path.join(tmpdir(), 'storybook-a11y-check-test-'));
    writeFileSync(path.join(root, 'index.html'), '<html>fixture</html>');
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it.each([
    ['../ traversal', '/../secret.txt'],
    ['encoded ../ traversal', '/%2e%2e/secret.txt'],
    ['an absolute filesystem path', '/C:/Windows/win.ini'],
    ['a NUL byte', '/index.html\u0000.jpg'],
  ])('rejects %s', (_name, requestUrl) => {
    expect(resolveStaticPath(root, requestUrl)).toBeNull();
  });

  it('serves a normal file inside the root', async () => {
    const resolved = resolveStaticPath(root, '/index.html');
    expect(resolved).not.toBeNull();
    expect(resolved.startsWith(root)).toBe(true);
    await expect(readFile(resolved, 'utf8')).resolves.toBe('<html>fixture</html>');
  });
});
