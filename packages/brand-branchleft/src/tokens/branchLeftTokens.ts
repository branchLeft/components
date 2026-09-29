import type { DesignTokens } from '@branchleft/components';

/**
 * branchLeft design tokens, extracted from the website repo's live styling
 * source of truth: `website/app/styles/theme.css` (imported by `app.css`),
 * `fonts.css` (@font-face weight ranges), `primitives.css`
 * (spacing/radius/motion) and `website/brand/README.md` (source assets,
 * no values), plus this package's own settled, tested stylesheet
 * (`styles/tokens.css`) where a colour has since been ruled beyond that
 * initial extraction. `website/app/theme.css` — no `styles/` segment — is
 * a stale, unimported pre-#41 leftover and NOT a source here. Every
 * non-provisional value is a literal copy from one of those files; see
 * `branchLeftTokens.test.ts`'s stylesheet-comparison test, which is what
 * actually keeps this honest against `styles/tokens.css` rather than a
 * hand-checked comment.
 */
export const branchLeftTokens: DesignTokens = {
  brand: 'branchLeft',

  colour: {
    // Ruled, both modes — `styles/tokens.css`'s `--bl-color-bg`/`--bl-color-fg`
    // (dark, the default `:root` block, and light, `:root[data-theme='light']`).
    background: { dark: '#000000', light: '#ffffff' },
    foreground: { dark: '#ffffff', light: '#000000' },

    // The stylesheet's `--bl-color-button-fill`, the same value in both
    // modes (white text on it clears 4.5:1 in either).
    brand: { dark: '#b31761', light: '#b31761' },
    // Ruled, both modes — `styles/tokens.css`'s `--bl-color-active`: dark
    // unchanged (`#ff006e`, 5.48:1 on `--bl-color-bg`); light is the
    // owner's deeper ruling (`#d6005c`, 5.23:1 — `#ff006e` alone is only
    // 3.83:1 on white).
    brandAccent: { dark: '#ff006e', light: '#d6005c' },

    // Ruled, both modes — `styles/tokens.css`'s `--bl-color-muted`,
    // resolved to the literal hex the contrast test checks (the source
    // `color-mix()` expression evaluates to the same value).
    muted: { dark: '#bfbfbf', light: '#404040' },
    // Ruled, both modes — `styles/tokens.css`'s `--bl-color-hairline`.
    // Decorative only (dividers, card outlines) — never a boundary that
    // must be seen; see that file's own comment.
    hairline: { dark: 'rgba(255, 255, 255, 0.12)', light: 'rgba(0, 0, 0, 0.12)' },
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
      // theme.css: `--font-wordmark: 'Syne', ...`. fonts.css caps the loaded
      // face's own variable range at 400–500 — the wordmark itself
      // (`--bl-weight-wordmark`) never asks for more, and Syne reads as a
      // visibly different, wider letterform above 500.
      wordmark: {
        family: 'Syne',
        fallbackStack: "'Syne', ui-sans-serif, system-ui, sans-serif",
        weights: [400, 500],
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
    // — Tailwind v4's own built-in scale for those class names (confirmed:
    // website/package.json pins `tailwindcss: ^4.3.3`, no tailwind config
    // file — `@theme` only touches colour/font/spacing). Pixel values are
    // inferred from the Tailwind version, not written literally anywhere
    // here — marked provisional on that basis. `body`/`li` 1.6 is literal,
    // from base.css's `p`/`li` rules.
    // Owner ruling settles h1-h6 and `small` (previously flagged
    // provisional pending confirmation the inferred Tailwind pixel values
    // were acceptable as real sizes, not just a placeholder guess).
    scale: [
      { name: 'h1', fontSize: '2.25rem', lineHeight: '2.5rem' },
      { name: 'h2', fontSize: '1.875rem', lineHeight: '2.25rem' },
      { name: 'h3', fontSize: '1.5rem', lineHeight: '2rem' },
      { name: 'h4', fontSize: '1.25rem', lineHeight: '1.75rem' },
      { name: 'h5', fontSize: '1.125rem', lineHeight: '1.75rem' },
      { name: 'h6', fontSize: '1rem', lineHeight: '1.5rem' },
      { name: 'body', fontSize: '1rem', lineHeight: '1.6' },
      { name: 'small', fontSize: '0.875rem', lineHeight: '1.25rem' },
      // The website title-page wordmark size — `@apply text-6xl` with an
      // explicit `line-height: 1` override, settled from the live site
      // (`--bl-text-wordmark-hero`/`--bl-leading-wordmark-hero` in this
      // package's own stylesheet, `styles/tokens.css`). Not a generic
      // heading step: it's the one size used for the brand name itself on
      // the site's title page.
      { name: 'hero-wordmark', fontSize: '3.75rem', lineHeight: '1' },
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
