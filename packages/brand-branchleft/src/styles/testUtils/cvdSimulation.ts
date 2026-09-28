/**
 * Colour-vision-deficiency simulation, per Machado, Oliveira & Fernandes,
 * "A Physiologically-based Model for Simulation of Color Vision
 * Deficiency" (IEEE TVCG, 2009). These are the paper's published
 * full-severity (1.0) matrices, applied directly to linear (not gamma-
 * encoded) sRGB — the paper's own model operates in a linear cone-response
 * space, so applying it to gamma-encoded 8-bit values would simulate the
 * wrong thing.
 */

export type CvdKind = 'protanopia' | 'deuteranopia' | 'tritanopia';

type Matrix3 = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
];

const MACHADO_2009_SEVERITY_1: Readonly<Record<CvdKind, Matrix3>> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.36732, 1.30063, -0.667955],
    [0.280085, 0.677324, 0.042591],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

function hexToRgb8(hex: string): readonly [number, number, number] {
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

/**
 * Applies a Machado et al. 2009 full-severity simulation matrix to a
 * `#rrggbb` colour, in linear RGB, and returns the simulated colour as
 * linear RGB components (each clamped to `[0, 1]` — the matrices can
 * produce slightly out-of-gamut values, and a real display/simulator
 * clips rather than showing an invalid colour).
 */
export function simulateCvdLinear(hex: string, kind: CvdKind): readonly [number, number, number] {
  const [r8, g8, b8] = hexToRgb8(hex);
  const r = srgbChannelToLinear(r8);
  const g = srgbChannelToLinear(g8);
  const b = srgbChannelToLinear(b8);
  const m = MACHADO_2009_SEVERITY_1[kind];
  const simulated: [number, number, number] = [
    m[0][0] * r + m[0][1] * g + m[0][2] * b,
    m[1][0] * r + m[1][1] * g + m[1][2] * b,
    m[2][0] * r + m[2][1] * g + m[2][2] * b,
  ];
  return simulated.map((v) => Math.min(1, Math.max(0, v))) as [number, number, number];
}

/** OKLab conversion starting from already-linear RGB (skips the sRGB decode
 * `colourMath.ts`'s `oklabDistance` does internally from a hex string) —
 * needed here because the CVD simulation itself happens in linear space,
 * so re-encoding to sRGB and back would be redundant and lossy. */
export function linearRgbToOklab(
  linear: readonly [number, number, number]
): readonly [number, number, number] {
  const [r, g, b] = linear;
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

function oklabEuclidean(
  a: readonly [number, number, number],
  b: readonly [number, number, number]
): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

/**
 * OKLab distance between two `#rrggbb` colours as a viewer with the given
 * colour vision deficiency (full severity) would perceive them — i.e.
 * after applying the Machado et al. 2009 simulation matrix to each colour
 * in linear RGB, then measuring the usual OKLab Euclidean distance between
 * the simulated results.
 */
export function simulatedOklabDistance(hexA: string, hexB: string, kind: CvdKind): number {
  return oklabEuclidean(
    linearRgbToOklab(simulateCvdLinear(hexA, kind)),
    linearRgbToOklab(simulateCvdLinear(hexB, kind))
  );
}
