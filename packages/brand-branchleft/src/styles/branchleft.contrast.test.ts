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
import { contrastRatio } from './testUtils/colourMath';

const VALUE_NAMES = [
  'sustainability',
  'environment',
  'ai',
  'society',
  'opensource',
  'agility',
  'redlines',
] as const;

let dark: CustomProperties;
let light: CustomProperties;

beforeAll(async () => {
  const css = await buildStylesheet();
  const darkOnly = extractCustomProperties(css, ':root{');
  const lightOnly = extractCustomProperties(css, ':root[data-theme=light]{');
  dark = darkOnly;
  // Light mode only overrides colour tokens — type/spacing/radius/motion
  // fall through to the dark (default) declaration, exactly as the
  // cascade resolves it in a browser.
  light = new Map([...darkOnly, ...lightOnly]);
}, 30_000);

/**
 * Every contrast pairing this stylesheet makes a claim about, in one place
 * per the brief ("keep the pairing list in one place in the test"). `fg`/
 * `bg` are `--bl-*` custom-property names, resolved against whichever
 * mode's map is active when the pairing runs.
 *
 * `minRatio` is WCAG's own floor for the pairing's category: 4.5:1 for
 * text (including the ValuesColours, which are used as text/icon colour,
 * filled-button text, and the danger colour's error-text use), 3:1 for
 * non-text UI graphics (the focus ring, a control border that must be
 * seen — including the danger colour's own border use).
 *
 * Cycle-1 review found this list didn't cover `--bl-color-invalid`
 * (now `--bl-color-danger`) at all, and the whole 105-test suite stayed
 * green with that border set to a near-invisible value — a real, provable
 * blind spot. `COLOUR_COMPLETENESS` below closes that class of gap by
 * construction: it reads every `--bl-color-*`/`--bl-value-*` property the
 * built CSS actually declares and fails if one isn't covered by a pairing
 * here (or isn't in `CONTRAST_EXEMPT`, for the one property — the
 * decorative hairline — that's deliberately never held to a contrast
 * floor), rather than trusting this list to have been kept in sync by hand.
 */
const TEXT_PAIRINGS: ReadonlyArray<{ name: string; fg: string; bg: string; minRatio: number }> = [
  {
    name: 'foreground text on background',
    fg: '--bl-color-fg',
    bg: '--bl-color-bg',
    minRatio: 4.5,
  },
  { name: 'muted text on background', fg: '--bl-color-muted', bg: '--bl-color-bg', minRatio: 4.5 },
  {
    name: 'active/link colour on background',
    fg: '--bl-color-active',
    bg: '--bl-color-bg',
    minRatio: 4.5,
  },
  {
    name: 'filled-button text on its fill',
    fg: '--bl-color-button-fg',
    bg: '--bl-color-button-fill',
    minRatio: 4.5,
  },
  {
    name: 'danger colour as error text on background',
    fg: '--bl-color-danger',
    bg: '--bl-color-bg',
    minRatio: 4.5,
  },
  ...VALUE_NAMES.map((name) => ({
    name: `${name} ValuesColour on background`,
    fg: `--bl-value-${name}`,
    bg: '--bl-color-bg',
    minRatio: 4.5,
  })),
];

const UI_GRAPHIC_PAIRINGS: ReadonlyArray<{
  name: string;
  fg: string;
  bg: string;
  minRatio: number;
}> = [
  {
    name: 'focus ring (active colour) against background',
    fg: '--bl-color-active',
    bg: '--bl-color-bg',
    minRatio: 3,
  },
  {
    name: 'control border against background',
    fg: '--bl-color-border',
    bg: '--bl-color-bg',
    minRatio: 3,
  },
  {
    name: 'danger colour as invalid-control border against background',
    fg: '--bl-color-danger',
    bg: '--bl-color-bg',
    minRatio: 3,
  },
];

const ALL_PAIRINGS = [...TEXT_PAIRINGS, ...UI_GRAPHIC_PAIRINGS];

/**
 * Colour custom properties that never carry their own contrast floor and
 * are deliberately left out of `ALL_PAIRINGS`. Kept to exactly one entry,
 * each requiring its own one-line justification here — an addition to
 * this list is a claim this test then never checks, so it must be
 * defensible, not a convenient way to silence the completeness check.
 *
 * `--bl-color-hairline`: decorative only (dividers, `hr`, table row
 * rules) — `elements.css`'s own comments say it's "never a meaningful
 * boundary," so it has no contrast obligation to check.
 */
const CONTRAST_EXEMPT = new Set<string>(['--bl-color-hairline']);

describe.each([
  ['dark', () => dark],
  ['light', () => light],
] as const)('branchleft.css contrast — %s mode', (_modeName, getProps) => {
  it.each(ALL_PAIRINGS)('$name clears $minRatio:1', ({ fg, bg, minRatio }) => {
    const props = getProps();
    const fgHex = resolveColour(props, fg);
    const bgHex = resolveColour(props, bg);
    expect(contrastRatio(fgHex, bgHex)).toBeGreaterThanOrEqual(minRatio);
  });

  it('every declared --bl-color-*/--bl-value-* property is covered by a pairing above or an explicit exemption', () => {
    const props = getProps();
    const covered = new Set<string>();
    for (const { fg, bg } of ALL_PAIRINGS) {
      covered.add(fg);
      covered.add(bg);
    }
    const declared = Array.from(props.keys()).filter(
      (name) => name.startsWith('--bl-color-') || name.startsWith('--bl-value-')
    );
    const uncovered = declared.filter((name) => !covered.has(name) && !CONTRAST_EXEMPT.has(name));
    expect(uncovered).toEqual([]);
  });
});
