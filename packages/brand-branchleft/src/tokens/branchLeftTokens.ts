import type { DesignTokens } from '@branchleft/components';

/**
 * branchLeft design tokens, extracted from the website repo's live styling
 * source of truth:
 *   - `website/app/styles/theme.css` (the imported, active entry point —
 *     see its own header comment; `website/app/app.css` imports it)
 *   - `website/app/styles/fonts.css` (@font-face weight ranges)
 *   - `website/app/styles/primitives.css` (spacing/radius/motion as used by
 *     shared component classes)
 *   - `website/brand/README.md` (logo/wordmark source assets, no token
 *     values)
 *
 * `website/app/theme.css` (no `styles/` segment) is a stale, unimported
 * leftover from the initial release (last touched pre-#41; nothing in
 * `app.css`/`root.tsx` references it) and is NOT a source here.
 *
 * Every non-provisional value below is a literal copy of a value written in
 * one of those files. See the top of each provisional entry for why it
 * isn't settled, and the PR body's "Open questions for the brand owner"
 * for the full list.
 */
export const branchLeftTokens: DesignTokens = {
  brand: 'branchLeft',

  colour: {
    // theme.css: `--color-bg: #000000` / `--color-fg: #ffffff`. The site is
    // dark-only (`color-scheme: dark` in @layer base) — no light variant is
    // written anywhere, so `light` here is a naive inversion, not a ruling.
    background: { dark: '#000000', light: '#ffffff', provisional: true },
    foreground: { dark: '#ffffff', light: '#000000', provisional: true },

    // theme.css: `--color-brand: #b31761`. Same "no light mode" caveat as
    // background/foreground — the hex itself is sourced, but using it
    // unchanged against a light background is unverified.
    brand: { dark: '#b31761', light: '#b31761', provisional: true },
    // theme.css: `--color-brand-bright: #ff006e`.
    brandAccent: { dark: '#ff006e', light: '#ff006e', provisional: true },

    // theme.css: `--colour-fg-muted: color-mix(in srgb, var(--color-fg) 75%, var(--color-bg))`.
    // Stored as the literal CSS expression, resolved for the dark values
    // above; no light-theme equivalent is written.
    muted: {
      dark: 'color-mix(in srgb, #ffffff 75%, #000000)',
      light: 'color-mix(in srgb, #000000 75%, #ffffff)',
      provisional: true,
    },
    // theme.css: `--color-hairline: color-mix(in srgb, var(--color-fg) 12%, transparent)`.
    hairline: {
      dark: 'color-mix(in srgb, #ffffff 12%, transparent)',
      light: 'color-mix(in srgb, #000000 12%, transparent)',
      provisional: true,
    },
  },

  type: {
    faces: {
      // theme.css: `--font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif`.
      // fonts.css @font-face: variable weight range 300–700.
      display: {
        family: 'Space Grotesk',
        fallbackStack: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
        weights: [300, 400, 500, 600, 700],
        source:
          'Self-hosted variable font (website /fonts/SpaceGrotesk/*.woff2+.ttf); Google Fonts family "Space Grotesk"',
      },
      // theme.css: `--font-wordmark: 'Syne', ...`. fonts.css: variable 400–800.
      wordmark: {
        family: 'Syne',
        fallbackStack: "'Syne', ui-sans-serif, system-ui, sans-serif",
        weights: [400, 500, 600, 700, 800],
        source:
          'Self-hosted variable font (website /fonts/Syne/*.woff2+.ttf); Google Fonts family "Syne"',
      },
      // theme.css: `--font-sans: 'IBM Plex Sans', ...`. fonts.css: static
      // weights 400 (+ italic), 500, 600 only — "only the weights we
      // actually use are loaded" per that file's own comment.
      body: {
        family: 'IBM Plex Sans',
        fallbackStack: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
        weights: [400, 500, 600],
        source:
          'Self-hosted static subset (website /fonts/IBMPlexSans/*.woff2+.ttf); Google Fonts family "IBM Plex Sans"',
      },
      // theme.css: `--font-mono: 'Roboto Mono', ...`. fonts.css: variable
      // 100–700, normal + italic.
      mono: {
        family: 'Roboto Mono',
        fallbackStack: "'Roboto Mono', ui-monospace, monospace",
        weights: [100, 200, 300, 400, 500, 600, 700],
        source:
          'Self-hosted variable font (website /fonts/RobotoMono/*.woff2+.ttf); Google Fonts family "Roboto Mono"',
      },
    },
    // theme.css's @layer base applies Tailwind utilities (`text-4xl` …
    // `text-base`) to h1–h6, with no font-size override anywhere in @theme
    // — so these are Tailwind v4's own built-in default scale for those
    // utility class names (confirmed: website/package.json pins
    // `tailwindcss: ^4.3.3`, and no tailwind config file exists — Tailwind
    // v4 is configured entirely via the `@theme` block already read, which
    // only touches colour/font/spacing tokens, not font-size). The pixel
    // values themselves are not written literally anywhere in this repo,
    // only inferred from the Tailwind version — marked provisional on that
    // basis. `body`/`li` line-height 1.6 is a literal from base.css's
    // `p`/`li` rules.
    scale: [
      { name: 'h1', fontSize: '2.25rem', lineHeight: '2.5rem', provisional: true },
      { name: 'h2', fontSize: '1.875rem', lineHeight: '2.25rem', provisional: true },
      { name: 'h3', fontSize: '1.5rem', lineHeight: '2rem', provisional: true },
      { name: 'h4', fontSize: '1.25rem', lineHeight: '1.75rem', provisional: true },
      { name: 'h5', fontSize: '1.125rem', lineHeight: '1.75rem', provisional: true },
      { name: 'h6', fontSize: '1rem', lineHeight: '1.5rem', provisional: true },
      { name: 'body', fontSize: '1rem', lineHeight: '1.6' },
      { name: 'small', fontSize: '0.875rem', lineHeight: '1.25rem', provisional: true },
      // hero-wordmark: `@apply text-6xl` with an explicit `line-height: 1` override.
      { name: 'hero-wordmark', fontSize: '3.75rem', lineHeight: '1', provisional: true },
    ],
  },

  // theme.css: `--nav-offset: 3.5rem` and `--section-scroll-offset: calc(var(--nav-offset) + 3rem)`
  // are literal named tokens. The rest are Tailwind spacing-scale utility
  // values (`gap-12`→3rem, `p-8`→2rem, `gap-6`→1.5rem, `px-6`→1.5rem,
  // `py-16`→4rem) seen in primitives.css/theme.css — same "Tailwind default,
  // not written as a literal number" caveat as the type scale above.
  spacing: [
    { name: 'nav-offset', value: '3.5rem' },
    { name: 'section-scroll-offset', value: 'calc(3.5rem + 3rem)' },
    { name: 'xs', value: '0.5rem', provisional: true },
    { name: 'sm', value: '1rem', provisional: true },
    { name: 'md', value: '1.5rem', provisional: true },
    { name: 'lg', value: '2rem', provisional: true },
    { name: 'xl', value: '3rem', provisional: true },
    { name: '2xl', value: '4rem', provisional: true },
  ],

  // The only radius value used anywhere in the site's CSS is the pill
  // (site-nav and site-footer rules both use `border-radius: 9999px`) — no
  // smaller/medium step exists in any source.
  radius: [{ name: 'pill', value: '9999px' }],

  // No `box-shadow`/`drop-shadow` usage exists anywhere in the website's
  // styles — the site has no shadow system today, so this key is omitted
  // rather than invented.

  // Durations/easings actually used across primitives.css and the shipped
  // component CSS (AccordionItem.css, PageTransition.tsx). `prefers-reduced-motion`
  // is respected (usePrefersReducedMotion hook; `@media (prefers-reduced-motion: reduce)`
  // in AccordionItem.css) but that's a behaviour, not a token value, so it's
  // not represented here.
  motion: {
    duration: [
      { name: 'fast', value: '150ms' },
      { name: 'base', value: '200ms' },
      { name: 'slow', value: '300ms' },
      { name: 'deliberate', value: '500ms' },
    ],
    easing: [
      { name: 'standard', value: 'ease' },
      { name: 'out', value: 'ease-out' },
    ],
  },
};
