import {
  CAP_HEIGHT,
  PUBLIC_PRESS_BLOCK,
  PUBLIC_PRESS_GLYPHS,
  PUBLIC_PRESS_WORDMARK_SEQUENCE,
  type PublicPressGlyph,
} from './publicPressMark.generated';

export type { PublicPressColor } from './publicPressMark.generated';
export { PUBLIC_PRESS_INKS } from './publicPressMark.generated';

export const PUBLIC_PRESS_ACCESSIBLE_NAME = 'PublicPress';

/** Distance from the top of the block down to the baseline. */
const BASELINE_Y = PUBLIC_PRESS_BLOCK.top + CAP_HEIGHT;

export interface PlacedGlyph {
  readonly glyph: PublicPressGlyph;
  readonly x: number;
}

/**
 * Lays the wordmark sequence out left to right, starting from the block's
 * left inset. `GAP` entries widen the gap without emitting a glyph.
 */
function layoutSequence(): { placements: PlacedGlyph[]; contentWidth: number } {
  let x = 0;
  const placements: PlacedGlyph[] = [];

  for (const item of PUBLIC_PRESS_WORDMARK_SEQUENCE) {
    if (item === 'GAP') {
      x += PUBLIC_PRESS_BLOCK.gapAfterC;
      continue;
    }
    const glyph = PUBLIC_PRESS_GLYPHS[item];
    placements.push({ glyph, x });
    x += glyph.adv;
  }

  return { placements, contentWidth: x };
}

const { placements: wordmarkPlacements, contentWidth } = layoutSequence();

/** Glyph placements for the wordmark, offset by the block's left inset. */
export const WORDMARK_GLYPHS: readonly PlacedGlyph[] = wordmarkPlacements.map(({ glyph, x }) => ({
  glyph,
  x: x + PUBLIC_PRESS_BLOCK.sides,
}));

/** Overall wordmark block width: side inset + sequence advances (incl. the gap) + side inset. */
export const WORDMARK_WIDTH = PUBLIC_PRESS_BLOCK.sides * 2 + contentWidth;

export const WORDMARK_HEIGHT = PUBLIC_PRESS_BLOCK.height;

/** The logo is the pilcrow P alone, centred in a square block. */
export const LOGO_SIZE = PUBLIC_PRESS_BLOCK.height;

const pilcrowP = PUBLIC_PRESS_GLYPHS.pilcrowP;

export const LOGO_GLYPH: PlacedGlyph = {
  glyph: pilcrowP,
  x: (LOGO_SIZE - pilcrowP.adv) / 2,
};

export function glyphTransform(x: number): string {
  return `translate(${x}, ${BASELINE_Y}) scale(1,-1)`;
}
