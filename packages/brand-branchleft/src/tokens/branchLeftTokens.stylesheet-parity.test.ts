// @vitest-environment node
//
// Needs the plain Node environment for the same reason as the stylesheet's
// own tests: `buildStylesheet` runs esbuild, which jsdom's polyfills break.
import { describe, expect, it, beforeAll } from 'vitest';
import {
  buildStylesheet,
  extractCustomProperties,
  resolveColour,
  type CustomProperties,
} from '../styles/testUtils/buildStylesheet';
import { branchLeftTokens } from './branchLeftTokens';

// Maps each `branchLeftTokens.colour.*` key to the built stylesheet's own
// custom property name — the one thing this test exists to keep honest.
// `brand` has no distinctly-named property of its own (see its own
// comment in branchLeftTokens.ts): the closest real property sharing its
// value is `--bl-color-button-fill`.
const COLOUR_TO_PROPERTY: Record<string, string> = {
  background: '--bl-color-bg',
  foreground: '--bl-color-fg',
  brand: '--bl-color-button-fill',
  brandAccent: '--bl-color-active',
  muted: '--bl-color-muted',
  hairline: '--bl-color-hairline',
};

// Vite's CSS minifier drops a redundant leading zero (`0.12` -> `.12`);
// normalise both sides the same way rather than special-casing the built
// value's own formatting.
function normalise(value: string): string {
  return value.replace(/(\D)0\./g, '$1.');
}

let darkProps: CustomProperties;
let lightProps: CustomProperties;

beforeAll(async () => {
  const css = await buildStylesheet();
  darkProps = extractCustomProperties(css, ':root{');
  lightProps = extractCustomProperties(css, ':root[data-theme=light]{');
}, 30_000);

describe("branchLeftTokens.ts colour values match styles/tokens.css's own custom properties", () => {
  it.each(Object.entries(COLOUR_TO_PROPERTY))(
    'colour.%s (dark and light) matches --bl-color-*',
    (key, property) => {
      const token = branchLeftTokens.colour[key as keyof typeof branchLeftTokens.colour];
      expect(token, key).toBeDefined();
      expect(normalise(resolveColour(darkProps, property)), `dark: ${property}`).toBe(
        normalise(token!.dark)
      );
      expect(normalise(resolveColour(lightProps, property)), `light: ${property}`).toBe(
        normalise(token!.light)
      );
    }
  );
});
