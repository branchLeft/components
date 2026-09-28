// @vitest-environment node
//
// Needs the plain Node environment for the same reason as the asset-size
// test: `buildStylesheet` runs esbuild, which jsdom's polyfills break.
import { describe, it, expect } from 'vitest';
import { buildStylesheet } from './testUtils/buildStylesheet';

// The website's live wordmark (`.logo-font`, `.hero-wordmark`) is the
// source these values must match; a change here changes the brand mark.
const EXPECTED = {
  '--bl-weight-wordmark': '500',
  '--bl-text-wordmark-hero': '3.75rem',
  '--bl-leading-wordmark-hero': '1',
};

function declaredValue(css: string, property: string): string | undefined {
  const match = css.match(new RegExp(`${property}\\s*:\\s*([^;}]+)`));
  return match?.[1].trim();
}

function ruleBody(css: string, selector: string): string | undefined {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1];
}

describe('branchleft.css wordmark', () => {
  it('declares the wordmark weight and hero size', async () => {
    const css = await buildStylesheet();
    for (const [property, value] of Object.entries(EXPECTED)) {
      expect(declaredValue(css, property), property).toBe(value);
    }
  }, 30_000);

  it('sets Syne at the wordmark weight on .bl-wordmark', async () => {
    const body = ruleBody(await buildStylesheet(), '.bl-wordmark');
    expect(body).toMatch(/font-family\s*:\s*var\(--bl-font-wordmark\)/);
    expect(body).toMatch(/font-weight\s*:\s*var\(--bl-weight-wordmark\)/);
  }, 30_000);

  it('sizes .bl-wordmark--hero from the hero tokens', async () => {
    const body = ruleBody(await buildStylesheet(), '.bl-wordmark--hero');
    expect(body).toMatch(/font-size\s*:\s*var\(--bl-text-wordmark-hero\)/);
    expect(body).toMatch(/line-height\s*:\s*var\(--bl-leading-wordmark-hero\)/);
  }, 30_000);
});
