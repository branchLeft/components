/**
 * WCAG 2.x relative-luminance contrast ratio and OKLab perceptual distance,
 * both computed from `#rrggbb` hex strings only — every colour this
 * stylesheet declares resolves to that shape (see `resolveColour`), so
 * neither function needs to handle `rgb()`/`hsl()`/named colours.
 */

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

/** WCAG contrast ratio (always >= 1), order-independent. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];
  return (lighter + 0.05) / (darker + 0.05);
}

/** sRGB (D65) -> OKLab, via the standard linear-sRGB -> LMS -> OKLab matrices. */
function hexToOklab(hex: string): readonly [number, number, number] {
  const [r8, g8, b8] = hexToRgb(hex);
  const r = srgbChannelToLinear(r8);
  const g = srgbChannelToLinear(g8);
  const b = srgbChannelToLinear(b8);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

/** Euclidean distance between two colours in OKLab space. */
export function oklabDistance(hexA: string, hexB: string): number {
  const [lA, aA, bA] = hexToOklab(hexA);
  const [lB, aB, bB] = hexToOklab(hexB);
  return Math.sqrt((lA - lB) ** 2 + (aA - aB) ** 2 + (bA - bB) ** 2);
}
