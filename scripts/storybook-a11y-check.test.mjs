import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { resolveStaticPath } from './storybook-a11y-check.mjs';

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
