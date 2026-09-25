import * as React from 'react';
import {
  glyphTransform,
  LOGO_GLYPH,
  LOGO_SIZE,
  PUBLIC_PRESS_ACCESSIBLE_NAME,
  PUBLIC_PRESS_INKS,
  type PublicPressColor,
} from './publicPressGeometry';

export interface PublicPressLogoProps extends Omit<React.SVGProps<SVGSVGElement>, 'color'> {
  /**
   * Which of the four rulings-fixed inks to render.
   *
   * @default "blue"
   */
  color?: PublicPressColor;
  /**
   * A number is treated as pixels; a string is any CSS length. The logo is
   * square, so width follows height 1:1 via `viewBox` — there is no
   * separate `width` prop.
   *
   * @default 32
   */
  height?: number | string;
  /**
   * Overrides the default accessible name ("PublicPress"). Ignored when
   * `decorative` is set.
   */
  title?: string;
  /**
   * Marks the logo as decorative: it is hidden from assistive technology
   * (`aria-hidden`) instead of exposing an accessible name. Use this when
   * adjacent visible text already says "PublicPress".
   */
  decorative?: boolean;
}

/**
 * The PublicPress logo: the pilcrow P alone, centred in a square block. The
 * mark's geometry and inks are fixed (see the README) — only presentation
 * (`color`, `height`) is configurable.
 *
 * @example
 * ```tsx
 * <PublicPressLogo color="yellow" height={32} />
 * ```
 */
export function PublicPressLogo({
  color = 'blue',
  height = 32,
  title,
  decorative = false,
  style,
  ...svgProps
}: Readonly<PublicPressLogoProps>): React.JSX.Element {
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
      viewBox={`0 0 ${LOGO_SIZE} ${LOGO_SIZE}`}
      {...accessibleProps}
      style={{ ...sizeStyle, ...style }}
      {...svgProps}
    >
      <rect x={0} y={0} width={LOGO_SIZE} height={LOGO_SIZE} fill={ink.block} />
      <path d={LOGO_GLYPH.glyph.d} fill={ink.letters} transform={glyphTransform(LOGO_GLYPH.x)} />
    </svg>
  );
}
