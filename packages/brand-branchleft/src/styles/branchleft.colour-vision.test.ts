// @vitest-environment node
//
// Runs `vite build()` (esbuild under the hood) to get the real built CSS —
// esbuild's native bridge relies on a `TextEncoder`/`Uint8Array` invariant
// that jsdom's polyfills break, so this file needs the plain Node
// environment rather than the package's jsdom default.
import { describe, it, expect, beforeAll } from 'vitest';
import {
  buildStylesheet,
  extractCustomProperties,
  resolveColour,
  type CustomProperties,
} from './testUtils/buildStylesheet';
import { simulatedOklabDistance, type CvdKind } from './testUtils/cvdSimulation';

const VALUE_NAMES = [
  'sustainability',
  'environment',
  'ai',
  'society',
  'opensource',
  'agility',
  'redlines',
] as const;

// `danger` and `active` are real palette members that appear on screen
// alongside the ValuesColours, so both are checked against every other
// member here too — cycle-2 review found the old dark danger colour was
// only 0.004 OKLab from `--bl-color-active` under a tritanopia simulation,
// and nothing in this file caught it because `active` wasn't in the set
// being swept.
const ALL_COLOUR_NAMES = [...VALUE_NAMES, 'danger', 'active'] as const;
type ColourName = (typeof ALL_COLOUR_NAMES)[number];

function propertyFor(name: ColourName): string {
  if (name === 'danger') return '--bl-color-danger';
  if (name === 'active') return '--bl-color-active';
  return `--bl-value-${name}`;
}

/**
 * Floor for OKLab distance AFTER Machado et al. 2009 CVD simulation.
 * Deliberately lower than `branchleft.distinguishability.test.ts`'s 0.05:
 * that number already carries a ~2x margin over the bare "just noticeable
 * difference" estimate (~0.01-0.02) for ordinary vision. Full-severity CVD
 * simulation collapses real chroma information the palette relies on to
 * differ (hue becomes far less informative under dichromacy), so
 * requiring the same comfortable margin post-simulation would fail most
 * of the palette, not just the pairs that are genuinely hard to tell
 * apart. 0.02 is the bare JND itself: below it, two colours are not
 * reliably told apart even in principle; at or above it, a CVD viewer has
 * at least some signal to work with, even if less comfortable than an
 * ordinary-vision viewer's.
 */
const MIN_DISTANCE = 0.02;

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
const KINDS: readonly CvdKind[] = ['protanopia', 'deuteranopia', 'tritanopia'];

describe.each([
  ['dark', () => dark],
  ['light', () => light],
] as const)(
  'branchleft.css colour-vision-deficiency simulation — %s mode',
  (_modeName, getProps) => {
    describe.each(KINDS)('%s', (kind) => {
      it.each(PAIRS)('%s vs %s clears the CVD-simulated distinguishability floor', (a, b) => {
        const props = getProps();
        const distance = simulatedOklabDistance(
          resolveColour(props, propertyFor(a)),
          resolveColour(props, propertyFor(b)),
          kind
        );
        expect(distance).toBeGreaterThanOrEqual(MIN_DISTANCE);
      });
    });

    // Reported explicitly per the brief, regardless of pass/fail — see the
    // PR body's colour-vision table for the full set of numbers.
    it.each(KINDS)('society vs redlines distance is reported under %s simulation', (kind) => {
      const props = getProps();
      const distance = simulatedOklabDistance(
        resolveColour(props, '--bl-value-society'),
        resolveColour(props, '--bl-value-redlines'),
        kind
      );
      // Not a hard requirement beyond the generic pairwise check above —
      // this test exists to force the number to be computed and named in
      // test output, matching the PR body's table line for line.
      expect(distance).toBeGreaterThan(0);
    });

    it.each(KINDS)('sustainability vs agility distance is reported under %s simulation', (kind) => {
      const props = getProps();
      const distance = simulatedOklabDistance(
        resolveColour(props, '--bl-value-sustainability'),
        resolveColour(props, '--bl-value-agility'),
        kind
      );
      expect(distance).toBeGreaterThan(0);
    });

    // Cycle-3 review found dark-mode environment vs active clashed under
    // deuteranopia (0.0174 against the 0.02 floor) — the brand owner ruled
    // on a replacement for --bl-value-environment (workspace#1560 comment
    // 5876482719: #3fae5c -> #40b25e). Asserted on its own, in addition to
    // the generic sweep above, since this is the exact pairing that gap was
    // found in and it's worth a named regression check.
    it.each(KINDS)(
      'environment vs active clears the CVD-simulated floor under %s simulation',
      (kind) => {
        const props = getProps();
        const distance = simulatedOklabDistance(
          resolveColour(props, '--bl-value-environment'),
          resolveColour(props, '--bl-color-active'),
          kind
        );
        expect(distance).toBeGreaterThanOrEqual(MIN_DISTANCE);
      }
    );
  }
);
