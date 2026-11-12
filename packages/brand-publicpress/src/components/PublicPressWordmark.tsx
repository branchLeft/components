import * as React from 'react';
import {
  glyphTransform,
  PUBLIC_PRESS_ACCESSIBLE_NAME,
  PUBLIC_PRESS_INKS,
  WORDMARK_GLYPHS,
  WORDMARK_HEIGHT,
  WORDMARK_WIDTH,
  type PublicPressColor,
} from './publicPressGeometry';

export interface PublicPressWordmarkProps extends Omit<React.SVGProps<SVGSVGElement>, 'color'> {
  /**
   * Which of the four fixed inks to render.
   * @default "blue"
   */
  color?: PublicPressColor;
  /**
   * A number is pixels, a string any CSS length; width follows the mark's aspect ratio via `viewBox`.
   * @default 32
   */
  height?: number | string;
  /**
   * Overrides the default accessible name ("PublicPress"). Ignored when
   * `decorative` is set.
   */
  title?: string;
  /**
   * Marks the wordmark as decorative: hidden from assistive technology (`aria-hidden`) instead of exposing an
   * accessible name. Use when adjacent visible text already says "PublicPress".
   */
  decorative?: boolean;
}

/**
 * The PublicPress wordmark: Libre Franklin Bold, both Ps the pilcrow P, knocked out of a solid block.
 * @example <PublicPressWordmark color="pink" height={48} />
 */
export function PublicPressWordmark({
  color = 'blue',
  height = 32,
  title,
  decorative = false,
  style,
  ...svgProps
}: Readonly<PublicPressWordmarkProps>): React.JSX.Element {
  const ink = PUBLIC_PRESS_INKS[color];

  const accessibleProps: React.SVGProps<SVGSVGElement> = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': title ?? PUBLIC_PRESS_ACCESSIBLE_NAME };

  // The mark's own units (thousands per em) are far too large for a default
  // pixel size, so `height` always has a value — `width` follows via
  // `viewBox` rather than being set directly.
  const sizeStyle: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: 'auto',
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${WORDMARK_WIDTH} ${WORDMARK_HEIGHT}`}
      {...accessibleProps}
      style={{ ...sizeStyle, ...style }}
      {...svgProps}
    >
      <rect x={0} y={0} width={WORDMARK_WIDTH} height={WORDMARK_HEIGHT} fill={ink.block} />
      {WORDMARK_GLYPHS.map(({ glyph, x }, index) => (
        <path key={index} d={glyph.d} fill={ink.letters} transform={glyphTransform(x)} />
      ))}
    </svg>
  );
}
