import { PUBLIC_PRESS_INKS } from '../components/publicPressGeometry';
import type { DesignTokens } from '@branchleft/components';

/**
 * All four ruled PublicPress mark inks (block + knockout-letter colour),
 * re-exported from the generated mark module so this is never a second,
 * driftable copy of `scripts/publicpress-mark-spec.json`'s `inks` — see
 * `publicPressMark.generated.test.ts` for the control that keeps the
 * generated module itself honest against that spec. `colour.brand`/
 * `colour.brandAccent` below use the blue/pink entries; black/yellow have
 * no assigned semantic role yet (open question).
 */
export const publicPressInks = PUBLIC_PRESS_INKS;

/**
 * PublicPress design tokens. The wordmark/logo (four fixed ink blocks,
 * Libre Franklin Bold), the yellow active colour, the three typefaces
 * (self-hosted Jost with the holding page's Futura stack behind it for
 * display and body, self-hosted Courier Prime for mono), and the type
 * scale are settled visual rulings. Everything else is provisional,
 * mostly borrowed from branchLeft's tokens.
 */
export const publicPressTokens: DesignTokens = {
  brand: 'PublicPress',

  colour: {
    // No page background/foreground ruling exists for PublicPress anywhere
    // in components, workspace, or ghost-platform-docs — these mirror the
    // mark's own knockout-block convention (a dark block, light letters) as
    // the least-invented guess, not a ruling.
    background: { dark: '#000000', light: '#FAFAF7', provisional: true },
    foreground: { dark: '#FAFAF7', light: '#000000', provisional: true },

    // The primary ("blue") ink — settled by the brand owner's mark ruling,
    // scripts/publicpress-mark-spec.json → inks.blue.block. No light/dark
    // variants are ruled, so the same value is used for both; that's a
    // structural fill, not a claim that a dark-mode variant was decided.
    brand: { dark: '#3255A4', light: '#3255A4' },
    // The secondary ("pink") ink — settled, same source, inks.pink.block.
    brandAccent: { dark: '#FF48B0', light: '#FF48B0' },

    // No muted/de-emphasised colour is ruled for PublicPress. Provisionally
    // reusing the mark's own letter ink (near-white/near-black knockout).
    muted: { dark: '#FAFAF7', light: '#000000', provisional: true },
    // No hairline colour is ruled. Provisional guess only.
    hairline: { dark: '#FAFAF7', light: '#000000', provisional: true },

    // Active/accent colour (links, hover, focus) — owner-ruled, both
    // modes. `dark` is the mark's own yellow ink (16.79:1 on black — see
    // `publicPressTokens.test.ts`); that hex is only ~1.25:1 on
    // `colour.background.light`, so it's the light-mode FILL only, never
    // text/a thin line — the note below carries that into the rendered
    // docs, not just here. `light` is the owner-ruled deeper variant for
    // light-mode text (4.63:1 on `colour.background.light`, 4.84:1 on
    // white).
    active: {
      dark: '#FFE800',
      light: '#7e7300',
      note: 'Pure #FFE800 is a light-mode fill only (behind dark text/icons) — never text or a thin line there. #7e7300 is the light-mode TEXT variant.',
    },
  },

  type: {
    faces: {
      // Owner-ruled text face (workspace#1615): self-hosted Jost (SIL OFL
      // 1.1), with the holding page's own Futura stack kept behind it as
      // the fallback chain. Font files ship in this package
      // (styles/fonts/Jost/, loaded via styles/fonts.css) —
      // @fontsource-variable/jost@5.3.0, latin subset.
      display: {
        family: 'Jost',
        fallbackStack: "'Jost', 'Futura', 'Century Gothic', 'Avenir Next', system-ui, sans-serif",
        weights: [400, 500, 600, 700],
        source:
          'Self-hosted Jost (SIL OFL 1.1) — @fontsource-variable/jost@5.3.0 latin-subset woff2, styles/fonts/Jost/, loaded by styles/fonts.css; falls back to the holding page’s own Futura stack',
      },
      // Settled: the wordmark/logo glyph outlines are Libre Franklin Bold
      // (SIL OFL 1.1), vectorised into static SVG paths — see the README
      // and scripts/publicpress-mark-spec.json's `note` field. Only weight 700 (Bold) is used; no web font is loaded by the
      // components (the outlines are pre-baked paths), so `source` names
      // the origin typeface rather than a font file the app loads.
      wordmark: {
        family: 'Libre Franklin',
        fallbackStack: "'Libre Franklin', ui-sans-serif, system-ui, sans-serif",
        weights: [700],
        source:
          'Google Fonts family "Libre Franklin" (SIL OFL 1.1) — glyph outlines only, vectorised into SVG path data in PublicPressWordmark/PublicPressLogo; no web font file is loaded at runtime',
      },
      // Same ruling and files as display (workspace#1615) — self-hosted
      // Jost, Futura stack behind it as fallback.
      body: {
        family: 'Jost',
        fallbackStack: "'Jost', 'Futura', 'Century Gothic', 'Avenir Next', system-ui, sans-serif",
        weights: [400, 500, 600, 700],
        source:
          'Self-hosted Jost (SIL OFL 1.1) — @fontsource-variable/jost@5.3.0 latin-subset woff2, styles/fonts/Jost/, loaded by styles/fonts.css; falls back to the holding page’s own Futura stack',
      },
      // Owner-ruled mono face (workspace#1615): self-hosted Courier Prime
      // (SIL OFL 1.1). Font files ship in this package
      // (styles/fonts/CourierPrime/, loaded via styles/fonts.css) —
      // @fontsource/courier-prime@5.3.0, latin subset.
      mono: {
        family: 'Courier Prime',
        fallbackStack: "'Courier Prime', 'Courier New', Courier, monospace",
        weights: [400, 700],
        source:
          'Self-hosted Courier Prime (SIL OFL 1.1) — @fontsource/courier-prime@5.3.0 latin-subset woff2, styles/fonts/CourierPrime/, loaded by styles/fonts.css',
      },
    },
    // Owner ruling: h1-h6 and small are settled (reused from branchLeft's
    // scale as-is, not a placeholder) — only `body` remains an unruled
    // reuse.
    scale: [
      { name: 'h1', fontSize: '2.25rem', lineHeight: '2.5rem' },
      { name: 'h2', fontSize: '1.875rem', lineHeight: '2.25rem' },
      { name: 'h3', fontSize: '1.5rem', lineHeight: '2rem' },
      { name: 'h4', fontSize: '1.25rem', lineHeight: '1.75rem' },
      { name: 'h5', fontSize: '1.125rem', lineHeight: '1.75rem' },
      { name: 'h6', fontSize: '1rem', lineHeight: '1.5rem' },
      { name: 'body', fontSize: '1rem', lineHeight: '1.6' },
      { name: 'small', fontSize: '0.875rem', lineHeight: '1.25rem' },
    ],
  },

  // No spacing scale is ruled for PublicPress. Provisional reuse of
  // branchLeft's generic scale (the two named branchLeft-specific tokens,
  // nav-offset/section-scroll-offset, are dropped — they describe
  // branchLeft's own site chrome, not a PublicPress layout that doesn't
  // exist yet).
  spacing: [
    { name: 'xs', value: '0.5rem', provisional: true },
    { name: 'sm', value: '1rem', provisional: true },
    { name: 'md', value: '1.5rem', provisional: true },
    { name: 'lg', value: '2rem', provisional: true },
    { name: 'xl', value: '3rem', provisional: true },
    { name: '2xl', value: '4rem', provisional: true },
  ],

  // No radius is ruled for PublicPress. Provisional reuse of branchLeft's
  // single pill value — the only radius that exists anywhere in either
  // brand's sources.
  radius: [{ name: 'pill', value: '9999px', provisional: true }],

  // No shadow system exists for either brand's sources — omitted rather
  // than invented (see branchLeftTokens.ts).

  // No motion system is ruled for PublicPress specifically.
  motion: {
    duration: [
      { name: 'fast', value: '150ms', provisional: true },
      { name: 'base', value: '200ms', provisional: true },
      { name: 'slow', value: '300ms', provisional: true },
      { name: 'deliberate', value: '500ms', provisional: true },
    ],
    easing: [
      { name: 'standard', value: 'ease', provisional: true },
      { name: 'out', value: 'ease-out', provisional: true },
    ],
  },
};
