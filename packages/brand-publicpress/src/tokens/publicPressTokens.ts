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
 * PublicPress design tokens.
 *
 * Unlike branchLeft, PublicPress has no settled site-wide theme yet — the
 * brand owner's brand sketch (referenced in workspace#1436) is in progress
 * and not final, and a search of `ghost-platform-docs` (the
 * `19-try-it-now-design/*` documents and `OPEN-QUESTIONS.md`) turns up
 * product-name/domain rulings (D10: the name "PublicPress",
 * `publicpress.co.uk`) but no colour, type, spacing, radius, shadow or
 * motion decisions.
 *
 * The only settled PublicPress *visual* ruling that exists anywhere is the
 * wordmark/logo mark itself, from `components` PR #92, built against the
 * owner ruling on workspace#1313: the reversed-pilcrow "P" glyph, in Libre
 * Franklin Bold, knocked out of one of four fixed ink blocks
 * (`scripts/publicpress-mark-spec.json`, `inks`). That PR's own body is
 * explicit that "every colour, the glyph outline, and the block geometry
 * are the design ruling" — so those four inks and Libre Franklin Bold are
 * the only non-provisional entries below. Everything else is a placeholder,
 * mostly borrowed from branchLeft's tokens so the shared structure has
 * *something* to hold, and is marked provisional.
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

    // The primary ("blue") ink — settled, PR #92 / workspace#1313 ruling,
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
  },

  type: {
    faces: {
      // No display typeface is ruled for PublicPress product UI (marketing
      // site, portal). Provisionally reusing branchLeft's until the brand
      // owner's brand sketch settles one.
      display: {
        family: 'Space Grotesk',
        fallbackStack: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
        weights: [300, 400, 500, 600, 700],
        source: "Not ruled for PublicPress — provisional reuse of branchLeft's display face",
        provisional: true,
      },
      // Settled: the wordmark/logo glyph outlines are Libre Franklin Bold
      // (SIL OFL 1.1), vectorised into static SVG paths — see PR #92's
      // README addition and scripts/publicpress-mark-spec.json's `note`
      // field. Only weight 700 (Bold) is used; no web font is loaded by the
      // components (the outlines are pre-baked paths), so `source` names
      // the origin typeface rather than a font file the app loads.
      wordmark: {
        family: 'Libre Franklin',
        fallbackStack: "'Libre Franklin', ui-sans-serif, system-ui, sans-serif",
        weights: [700],
        source:
          'Google Fonts family "Libre Franklin" (SIL OFL 1.1) — glyph outlines only, vectorised into SVG path data in PublicPressWordmark/PublicPressLogo; no web font file is loaded at runtime',
      },
      // No body/reading typeface is ruled. Provisional reuse of
      // branchLeft's.
      body: {
        family: 'IBM Plex Sans',
        fallbackStack: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
        weights: [400, 500, 600],
        source: "Not ruled for PublicPress — provisional reuse of branchLeft's body face",
        provisional: true,
      },
      // No mono/label typeface is ruled. Provisional reuse of branchLeft's.
      mono: {
        family: 'Roboto Mono',
        fallbackStack: "'Roboto Mono', ui-monospace, monospace",
        weights: [100, 200, 300, 400, 500, 600, 700],
        source: "Not ruled for PublicPress — provisional reuse of branchLeft's mono face",
        provisional: true,
      },
    },
    // No type scale exists for PublicPress. Provisional reuse of
    // branchLeft's scale wholesale.
    scale: [
      { name: 'h1', fontSize: '2.25rem', lineHeight: '2.5rem', provisional: true },
      { name: 'h2', fontSize: '1.875rem', lineHeight: '2.25rem', provisional: true },
      { name: 'h3', fontSize: '1.5rem', lineHeight: '2rem', provisional: true },
      { name: 'h4', fontSize: '1.25rem', lineHeight: '1.75rem', provisional: true },
      { name: 'h5', fontSize: '1.125rem', lineHeight: '1.75rem', provisional: true },
      { name: 'h6', fontSize: '1rem', lineHeight: '1.5rem', provisional: true },
      { name: 'body', fontSize: '1rem', lineHeight: '1.6', provisional: true },
      { name: 'small', fontSize: '0.875rem', lineHeight: '1.25rem', provisional: true },
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
