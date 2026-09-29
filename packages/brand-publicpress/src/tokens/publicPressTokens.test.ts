import { describe, expect, it } from 'vitest';
import {
  REQUIRED_COLOUR_KEYS,
  REQUIRED_TOKEN_KEYS,
  REQUIRED_TYPE_FACE_KEYS,
  type DesignTokens,
} from '@branchleft/components';
import { publicPressTokens } from './publicPressTokens';

// Local WCAG 2.x contrast helper — deliberately not shared with
// brand-branchleft's own copy (`styles/testUtils/colourMath.ts`): brand
// packages don't depend on each other (see the workspace CLAUDE.md), and
// this is the only contrast check this package needs.
function hexToRgb(hex: string): readonly [number, number, number] {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) {
    throw new Error(`Expected a #rrggbb hex colour, got: ${hex}`);
  }
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function srgbChannelToLinear(channel8bit: number): number {
  const c = channel8bit / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]: readonly [number, number, number]): number {
  const [rl, gl, bl] = [r, g, b].map(srgbChannelToLinear);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];
  return (lighter + 0.05) / (darker + 0.05);
}

const brands: { name: string; tokens: DesignTokens }[] = [
  { name: 'PublicPress', tokens: publicPressTokens },
];

describe.each(brands)('$name token set', ({ tokens }) => {
  it.each(REQUIRED_TOKEN_KEYS)('defines the top-level key "%s"', (key) => {
    expect(tokens[key]).toBeDefined();
  });

  it.each(REQUIRED_COLOUR_KEYS)('defines colour.%s with light and dark values', (key) => {
    const value = tokens.colour[key];
    expect(value).toBeDefined();
    expect(typeof value.light).toBe('string');
    expect(value.light.length).toBeGreaterThan(0);
    expect(typeof value.dark).toBe('string');
    expect(value.dark.length).toBeGreaterThan(0);
  });

  it.each(REQUIRED_TYPE_FACE_KEYS)('defines type.faces.%s', (key) => {
    const face = tokens.type.faces[key];
    expect(face).toBeDefined();
    expect(face.family.length).toBeGreaterThan(0);
    expect(face.fallbackStack).toContain(face.family);
    expect(face.weights.length).toBeGreaterThan(0);
    expect(face.source.length).toBeGreaterThan(0);
  });

  it('defines a non-empty type scale', () => {
    expect(tokens.type.scale.length).toBeGreaterThan(0);
    for (const step of tokens.type.scale) {
      expect(step.name.length).toBeGreaterThan(0);
      expect(step.fontSize.length).toBeGreaterThan(0);
      expect(step.lineHeight.length).toBeGreaterThan(0);
    }
  });

  it('defines a non-empty spacing scale', () => {
    expect(tokens.spacing.length).toBeGreaterThan(0);
  });

  it('defines a non-empty radius scale', () => {
    expect(tokens.radius.length).toBeGreaterThan(0);
  });

  it('never marks a step provisional without it being inspectable (has a value)', () => {
    const allSteps = [
      ...Object.values(tokens.colour),
      ...tokens.type.scale,
      ...tokens.spacing,
      ...tokens.radius,
      ...(tokens.shadow ?? []),
      ...(tokens.motion?.duration ?? []),
      ...(tokens.motion?.easing ?? []),
    ];
    for (const step of allSteps) {
      if ('value' in step) {
        expect(step.value.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('PublicPress tokens', () => {
  it('marks the ruled mark inks (brand/brandAccent) as non-provisional', () => {
    expect(isProvisional(publicPressTokens.colour.brand)).toBe(false);
    expect(isProvisional(publicPressTokens.colour.brandAccent)).toBe(false);
    expect(publicPressTokens.colour.brand.dark).toBe('#3255A4');
    expect(publicPressTokens.colour.brandAccent.dark).toBe('#FF48B0');
  });

  it('marks the wordmark face (Libre Franklin) as non-provisional', () => {
    expect(publicPressTokens.type.faces.wordmark.provisional).toBeFalsy();
    expect(publicPressTokens.type.faces.wordmark.family).toBe('Libre Franklin');
  });

  it('marks every other type face as provisional (no ruling exists yet)', () => {
    expect(publicPressTokens.type.faces.display.provisional).toBe(true);
    expect(publicPressTokens.type.faces.body.provisional).toBe(true);
    expect(publicPressTokens.type.faces.mono.provisional).toBe(true);
  });

  it('settles h1-h6 and small (owner ruling) but leaves spacing, radius and body provisional', () => {
    const settledNames = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'small']);
    for (const step of publicPressTokens.type.scale) {
      expect(Boolean(step.provisional), step.name).toBe(!settledNames.has(step.name));
    }
    expect(publicPressTokens.spacing.every((step) => step.provisional)).toBe(true);
    expect(publicPressTokens.radius.every((step) => step.provisional)).toBe(true);
  });

  it('rules the active/accent colour as the mark yellow, both modes, no provisional flag', () => {
    const active = publicPressTokens.colour.active;
    expect(active).toBeDefined();
    expect(active?.dark).toBe('#FFE800');
    expect(active?.light).toBe('#7e7300');
    expect(active?.provisional).toBeFalsy();
    expect(active?.lightProvisional).toBeFalsy();
    expect(active?.darkProvisional).toBeFalsy();
    // Owner ruling: the mark's own yellow ink as active/accent — clears the
    // 4.5:1 text/UI-component floor on black by a wide margin.
    expect(contrastRatio(active!.dark, '#000000')).toBeGreaterThan(15);
  });

  it("rules the light-mode active variant against the token set's OWN light background, not a hand-picked white", () => {
    const active = publicPressTokens.colour.active!;
    const backgroundLight = publicPressTokens.colour.background.light;
    // The ruled dark-mode yellow itself fails badly on the light background
    // — this is exactly why a separate, deeper light-mode value exists.
    expect(contrastRatio(active.dark, backgroundLight)).toBeLessThan(1.5);
    expect(contrastRatio(active.light, backgroundLight)).toBeGreaterThanOrEqual(4.5);
  });

  it('documents the fill-only rule on the token itself, not only in a source comment', () => {
    expect(publicPressTokens.colour.active?.note).toMatch(/fill only/i);
    expect(publicPressTokens.colour.active?.note).toMatch(/never text/i);
  });

  it('has no stylesheet to compare colour values against (unlike branchLeft)', () => {
    // branchLeftTokens.stylesheet-parity.test.ts compares every colour
    // token against `@branchleft/brand-branchleft`'s built stylesheet
    // (`styles/tokens.css`) — the one thing that actually ships a page
    // theme today. This package ships no equivalent CSS: PublicPress has
    // no settled site-wide theme yet (see this file's own top-of-file
    // comment), so there is nothing for a parity test to check `active`,
    // `brand`, `brandAccent` or any other colour against. Recorded here so
    // that gap is a stated fact, not a silent omission — once a
    // PublicPress stylesheet exists, add the same comparison this file's
    // sibling runs for branchLeft.
    expect(true).toBe(true);
  });
});

function isProvisional(value: { provisional?: boolean }): boolean {
  return value.provisional === true;
}
