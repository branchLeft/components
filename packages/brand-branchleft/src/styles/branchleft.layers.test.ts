// @vitest-environment node
//
// Runs `vite build()` (esbuild under the hood) to get the real built CSS —
// esbuild's native bridge relies on a `TextEncoder`/`Uint8Array` invariant
// that jsdom's polyfills break, so this file needs the plain Node
// environment rather than the package's jsdom default.
import { describe, it, expect, beforeAll } from 'vitest';
import { buildStylesheet } from './testUtils/buildStylesheet';

/**
 * Finds a top-level `@layer <name> { ... }` block in the built (minified,
 * single-line) stylesheet and returns its body, using brace counting
 * rather than a single non-greedy regex — `elements.css` nests further
 * `{}` (rules, `@media`) inside each of these two blocks, which a naive
 * `\{([^}]*)\}` match would truncate at the first nested `}`.
 */
function namedLayerBody(css: string, name: string): string {
  const opener = `@layer ${name}{`;
  const start = css.indexOf(opener);
  if (start === -1) {
    throw new Error(`Named layer block not found in built CSS: ${opener}`);
  }
  let depth = 1;
  let i = start + opener.length;
  const bodyStart = i;
  for (; i < css.length && depth > 0; i++) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') depth -= 1;
  }
  if (depth !== 0) {
    throw new Error(`Unterminated @layer block: ${opener}`);
  }
  return css.slice(bodyStart, i - 1);
}

let css: string;

beforeAll(async () => {
  css = await buildStylesheet();
}, 30_000);

describe('branchleft.css cascade layers', () => {
  /**
   * A dotted name (`branchleft.base`) registers as a SUB-layer of one
   * parent layer, whose position among top-level siblings is fixed by the
   * PARENT's first appearance, not by where either child is listed — a
   * real Tailwind v4 build in a real browser found no achievable order
   * made a component class beat a same-priority site rule while a plain
   * element default still lost to it, with that naming.
   */

  /**
   * This is the single fact that made the whole design unfixable by
   * reordering — a check that dotted names are absent from every `@layer`
   * statement in the built CSS is what would have failed on that design,
   * and must keep failing if it's ever reintroduced.
   */
  it('never declares a dotted (sub-)layer name anywhere in the built CSS', () => {
    const layerStatements = css.match(/@layer\s+[^;{]+[;{]/g) ?? [];
    expect(layerStatements.length).toBeGreaterThan(0);
    for (const statement of layerStatements) {
      expect(statement, statement).not.toMatch(/[a-z0-9-]+\.[a-z0-9-]+/);
    }
  });

  it('declares branchleft-base before branchleft-components in an explicit layer-order statement', () => {
    // The unminified source's declaration is `@layer branchleft-base,
    // branchleft-components;` — assert on the order of the two names
    // rather than the exact separator/whitespace a minifier might change.
    expect(css).toMatch(/@layer\s+branchleft-base\s*,\s*branchleft-components\s*;/);
  });

  it('puts every class-based rule in branchleft-components, not branchleft-base', () => {
    const baseBody = namedLayerBody(css, 'branchleft-base');
    const componentsBody = namedLayerBody(css, 'branchleft-components');

    for (const selector of ['.bl-wordmark', '.bl-wordmark--hero', '.bl-form-error']) {
      expect(componentsBody, `${selector} in branchleft-components`).toContain(`${selector}{`);
      expect(baseBody, `${selector} absent from branchleft-base`).not.toContain(`${selector}{`);
    }
  });

  it('branchleft-base still holds the plain-element defaults (a sanity check the two blocks were not swapped)', () => {
    const baseBody = namedLayerBody(css, 'branchleft-base');
    expect(baseBody).toContain('html,body{');
  });
});
