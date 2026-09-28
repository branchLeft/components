import { describe, expect, it } from 'vitest';
import {
  REQUIRED_COLOUR_KEYS,
  REQUIRED_TOKEN_KEYS,
  REQUIRED_TYPE_FACE_KEYS,
  type DesignTokens,
} from '@branchleft/components';
import { publicPressTokens } from './publicPressTokens';

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

  it('marks its whole type scale, spacing and radius as provisional (none ruled)', () => {
    expect(publicPressTokens.type.scale.every((step) => step.provisional)).toBe(true);
    expect(publicPressTokens.spacing.every((step) => step.provisional)).toBe(true);
    expect(publicPressTokens.radius.every((step) => step.provisional)).toBe(true);
  });
});

function isProvisional(value: { provisional?: boolean }): boolean {
  return value.provisional === true;
}
