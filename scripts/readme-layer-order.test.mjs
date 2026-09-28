// Reads the actual README text and asserts the cascade-layer order it
// recommends is internally consistent — not the built CSS (that's
// `branchleft.layers.test.ts`'s job), the DOCUMENT a consumer copies.
//
// Cycle-2 review found the CI suite couldn't tell a correct recommended
// order from a broken one, because nothing ever read the README: a broken
// order (e.g. `branchleft-components` moved before `base`) would still
// pass every other test, since `branchleft.layers.test.ts` only checks
// this package's OWN built CSS, not the multi-layer statement the README
// tells a Tailwind consumer to write. This closes that gap directly.
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const README_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'README.md');

/**
 * Extracts the layer names, in order, from the README's recommended
 * `@layer theme, branchleft-base, base, branchleft-components, components,
 * utilities;` statement (inside a ```css fenced block) — the ONE line
 * this whole section is building up to, not any other `@layer` mention in
 * the surrounding prose (which also shows Tailwind's own bare
 * `@layer theme, base, components, utilities;` expansion, and the
 * two-layer `@layer branchleft-base, branchleft-components;` this
 * package's own stylesheet declares).
 */
function readRecommendedOrder() {
  const readme = fs.readFileSync(README_PATH, 'utf8');
  // Tailwind's own bare `@layer theme, base, components, utilities;` also
  // starts with "@layer theme," — filtering by name membership (not just
  // matching the start of the line) is what keeps this test finding the
  // ACTUAL recommended statement regardless of where either name sits in
  // it, so a reordering sabotage fails on the ORDER assertions below,
  // not on "statement not found".
  const candidates = readme.match(/@layer\s+theme,[^;]*;/g) ?? [];
  const statement = candidates.find(
    (line) => line.includes('branchleft-base') && line.includes('branchleft-components')
  );
  if (!statement) {
    throw new Error("Could not find the README's recommended @layer statement");
  }
  return statement
    .replace(/^@layer\s+/, '')
    .replace(/;$/, '')
    .split(',')
    .map((name) => name.trim());
}

describe('README recommended @layer order', () => {
  it('lists branchleft-base before base, and base before branchleft-components', () => {
    const order = readRecommendedOrder();
    const baseIndex = order.indexOf('branchleft-base');
    const siteBaseIndex = order.indexOf('base');
    const componentsIndex = order.indexOf('branchleft-components');

    expect(baseIndex, `branchleft-base found in: ${order.join(', ')}`).toBeGreaterThanOrEqual(0);
    expect(siteBaseIndex, `base found in: ${order.join(', ')}`).toBeGreaterThanOrEqual(0);
    expect(
      componentsIndex,
      `branchleft-components found in: ${order.join(', ')}`
    ).toBeGreaterThanOrEqual(0);

    expect(baseIndex, 'branchleft-base before base').toBeLessThan(siteBaseIndex);
    expect(siteBaseIndex, 'base before branchleft-components').toBeLessThan(componentsIndex);
  });

  it("also lists branchleft-components before utilities (the site's utility classes must still win)", () => {
    const order = readRecommendedOrder();
    const componentsIndex = order.indexOf('branchleft-components');
    const utilitiesIndex = order.indexOf('utilities');

    expect(utilitiesIndex, `utilities found in: ${order.join(', ')}`).toBeGreaterThanOrEqual(0);
    expect(componentsIndex).toBeLessThan(utilitiesIndex);
  });
});
