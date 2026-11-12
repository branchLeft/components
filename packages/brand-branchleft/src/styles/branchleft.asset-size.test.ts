// @vitest-environment node
//
// Runs `vite build()` (esbuild under the hood) to get the real built CSS —
// esbuild's native bridge relies on a `TextEncoder`/`Uint8Array` invariant
// that jsdom's polyfills break, so this file needs the plain Node
// environment rather than the package's jsdom default.
import { describe, it, expect } from 'vitest';
import { buildStylesheet } from './testUtils/buildStylesheet';

/**
 * Vite's library mode base64-inlines every font a CSS url() references, which
 * once made the built CSS 339 kB. This fails on a font data URI, or on the CSS
 * growing even under a different data scheme. 20 KB leaves room for element
 * coverage but not for a font.
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
