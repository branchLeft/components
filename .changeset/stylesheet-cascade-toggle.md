---
'@branchleft/brand-branchleft': minor
'@branchleft/components': minor
---

Fix the stylesheet cascade against a real Tailwind v4 consumer: element defaults (font-size, colour) no longer sit on bare `p`/`ul`/`ol`/`li`/`dl`, so a consumer's own ancestor-based sizing/colouring inherits correctly again; `html`/`body` line-height is 1.5, matching Tailwind's own default. Class-based rules (`.bl-wordmark`, `.bl-wordmark--hero`, `.bl-form-error`) now live in their own `branchleft.components` layer, registered after `branchleft.base`, so a component class beats a same-element generic rule regardless of which layer that rule lives in — see the README's "Layer order" section for the recommended order in a Tailwind v4 app. Each shipped font's SIL OFL 1.1 licence text now ships alongside its `dist/fonts/<Family>/*.woff2`.

`ThemeToggle`'s API is now cookie-backed and works with JavaScript disabled: it renders a real `<form method="post" action={action}>` around an icon-only submit button, and the consumer's server is responsible for reading the submitted `theme` field, setting `THEME_COOKIE_NAME`, and rendering `<html data-theme>` from it via the new `parseThemeCookie`. With JavaScript, the same submit is intercepted for an instant client-side switch. `aria-pressed` is removed in favour of an accessible name that states the action directly ("Switch to light mode" / "Switch to dark mode"), both overridable via `switchToLightLabel`/`switchToDarkLabel`. `THEME_STORAGE_KEY`, `themeInitScript` and `themeInitScriptHash` remain as an optional fallback for a static app with no server.

This is a breaking change to `ThemeToggle`'s props (`label` is replaced by `action` (now required) and the two label props) — acceptable under 0.x semver, called out here as a minor bump per this package's own convention.
