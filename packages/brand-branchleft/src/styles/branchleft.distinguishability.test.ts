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

// `danger` and `active` are both real, rendered colours that appear
// alongside the ValuesColours on screen (a form error next to a
// ValuesColour badge; a link next to one) — cycle-2 review's own
// undetected gap (the old dark danger colour was 0.004 from active under
// a tritanopia simulation) is exactly what omitting them from this
// pairwise sweep let through. Every member is now checked against every
// other member, not just against the 7 ValuesColours.
const ALL_COLOUR_NAMES = [...VALUE_NAMES, 'danger', 'active'] as const;
type ColourName = (typeof ALL_COLOUR_NAMES)[number];

function propertyFor(name: ColourName): string {
  if (name === 'danger') return '--bl-color-danger';
  if (name === 'active') return '--bl-color-active';
  return `--bl-value-${name}`;
}

/**
 * OKLab distance floor for "reliably tells two colours apart at a glance
 * under ordinary (non colour-vision-deficient) vision". There's no single
 * canonical "just noticeable difference" constant for OKLab the way WCAG
 * gives one for contrast, so this is a judgement call, not a cited
 * standard: informal OKLab JND estimates put a bare-minimum detectable
 * difference around 0.01-0.02 for a side-by-side swatch under ideal
 * conditions. 0.05 is roughly double that — a margin meant to survive a
 * real UI's smaller swatches, imperfect displays and non-ideal viewing
 * conditions, not just a lab-condition JND.
 *
 * This metric — plain Euclidean OKLab distance under ordinary vision —
 * proves distinguishability for ordinary vision only. It models no colour
 * vision deficiency: `branchleft.colour-vision.test.ts` is the test that
 * actually simulates protanopia/deuteranopia/tritanopia (Machado et al.
 * 2009) and checks distance under each. Cycle-1 review correctly found an
 * earlier version of this file's comment claimed CVD relevance for a plain
 * OKLab number that didn't establish it — this comment now claims only
 * what this file's metric proves.
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

  // Called out on its own per the brief: society and redlines are the two
  // reds in the palette, so they're the closest ValuesColours pair by this
  // metric in both modes (see the PR body for the numbers) — worth
  // asserting on its own even though the generic pairwise loop above
  // already covers it.
  it('society vs redlines — the pair Rob asked to have flagged — still clears the floor', () => {
    const props = getProps();
    const distance = oklabDistance(
      resolveColour(props, '--bl-value-society'),
      resolveColour(props, '--bl-value-redlines')
    );
    expect(distance).toBeGreaterThanOrEqual(MIN_DISTANCE);
  });
});
