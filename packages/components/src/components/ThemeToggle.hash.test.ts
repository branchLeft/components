/// <reference types="node" />
// This package's tsconfig deliberately omits Node's ambient types from its
// `types` array (it's a browser-targeted bundle) — this directive scopes
// the one Node-only import below (`node:crypto`, fine here: this file
// never ships, it's a dev-time test) to just this file rather than adding
// Node's globals to the whole program.
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { themeInitScript, themeInitScriptHash } from './ThemeToggle';

/**
 * `themeInitScriptHash` is a literal so the shipped browser code never needs
 * node:crypto. This test recomputes the SHA-256 of `themeInitScript` and fails
 * when the literal goes stale. After a deliberate change, paste the failure's
 * "Received" value into that constant in ThemeToggle.tsx.
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
