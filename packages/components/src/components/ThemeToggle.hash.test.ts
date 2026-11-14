/// <reference types="node" />
// This package's tsconfig omits Node's ambient types (browser bundle): this directive
// scopes the one Node-only import (`node:crypto`) to this dev-time file.
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { themeInitScript, themeInitScriptHash } from './ThemeToggle';

/**
 * `themeInitScriptHash` is a literal so shipped browser code never needs node:crypto; this recomputes the SHA-256
 * of `themeInitScript` and fails when it goes stale. After a deliberate change, paste the received value.
 */
describe('themeInitScriptHash', () => {
  it('matches a fresh SHA-256 hash of the current themeInitScript', () => {
    const digest = createHash('sha256').update(themeInitScript, 'utf8').digest('base64');
    expect(themeInitScriptHash).toBe(`sha256-${digest}`);
  });

  it('is in the exact form a CSP script-src directive expects', () => {
    expect(themeInitScriptHash).toMatch(/^sha256-[A-Za-z0-9+/]+=*$/);
  });
});
