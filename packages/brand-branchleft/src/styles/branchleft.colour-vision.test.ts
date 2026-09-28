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

/**
 * Newly found (cycle 3, with the corrected deuteranopia matrix and the
 * brand owner's cycle-3 colours) — NOT the cycle-2 gap, which the corrected
 * matrix and the new `agility`/`danger` values actually fix (verified: both
 * `sustainability vs agility` and the old `agility vs danger` clash now
 * clear the floor in every simulation/mode).
 *
 * Dark mode, deuteranopia, `environment` (`#3fae5c`) vs `--bl-color-active`
 * (`#ff006e`): 0.0174, below the 0.02 floor. Both simulate to a similar
 * olive/tan under deuteranopia (verified by simulating each and comparing
 * the resulting sRGB) — a real clash between a ValuesColour and the link/
 * focus-ring colour, in dark mode, the brand default. Per this cycle's
 * brief: reported, not fixed by picking a colour here — that decision
 * belongs to the brand owner, who has ruled on `--bl-color-active` and
 * `--bl-value-environment` in the past but not on this specific pairing.
 * Marked via `it.fails` (excluded from the generic sweep below) so it
 * stays visible rather than silently passing or silently excluded.
 */
const KNOWN_GAP = {
  mode: 'dark',
  kind: 'deuteranopia',
  a: 'environment',
  b: 'active',
} as const;

function isKnownGapPair(
  mode: 'dark' | 'light',
  kind: CvdKind,
  a: ColourName,
  b: ColourName
): boolean {
  return (
    KNOWN_GAP.mode === mode &&
    KNOWN_GAP.kind === kind &&
    ((KNOWN_GAP.a === a && KNOWN_GAP.b === b) || (KNOWN_GAP.a === b && KNOWN_GAP.b === a))
  );
}

const PAIRS = allPairs(ALL_COLOUR_NAMES);
const KINDS: readonly CvdKind[] = ['protanopia', 'deuteranopia', 'tritanopia'];

describe.each([
  ['dark', () => dark],
  ['light', () => light],
] as const)(
  'branchleft.css colour-vision-deficiency simulation — %s mode',
  (modeName, getProps) => {
    describe.each(KINDS)('%s', (kind) => {
      const pairs = PAIRS.filter(([a, b]) => !isKnownGapPair(modeName, kind, a, b));

      it.each(pairs)('%s vs %s clears the CVD-simulated distinguishability floor', (a, b) => {
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
  }
);

// The one known, reported (not silently fixed) gap — see KNOWN_GAP's
// comment above. Registered once, standalone (not inside the mode/kind
// loop above, since it applies to exactly one mode+kind combination): a
// no-op body for the modes/kinds it doesn't apply to would make
// `it.fails` itself report a false failure, because `it.fails` requires
// the wrapped assertion to actually throw. `it.fails` going green here
// means the underlying assertion is failing as expected; it turning red
// is the signal that the gap has closed and this entry should be removed.
it.fails(
  `${KNOWN_GAP.a} vs ${KNOWN_GAP.b} does NOT clear the CVD-simulated floor under ${KNOWN_GAP.kind} in ${KNOWN_GAP.mode} mode (known gap, reported not fixed)`,
  async () => {
    const css = await buildStylesheet();
    const darkOnly = extractCustomProperties(css, ':root{');
    const props = darkOnly; // KNOWN_GAP.mode === 'dark'

    const distance = simulatedOklabDistance(
      resolveColour(props, propertyFor(KNOWN_GAP.a)),
      resolveColour(props, propertyFor(KNOWN_GAP.b)),
      KNOWN_GAP.kind
    );
    expect(distance).toBeGreaterThanOrEqual(MIN_DISTANCE);
  }
);
