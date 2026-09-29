# @branchleft/brand-branchleft

## 0.3.0

### Minor Changes

- 0f96db6: Fix the stylesheet cascade against a real Tailwind v4 consumer: element defaults (font-size, colour) no longer sit on bare `p`/`ul`/`ol`/`li`/`dl`/`table`/`label`/`blockquote`, so a consumer's own ancestor-based sizing/colouring inherits correctly again (label keeps its owner-accepted `font-weight: 500`); `html`/`body` line-height is 1.5, matching Tailwind's own default, while `p`/`ul`/`ol`/`li`/`dl` keep the site's own 1.6. Class-based rules (`.bl-wordmark`, `.bl-wordmark--hero`, `.bl-form-error`) now live in their own `branchleft-components` layer, registered after `branchleft-base` — flat, hyphenated names, not dotted: a dotted name is CSS Cascade Layers syntax for a sub-layer, which cannot be independently reordered against Tailwind's own layers, and a real Tailwind v4 build in a real browser confirmed dotted names could never satisfy the requirement. See the README's "Layer order" section for the recommended order and how it's verified. Each shipped font's SIL OFL 1.1 licence text now ships alongside its `dist/fonts/<Family>/*.woff2`.

  `ThemeToggle`'s API is now cookie-backed and works with JavaScript disabled, in both directions: it takes the theme already in effect as a required `theme` prop (the consumer computes this once with `parseThemeCookie` and passes the same value to both the server and client render, so there's no hydration mismatch), and renders a real `<form method="post" action={action}>` around an icon-only submit button whose value is always the OPPOSITE of `theme`. The consumer's server reads the submitted `theme` field, sets `THEME_COOKIE_NAME`, and renders `<html data-theme>` from it via the new `parseThemeCookie` (which also accepts an RFC 6265 quoted cookie value). With JavaScript, the same submit is intercepted for an instant client-side switch. `aria-pressed` is removed in favour of an accessible name that states the action directly ("Switch to light mode" / "Switch to dark mode"), both overridable via `switchToLightLabel`/`switchToDarkLabel`. `THEME_STORAGE_KEY`, `themeInitScript` and `themeInitScriptHash` remain as an optional fallback for a static app with no server.

  This is a breaking change to `ThemeToggle`'s props (`label` is replaced by `theme` (required), `action` (required) and the two label props) — acceptable under 0.x semver, called out here as a minor bump per this package's own convention.

### Patch Changes

- 40142fb: Cap the Syne `@font-face`'s own variable weight range at 400–500 (`fonts.css`). 500 is the weight the branchLeft wordmark itself uses (`--bl-weight-wordmark`), and Syne reads as a visibly wider letterform above it. `branchLeftTokens.ts`'s `type.faces.wordmark.weights` is trimmed to match (`[400, 500]`), so the type docs no longer show a heavier Syne than the stylesheet loads.

  The `hero-wordmark` type-scale step (`3.75rem / 1`, the website title-page wordmark size, already backed by the stylesheet's `--bl-text-wordmark-hero`/`--bl-leading-wordmark-hero` tokens) and the `brand` colour (`#b31761`, both modes) are no longer flagged provisional. The light-mode `brandAccent` is the owner-ruled `#d6005c`.

## 0.2.0

### Minor Changes

- d0ba794: Add the branchLeft stylesheet (`@branchleft/brand-branchleft/css`, built to `dist/branchleft.css`): dark-default/light-toggle colour modes, the ValuesColours palette, and full HTML element defaults in a `branchleft.base` cascade layer.
- 59379c5: Add the wordmark: `.bl-wordmark` (Syne at weight 500, inheriting the surrounding size) and `.bl-wordmark--hero` (3.75rem, line-height 1), with `--bl-weight-wordmark`, `--bl-text-wordmark-hero` and `--bl-leading-wordmark-hero`.

## 0.1.0

### Minor Changes

- Split the single `@branchleft/components` package into three: `@branchleft/components` keeps the brand-neutral components, hooks and the shared `DesignTokens` types; `@branchleft/brand-branchleft` carries `Logo` and `branchLeftTokens`; `@branchleft/brand-publicpress` carries the PublicPress marks, geometry and tokens.

  Moving `Logo`, the PublicPress exports and the brand token sets out of `@branchleft/components` is a breaking change for anything importing them from there — see the README for the new import paths.

### Patch Changes

- Updated dependencies
  - @branchleft/components@0.4.0
