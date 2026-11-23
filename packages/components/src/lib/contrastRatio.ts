/**
 * WCAG 2.x colour maths for `#rrggbb` hex only: sRGB to linear light, relative luminance,
 * and the contrast ratio between two colours. Brand-neutral, so any package can test against it.
 */

export function hexToRgb(hex: string): readonly [number, number, number] {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) {
    throw new Error(`Expected a #rrggbb hex colour, got: ${hex}`);
  }
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** One 8-bit sRGB channel to linear light (WCAG 2.1 threshold 0.04045). */
export function srgbChannelToLinear(channel8bit: number): number {
  const c = channel8bit / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]: readonly [number, number, number]): number {
  const [rl, gl, bl] = [r, g, b].map(srgbChannelToLinear);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** WCAG contrast ratio (always >= 1), order-independent. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];
  return (lighter + 0.05) / (darker + 0.05);
}
