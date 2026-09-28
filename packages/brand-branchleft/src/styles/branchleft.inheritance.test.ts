// @vitest-environment node
//
// Runs `vite build()` (esbuild under the hood) to get the real built CSS —
// esbuild's native bridge relies on a `TextEncoder`/`Uint8Array` invariant
// that jsdom's polyfills break, so this file needs the plain Node
// environment rather than the package's jsdom default.
import { describe, it, expect, beforeAll } from 'vitest';
import { buildStylesheet } from './testUtils/buildStylesheet';

/**
 * Returns EVERY CSS rule's declaration body from the built (minified,
 * single-line) stylesheet whose selector list is EXACTLY this text (e.g.
 * `p`, `html,body`) — not just the first. A single-match version of this
 * stayed green when review added a SECOND `p { color: … }` rule
 * elsewhere: the cascade doesn't care how many rules share a selector, so
 * an absence check must cover all of them, not only the first found.
 */

/**
 * Concatenating every matching body makes both an absence check (`not
 * .toMatch`) and a presence check (`.toMatch`) correct regardless of which
 * rule declares the property. Matches only an EXACT selector list, so `p`
 * doesn't also match `p:last-child` or `.bl-form-error p`.
 */
function ruleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // A LOOKBEHIND for the boundary, not a consuming group: two rules for
  // the same selector placed back to back in the built CSS (`…}p{…}p{…}`)
  // share ONE `}` between them. A consuming `(?:^|[{};])` swallows that
  // shared `}` into the FIRST match, so `matchAll`'s next scan starts
  // right after it with no boundary character left for the SECOND `p{` to
  // match against — it's silently skipped. A lookbehind only asserts the
  // boundary is there without consuming it, so both matches see it.
  const re = new RegExp(`(?<=^|[{};])${escaped}\\{([^}]*)\\}`, 'g');
  const bodies: string[] = [];
  for (const match of css.matchAll(re)) {
    bodies.push(match[1]);
  }
  if (bodies.length === 0) {
    throw new Error(`Rule not found in built CSS for selector: ${selector}`);
  }
  return bodies.join(';');
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
