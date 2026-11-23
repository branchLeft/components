import { describe, it, expect } from 'vitest';
import { contrastRatio, hexToRgb } from './contrastRatio';

describe('contrastRatio', () => {
  it('gives the WCAG maximum for black on white, in either order', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 10);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 10);
  });

  it('gives 1 for identical colours', () => {
    expect(contrastRatio('#336699', '#336699')).toBe(1);
  });

  it('rejects anything that is not #rrggbb', () => {
    expect(() => hexToRgb('#fff')).toThrow('Expected a #rrggbb hex colour');
  });
});
