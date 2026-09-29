# @branchleft/components

## 0.6.0

### Minor Changes

- 40142fb: Add an optional `active` colour to the shared `ColourTokens` type, so a brand that has ruled a distinct active/accent colour (see `@branchleft/brand-publicpress`) can express it without a one-off, brand-specific key. Additive only — no existing brand's token set is required to define it.
- 0f96db6: Fix the stylesheet cascade against a real Tailwind v4 consumer: element defaults (font-size, colour) no longer sit on bare `p`/`ul`/`ol`/`li`/`dl`/`table`/`label`/`blockquote`, so a consumer's own ancestor-based sizing/colouring inherits correctly again (label keeps its owner-accepted `font-weight: 500`); `html`/`body` line-height is 1.5, matching Tailwind's own default, while `p`/`ul`/`ol`/`li`/`dl` keep the site's own 1.6. Class-based rules (`.bl-wordmark`, `.bl-wordmark--hero`, `.bl-form-error`) now live in their own `branchleft-components` layer, registered after `branchleft-base` — flat, hyphenated names, not dotted: a dotted name is CSS Cascade Layers syntax for a sub-layer, which cannot be independently reordered against Tailwind's own layers, and a real Tailwind v4 build in a real browser confirmed dotted names could never satisfy the requirement. See the README's "Layer order" section for the recommended order and how it's verified. Each shipped font's SIL OFL 1.1 licence text now ships alongside its `dist/fonts/<Family>/*.woff2`.

  `ThemeToggle`'s API is now cookie-backed and works with JavaScript disabled, in both directions: it takes the theme already in effect as a required `theme` prop (the consumer computes this once with `parseThemeCookie` and passes the same value to both the server and client render, so there's no hydration mismatch), and renders a real `<form method="post" action={action}>` around an icon-only submit button whose value is always the OPPOSITE of `theme`. The consumer's server reads the submitted `theme` field, sets `THEME_COOKIE_NAME`, and renders `<html data-theme>` from it via the new `parseThemeCookie` (which also accepts an RFC 6265 quoted cookie value). With JavaScript, the same submit is intercepted for an instant client-side switch. `aria-pressed` is removed in favour of an accessible name that states the action directly ("Switch to light mode" / "Switch to dark mode"), both overridable via `switchToLightLabel`/`switchToDarkLabel`. `THEME_STORAGE_KEY`, `themeInitScript` and `themeInitScriptHash` remain as an optional fallback for a static app with no server.

  An optional `returnTo` prop adds a hidden `return` field to that form, so the consumer's server can send the reader back to the page they were on. New export `safeReturnPath(value, origin)` validates that field (or a `Referer`) before it becomes a redirect: it returns a same-origin `pathname + search + hash`, and `'/'` for anything missing, off-origin, non-HTTP(S), over 2048 characters, containing a backslash or control character, or that would be protocol-relative (`//host`).

  This is a breaking change to `ThemeToggle`'s props (`label` is replaced by `theme` (required), `action` (required) and the two label props) — acceptable under 0.x semver, called out here as a minor bump per this package's own convention.

## 0.5.0

### Minor Changes

- d0ba794: Add `ThemeToggle`, a brand-neutral component that switches `data-theme` between dark and light on `<html>` and persists the choice, plus `themeInitScript` for flash-free SSR.

## 0.4.0

### Minor Changes

- Split the single `@branchleft/components` package into three: `@branchleft/components` keeps the brand-neutral components, hooks and the shared `DesignTokens` types; `@branchleft/brand-branchleft` carries `Logo` and `branchLeftTokens`; `@branchleft/brand-publicpress` carries the PublicPress marks, geometry and tokens.

  Moving `Logo`, the PublicPress exports and the brand token sets out of `@branchleft/components` is a breaking change for anything importing them from there — see the README for the new import paths.
