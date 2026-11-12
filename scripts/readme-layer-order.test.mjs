// Reads the README text and asserts the cascade-layer order it recommends is consistent: the
// DOCUMENT a consumer copies, not the built CSS (`branchleft.layers.test.ts`'s job). A broken
// order (e.g. `branchleft-components` before `base`) would pass every other test.
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const README_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'README.md');

/**
 * Extracts the layer names, in order, from the README's recommended `@layer theme, branchleft-base, base, ...;`
 * statement (in a css fence): the one line this section builds to, not the bare Tailwind or two-layer variants.
 */
function readRecommendedOrder() {
  const readme = fs.readFileSync(README_PATH, 'utf8');
  // Tailwind's bare `@layer theme, base, components, utilities;` also starts with "@layer theme,", so filter by name
  // membership: a reordering sabotage then fails on the ORDER assertions below, not on "statement not found".
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
