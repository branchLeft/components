// @vitest-environment node
// Plain Node, not the jsdom default: vite's esbuild breaks under jsdom's TextEncoder
// polyfill (see README.md).
import { describe, it, expect, beforeAll } from 'vitest';
import { buildStylesheet } from './testUtils/buildStylesheet';

/**
 * Returns EVERY rule body from the built (minified, single-line) stylesheet whose selector list is
 * EXACTLY this text, not just the first: an absence check must cover all rules sharing a selector.
 */

/**
 * Concatenating every matching body makes absence (`not.toMatch`) and presence (`.toMatch`) checks correct whichever
 * rule declares the property. Matches only an EXACT selector list: `p` doesn't match `p:last-child` or `.bl-form-error p`.
 */
function ruleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // A LOOKBEHIND for the boundary, not a consuming group: back-to-back rules for one selector (`…}p{…}p{…}`) share
  // ONE `}`, which a consuming `(?:^|[{};])` would swallow into the first match, leaving the second `p{` with no
  // boundary and silently skipped.
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
   * Declaration ABSENCE, not a computed-style number, proves a bare element defers to its ancestor: "16px" can't tell
   * inherited apart from a coincidentally equal own value. Re-adding `font-size` to a bare `p` must fail this.
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

  // This package owns line-height 1.6 explicitly on `p`/`li`/`ul`/`ol`/`dl`, so a
  // consumer's base styles need not restate it. `ul`/`ol` share their properties on the
  // combined `ul,ol` selector; only `list-style-type` is a separate per-element rule.
  it.each(['p', 'li', 'ul,ol', 'dl'])('`%s` sets line-height 1.6', (selector) => {
    const body = ruleBody(css, selector);
    expect(body).toMatch(/line-height\s*:\s*var\(--bl-leading-body\)/);
  });

  it('label keeps its owner-accepted font-weight 500, without font-size/color', () => {
    const body = ruleBody(css, 'label');
    expect(body).toMatch(/font-weight\s*:\s*500/);
  });
});
