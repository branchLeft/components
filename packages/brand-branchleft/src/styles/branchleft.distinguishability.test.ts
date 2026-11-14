// @vitest-environment node
// Plain Node, not the jsdom default: vite's esbuild breaks under jsdom's TextEncoder
// polyfill (see README.md).
import { describe, it, expect, beforeAll } from 'vitest';
import {
  buildStylesheet,
  extractCustomProperties,
  resolveColour,
  type CustomProperties,
} from './testUtils/buildStylesheet';
import { oklabDistance } from './testUtils/colourMath';

const VALUE_NAMES = [
  'sustainability',
  'environment',
  'ai',
  'society',
  'opensource',
  'agility',
  'redlines',
] as const;

// `danger` and `active` render alongside the ValuesColours (a form error next to a
// badge; a link next to one), so the pairwise sweep covers them too: every member is
// checked against every other, not just against the 7 ValuesColours.
const ALL_COLOUR_NAMES = [...VALUE_NAMES, 'danger', 'active'] as const;
type ColourName = (typeof ALL_COLOUR_NAMES)[number];

function propertyFor(name: ColourName): string {
  if (name === 'danger') return '--bl-color-danger';
  if (name === 'active') return '--bl-color-active';
  return `--bl-value-${name}`;
}

/**
 * OKLab floor for telling colours apart at a glance, ordinary vision only (CVD: branchleft.colour-vision.test.ts).
 * No canonical JND exists: the bare estimate is ~0.01-0.02, and 0.05 leaves margin for small swatches and displays.
 */
const MIN_DISTANCE = 0.05;

let dark: CustomProperties;
let light: CustomProperties;

beforeAll(async () => {
  const css = await buildStylesheet();
  const darkOnly = extractCustomProperties(css, ':root{');
  const lightOnly = extractCustomProperties(css, ':root[data-theme=light]{');
  dark = darkOnly;
  light = new Map([...darkOnly, ...lightOnly]);
}, 30_000);

function allPairs<T>(items: readonly T[]): ReadonlyArray<readonly [T, T]> {
  const pairs: Array<readonly [T, T]> = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push([items[i], items[j]]);
    }
  }
  return pairs;
}

const PAIRS = allPairs(ALL_COLOUR_NAMES);

describe.each([
  ['dark', () => dark],
  ['light', () => light],
] as const)('branchleft.css colour distinguishability — %s mode', (_modeName, getProps) => {
  it.each(PAIRS)('%s vs %s clears the distinguishability floor', (a, b) => {
    const props = getProps();
    const distance = oklabDistance(
      resolveColour(props, propertyFor(a)),
      resolveColour(props, propertyFor(b))
    );
    expect(distance).toBeGreaterThanOrEqual(MIN_DISTANCE);
  });

  // Society and redlines are the two reds in the palette, so the closest ValuesColours pair by this metric in both
  // modes; asserted on its own though the pairwise loop above already covers it.
  it('society vs redlines — the pair Rob asked to have flagged — still clears the floor', () => {
    const props = getProps();
    const distance = oklabDistance(
      resolveColour(props, '--bl-value-society'),
      resolveColour(props, '--bl-value-redlines')
    );
    expect(distance).toBeGreaterThanOrEqual(MIN_DISTANCE);
  });
});
