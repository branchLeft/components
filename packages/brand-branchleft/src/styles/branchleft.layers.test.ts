// @vitest-environment node
// Plain Node, not the jsdom default: vite's esbuild breaks under jsdom's TextEncoder
// polyfill (see README.md).
import { describe, it, expect, beforeAll } from 'vitest';
import { buildStylesheet } from './testUtils/buildStylesheet';

/**
 * Finds a top-level `@layer <name> { ... }` block in the built single-line CSS and returns its body by
 * brace counting: a non-greedy `\{([^}]*)\}` regex would stop at the first nested `}` (rules, `@media`).
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
   * A dotted layer name (`branchleft.base`) is a SUB-layer positioned by its PARENT's
   * first appearance, so no order satisfies both cascade needs (see README.md).
   */

  /**
   * The single fact that made the old design unfixable by reordering: this check that no dotted name appears in
   * any `@layer` statement must keep failing if that design is ever reintroduced.
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
