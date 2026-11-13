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

// `danger` and `active` are real palette members shown alongside the ValuesColours, so both are
// checked against every other member too: the old dark danger colour was 0.004 OKLab from
// `--bl-color-active` under tritanopia.
const ALL_COLOUR_NAMES = [...VALUE_NAMES, 'danger', 'active'] as const;
type ColourName = (typeof ALL_COLOUR_NAMES)[number];

function propertyFor(name: ColourName): string {
  if (name === 'danger') return '--bl-color-danger';
  if (name === 'active') return '--bl-color-active';
  return `--bl-value-${name}`;
}

/**
 * OKLab floor after CVD simulation. Lower than the 0.05 in branchleft.distinguishability.test.ts: full-severity
 * CVD collapses the chroma the palette relies on. 0.02 is the bare JND: below it two colours can't be told apart.
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

    // The brand owner ruled a replacement for --bl-value-environment (#3fae5c -> #40b25e) after dark-mode environment
    // vs active fell below the 0.02 floor under deuteranopia (0.0174). Asserted on its own, beyond the generic sweep,
    // as a named regression check on that exact pairing.
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
