import * as React from 'react';

export type LogoColor =
  | { type: 'branded' }
  | { type: 'monowhite' }
  | { type: 'monoblack' }
  | { type: 'custom'; color: string };

export type LogoBackground =
  { type: 'black' } | { type: 'white' } | { type: 'custom'; color: string };

export interface LogoProps extends Omit<React.SVGProps<SVGSVGElement>, 'color'> {
  dropShadowColor?: LogoColor;
  mainColor?: LogoColor;
  overlayColor?: LogoColor;
  overlayOpacity?: number;
  /**
   * Wraps the mark in a solid backdrop, sized to the logo itself — for
   * contexts where the SVG's own transparency isn't wanted (Storybook
   * previews, print/export). This is a display convenience, not a layout
   * primitive: it deliberately does not take over the viewport or the
   * consumer's page. Page-level backgrounds are the consumer's decision
   * (see CLAUDE.md "Styling").
   */
  background?: LogoBackground;
}

const BRANDED = {
  dropShadow: 'black',
  main: '#B31761',
  overlay: '#FF006E',
} as const;

const PATH_BACKDROP =
  'M 7,227            C 7,227 10,260 10,260              10,260 329,550 329,550              329,550 344,365 344,365              344,365 521,362 521,362              521,362 359,765 359,765              359,765 791,746 791,746              791,746 780,919 780,919              780,919 1056,1056 1056,1056              1056,1056 802,910 802,910              802,910 822,718 822,718              822,718 412,738 412,738              412,738 590,319 590,319              590,319 322,323 322,323              322,323 317,488 317,488              317,488 49,236 49,236              49,236 7,227 7,227 Z';

const PATH_MAIN =
  'M 375,26            C 375,26 360,179 360,179              360,179 732,185 732,185              732,185 580,608 580,608              580,608 941,652 941,652              941,652 887,881 887,881              887,881 1057,1056 1057,1056              1057,1056 789,917 789,917              789,917 799,739 799,739              799,739 385,754 385,754              385,754 547,345 547,345              547,345 344,347 344,347              344,347 328,528 328,528              328,528 7,227 7,227              7,227 375,26 375,26 Z';

function resolveColor(color: LogoColor, brandColor: string): string {
  switch (color.type) {
    case 'branded':
      return brandColor;
    case 'monowhite':
      return '#ffffff';
    case 'monoblack':
      return '#000000';
    case 'custom':
      return color.color;
  }
}

function resolveBackground(bg: LogoBackground): string {
  switch (bg.type) {
    case 'black':
      return '#000000';
    case 'white':
      return '#ffffff';
    case 'custom':
      return bg.color;
  }
}

export function Logo({
  dropShadowColor = { type: 'branded' },
  mainColor = { type: 'branded' },
  overlayColor = { type: 'branded' },
  overlayOpacity = 0.2,
  background,
  ...svgProps
}: LogoProps) {
  const shadowFill = resolveColor(dropShadowColor, BRANDED.dropShadow);
  const mainFill = resolveColor(mainColor, BRANDED.main);
  const overlayFill = resolveColor(overlayColor, BRANDED.overlay);

  const svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="3.6in"
      height="3.6in"
      viewBox="0 0 1080 1080"
      {...svgProps}
    >
      <path id="backdrop" fill={shadowFill} stroke={shadowFill} strokeWidth={1} d={PATH_BACKDROP} />
      <path id="main" fill={mainFill} stroke={mainFill} strokeWidth={1} d={PATH_MAIN} />
      <path
        id="overlay"
        fill={overlayFill}
        stroke={overlayFill}
        strokeWidth={1}
        opacity={overlayOpacity}
        d={PATH_BACKDROP}
      />
    </svg>
  );

  if (!background) return svg;

  return (
    <div style={{ display: 'inline-flex', backgroundColor: resolveBackground(background) }}>
      {svg}
    </div>
  );
}
