// @vitest-environment node
//
// Runs `vite build()` (esbuild under the hood) to get the real built CSS —
// esbuild's native bridge relies on a `TextEncoder`/`Uint8Array` invariant
// that jsdom's polyfills break, so this file needs the plain Node
// environment rather than the package's jsdom default.
import { describe, it, expect, beforeAll } from 'vitest';
import { buildStylesheet } from './testUtils/buildStylesheet';

/**
 * Returns one CSS rule's declaration body (the text between its `{` and
 * matching `}`) from the built (minified, single-line) stylesheet, given
 * the exact selector text as it appears there (e.g. `p` for the bare-`p`
 * rule, `html,body` for the combined selector). Only matches a rule whose
 * selector list is EXACTLY this text, so `p` doesn't also match `p:last-
 * child` or `.bl-form-error p`.
 */
function ruleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|[{};])${escaped}\\{([^}]*)\\}`));
  if (!match) {
    throw new Error(`Rule not found in built CSS for selector: ${selector}`);
  }
  return match[1];
}

let css: string;

beforeAll(async () => {
  css = await buildStylesheet();
}, 30_000);

describe('branchleft.css inheritance (coordinator item 4)', () => {
  /**
   * Cycle-1 review found no test proved this — re-adding `font-size` to a
   * bare `p` would have left the whole suite green. Declaration ABSENCE,
   * not just a computed-style number, is what actually proves a bare
   * element defers to its ancestor: a computed value of "16px" can't tell
   * inherited-from-ancestor apart from coincidentally-equal-own-value.
   */
  it.each(['p', 'ul,ol', 'ul', 'ol', 'li', 'dl', 'table', 'label', 'blockquote'])(
    'bare `%s` sets neither font-size nor color',
    (selector) => {
      const body = ruleBody(css, selector);
      expect(body, `${selector} declarations`).not.toMatch(/font-size\s*:/);
      expect(body, `${selector} declarations`).not.toMatch(/(?<!background-)color\s*:/);
    }
  );

  it("html,body sets line-height 1.5 (Tailwind preflight's own default)", () => {
    const body = ruleBody(css, 'html,body');
    expect(body).toMatch(/line-height\s*:\s*1\.5(?!\d)/);
  });

  /**
   * The issue's own text says line-height belongs on html/body, and that
   * the site's `p`/`li` rule of 1.6 "stays where it is" — this package now
   * owns that 1.6 explicitly on `p`/`li` (and `ul`/`ol`/`dl`) instead, so
   * the website's own base.css no longer needs to restate it once it
   * adopts this stylesheet (see the PR body).
   */
  // `ul`/`ol` declare their shared properties (including line-height) on
  // the combined `ul,ol` selector in source — `list-style-type` is the
  // only property split into a separate, per-element rule.
  it.each(['p', 'li', 'ul,ol', 'dl'])('`%s` sets line-height 1.6', (selector) => {
    const body = ruleBody(css, selector);
    expect(body).toMatch(/line-height\s*:\s*var\(--bl-leading-body\)/);
  });

  it('label keeps its owner-accepted font-weight 500, without font-size/color', () => {
    const body = ruleBody(css, 'label');
    expect(body).toMatch(/font-weight\s*:\s*500/);
  });
});
