// @vitest-environment node
//
// Runs `vite build()` (esbuild under the hood) to get the real built CSS —
// esbuild's native bridge relies on a `TextEncoder`/`Uint8Array` invariant
// that jsdom's polyfills break, so this file needs the plain Node
// environment rather than the package's jsdom default.
import { describe, it, expect } from 'vitest';
import { buildStylesheet } from './testUtils/buildStylesheet';

/**
 * Cycle-1 review found `dist/branchleft.css` was 338.95 kB because Vite's
 * library mode unconditionally base64-inlines every asset a CSS `url()`
 * references (documented Vite behaviour, not a bug — see vite.config.ts's
 * `extractFontsPlugin` comment) — every one of the four font families
 * ended up baked directly into the CSS text. This test fails if that ever
 * regresses: either literally (a `data:font`/`data:application/font*` URI
 * reappears) or effectively (the CSS balloons back up in size even under a
 * differently-named data URI scheme this exact string match would miss).
 *
 * 20 KB is a generous ceiling for hand-written tokens + element defaults
 * with no fonts embedded — the real built size today is under 10 KB (see
 * the PR body for the exact figure); 20 KB leaves headroom for future
 * element coverage without being so loose a regression could sneak most
 * of a single font back in unnoticed.
 */
const MAX_CSS_BYTES = 20 * 1024;

describe('branchleft.css does not embed font data', () => {
  it('contains no base64 font data URI', async () => {
    const css = await buildStylesheet();
    expect(css).not.toMatch(/data:font\//);
    expect(css).not.toMatch(/data:application\/font/);
  }, 30_000);

  it(`stays under ${MAX_CSS_BYTES} bytes`, async () => {
    const css = await buildStylesheet();
    const byteLength = Buffer.byteLength(css, 'utf8');
    expect(byteLength).toBeLessThan(MAX_CSS_BYTES);
  }, 30_000);
});
