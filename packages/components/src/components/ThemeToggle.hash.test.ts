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
 * `themeInitScriptHash` is a literal constant (see its own doc comment in
 * ThemeToggle.tsx for why: it must never depend on `node:crypto` at
 * runtime, since this package ships to browsers). This test is what keeps
 * that literal honest — it recomputes the real SHA-256 hash of
 * `themeInitScript`'s current content and fails if it no longer matches
 * the committed constant, which is exactly what happens the moment
 * `themeInitScript` changes without someone updating the constant by hand.
 *
 * To regenerate after a deliberate change to `themeInitScript`: run this
 * test, read the failure's "Received" value (already in the
 * `'sha256-<base64>'` form `themeInitScriptHash` expects), and paste it
 * into that constant's declaration in ThemeToggle.tsx.
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
