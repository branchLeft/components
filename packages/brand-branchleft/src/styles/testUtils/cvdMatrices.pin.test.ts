import { describe, it, expect } from 'vitest';
import { MACHADO_2009_SEVERITY_1 } from './cvdSimulation';

/**
 * Pins every coefficient of every simulation matrix to the literal values
 * published in Machado, Oliveira & Fernandes (2009), Table 1, severity
 * 1.0. Cycle-2 review found the shipped deuteranopia matrix had been
 * miscopied — three coefficients differed from the paper — and the row
 * sums (a real property of these matrices, ~1 in every row) still checked
 * out, so nothing caught it until someone checked the actual numbers. A
 * pin is the only thing that catches a transcription error the row-sum
 * check can't: two different matrices can both be row-stochastic.
 */
const PUBLISHED_MATRICES = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
} as const;

describe('MACHADO_2009_SEVERITY_1', () => {
  it.each(Object.keys(PUBLISHED_MATRICES) as Array<keyof typeof PUBLISHED_MATRICES>)(
    '%s matches the published coefficients exactly',
    (kind) => {
      expect(MACHADO_2009_SEVERITY_1[kind]).toEqual(PUBLISHED_MATRICES[kind]);
    }
  );

  /**
   * Sanity check only, per the cycle-3 brief — NOT the real test above.
   * Every row of a Machado 2009 matrix sums to ~1 (the model preserves a
   * neutral grey), but this alone can't prove a matrix matches the paper:
   * the miscopied deuteranopia matrix cycle-2 review found also summed to
   * ~1 per row, despite being wrong. A matrix failing this would be an
   * even more obviously broken transcription than the one that slipped
   * through — kept as a second, independent signal, not a substitute for
   * the pin.
   */
  it.each(Object.keys(PUBLISHED_MATRICES) as Array<keyof typeof PUBLISHED_MATRICES>)(
    "%s's rows each sum to about 1",
    (kind) => {
      for (const row of MACHADO_2009_SEVERITY_1[kind]) {
        const sum = row.reduce((total, value) => total + value, 0);
        expect(sum).toBeCloseTo(1, 3);
      }
    }
  );
});
