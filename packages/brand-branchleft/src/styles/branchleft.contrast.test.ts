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
 * and filled-button text), 3:1 for non-text UI graphics (the focus ring,
 * a control border that must be seen).
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
];

const ALL_PAIRINGS = [...TEXT_PAIRINGS, ...UI_GRAPHIC_PAIRINGS];

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
});
