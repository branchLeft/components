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
   * Which of the four rulings-fixed inks to render.
   *
   * @default "blue"
   */
  color?: PublicPressColor;
  /**
   * A number is treated as pixels; a string is any CSS length. Width
   * follows automatically from the mark's aspect ratio (via `viewBox`) —
   * there is no separate `width` prop.
   */
  height?: number | string;
  /**
   * Overrides the default accessible name ("PublicPress"). Ignored when
   * `decorative` is set.
   */
  title?: string;
  /**
   * Marks the wordmark as decorative: it is hidden from assistive
   * technology (`aria-hidden`) instead of exposing an accessible name. Use
   * this when adjacent visible text already says "PublicPress".
   */
  decorative?: boolean;
}

/**
 * The PublicPress wordmark: Libre Franklin Bold letters, both Ps the
 * pilcrow P, knocked out of a solid block. The mark's geometry and inks are
 * fixed (see the README) — only presentation (`color`, `height`) is
 * configurable.
 *
 * @example
 * ```tsx
 * <PublicPressWordmark color="pink" height={48} />
 * ```
 */
export function PublicPressWordmark({
  color = 'blue',
  height,
  title,
  decorative = false,
  style,
  ...svgProps
}: Readonly<PublicPressWordmarkProps>): React.JSX.Element {
  const ink = PUBLIC_PRESS_INKS[color];

  const accessibleProps: React.SVGProps<SVGSVGElement> = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': title ?? PUBLIC_PRESS_ACCESSIBLE_NAME };

  // With no `height`, fall back to the mark's own units as the intrinsic
  // size (rather than the browser's 300x150 SVG default) — still overridable
  // via `style`/`width`/`height` passthrough.
  const sizeProps: Pick<React.SVGProps<SVGSVGElement>, 'width' | 'height' | 'style'> = height ===
  undefined
    ? { width: WORDMARK_WIDTH, height: WORDMARK_HEIGHT }
    : { style: { height: typeof height === 'number' ? `${height}px` : height, width: 'auto' } };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${WORDMARK_WIDTH} ${WORDMARK_HEIGHT}`}
      {...accessibleProps}
      {...sizeProps}
      style={{ ...sizeProps.style, ...style }}
      {...svgProps}
    >
      <rect x={0} y={0} width={WORDMARK_WIDTH} height={WORDMARK_HEIGHT} fill={ink.block} />
      {WORDMARK_GLYPHS.map(({ glyph, x }, index) => (
        <path key={index} d={glyph.d} fill={ink.letters} transform={glyphTransform(x)} />
      ))}
    </svg>
  );
}
