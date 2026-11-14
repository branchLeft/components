import { describe, it, expect } from 'vitest';
import { MACHADO_2009_SEVERITY_1 } from './cvdSimulation';

/**
 * Pins every coefficient to Machado et al. (2009) Table 1, severity 1.0; row sums can't
 * catch a miscopy, since different matrices can both be row-stochastic.
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
   * Sanity check only, NOT the real test above: every row sums to ~1 (neutral grey is preserved), but a
   * miscopied matrix can still sum to ~1, so this is a second independent signal, not a substitute.
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
