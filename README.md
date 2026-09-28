# branchLeft components

A pnpm workspace publishing three packages to [GitHub Packages](https://github.com/branchLeft/components/packages) under the `@branchleft` scope:

- **[`@branchleft/components`](packages/components)** — brand-neutral React components and hooks, plus the shared `DesignTokens` types. No brand's marks, colours or fonts live here — any consumer can theme it.
- **[`@branchleft/brand-branchleft`](packages/brand-branchleft)** — the branchLeft `Logo` and `branchLeftTokens`.
- **[`@branchleft/brand-publicpress`](packages/brand-publicpress)** — the PublicPress wordmark/logo, their geometry, and `publicPressTokens`.

## Install

```sh
# One-time: point the @branchleft scope at GitHub Packages and provide a token
# with `read:packages` scope in your user-level ~/.npmrc:
#   @branchleft:registry=https://npm.pkg.github.com
#   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT

pnpm add @branchleft/components
pnpm add @branchleft/brand-branchleft   # if you use the branchLeft mark/tokens
pnpm add @branchleft/brand-publicpress  # if you use the PublicPress mark/tokens
```

Peer deps (each package): `react` and `react-dom` >= 18.

## Usage

```tsx
import { SectionHeading } from '@branchleft/components';
import { Logo } from '@branchleft/brand-branchleft';

export function Example() {
  return (
    <>
      <Logo mainColor={{ type: 'branded' }} width={128} height={128} />
      <SectionHeading as="h2" anchor="values">
        Values
      </SectionHeading>
    </>
  );
}
```

### Migrating from the single-package `@branchleft/components`

Before this split, `Logo`, the PublicPress exports and both brands' token sets were all exported from `@branchleft/components` itself. They've moved:

| Was (`@branchleft/components`)                                                                              | Now                                        |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `Logo`, `LogoColor`, `LogoBackground`, `LogoProps`                                                          | `@branchleft/brand-branchleft`             |
| `branchLeftTokens`                                                                                          | `@branchleft/brand-branchleft`             |
| `PublicPressWordmark`, `PublicPressWordmarkProps`                                                           | `@branchleft/brand-publicpress`            |
| `PublicPressLogo`, `PublicPressLogoProps`, `PublicPressColor`                                               | `@branchleft/brand-publicpress`            |
| `publicPressTokens`, `publicPressInks`                                                                      | `@branchleft/brand-publicpress`            |
| `AccordionItem`, `SectionHeading`, `SectionNav`, `PageTransition`, `ValuesCloud`, `usePrefersReducedMotion` | unchanged — still `@branchleft/components` |
| `DesignTokens` and the other shared token types                                                             | unchanged — still `@branchleft/components` |

Update the import path for anything in the left column, and add the relevant brand package to your `package.json`. Nothing about the components' own props or behaviour changed — only which package exports them.

Most components ship **no CSS** by default. They expose stable class-name
hooks (`bl-section-heading`, `bl-section-heading--linked`,
`bl-section-heading__link`, `bl-section-heading__icon`) so consumers can
theme them however they like.

A few components ship real, structural CSS — layout too fiddly to reasonably
ask every consumer to reimplement (`ValuesCloud`'s ring geometry,
`AccordionItem`'s reveal animation and the browser-default overrides it
needs) or a single spacing rule that's easy to miss and not really a
themeable decision (`SectionHeading`'s icon/text gap). That CSS lives behind
a separate entry point on `@branchleft/components` — import it once, anywhere
in your app, if you use any such component:

```tsx
import '@branchleft/components/css';
```

That stylesheet only handles layout/positioning/spacing; colours and fonts
read from `--bl-*` custom properties (with built-in fallbacks) so it stays
themable — see each component's Storybook docs for the full list of
customisable properties.

## branchLeft stylesheet and theme toggle

`@branchleft/brand-branchleft/css` is a complete, opt-in stylesheet for any
new branchLeft-branded app — dark-default/light-toggle colour modes, the
ValuesColours palette, and an explicit default for every HTML element it
covers:

```tsx
import '@branchleft/brand-branchleft/css';
```

It declares itself across two cascade layers, in this order:

```css
@layer branchleft-base, branchleft-components;
```

**Flat, hyphenated names — never dotted.** A dotted name like
`branchleft.base` is CSS Cascade Layers syntax for a SUB-layer (`base`)
nested inside a single parent layer (`branchleft`) — the parent's position
among its top-level siblings is fixed by the parent name's own first
appearance, and no top-level order statement can independently interleave
its children among other top-level layers. An earlier version of this
package used dotted names, and no achievable layer order made a component
class beat a same-priority site element rule while also losing to it
elsewhere, as required below — confirmed by building this exact stylesheet
into a real Tailwind v4 app and checking computed styles in a real
browser: see "Verifying this" below.

- **`branchleft-base`** — plain-element defaults (`html`, `body`, `h1`–`h6`,
  `p`, `table`, form controls, …). Deliberately the LOWER-priority of the
  two, so a consuming app's own element rules can outrank it just by
  living in a later-registered layer — no `!important`, no specificity
  fights.
- **`branchleft-components`** — this package's class-based rules
  (`.bl-wordmark`, `.bl-wordmark--hero`, `.bl-form-error`). Deliberately
  HIGHER than `branchleft-base`: a component class must beat a same-element
  generic rule regardless of which layer that generic rule lives in (e.g.
  a consuming app's own `h1` default competing with `.bl-wordmark--hero` on
  the same `<h1>`), and cascade layers — not selector specificity — are
  what decide that once both target the same element.

### Layer order in a Tailwind v4 app

`@import 'tailwindcss'` itself expands to
`@layer theme, base, components, utilities;` before pulling in Tailwind's
own rules for each. Slot this package's two layers around those so that
**the site's own element rules beat `branchleft-base`, while
`branchleft-components` beats the site's element rules**:

```css
@layer theme, branchleft-base, base, branchleft-components, components, utilities;
```

Cascade-layer priority is order of FIRST APPEARANCE in a layer-order
statement — later-listed layers always win over earlier ones, regardless
of selector specificity, and an unlayered rule always beats every named
layer regardless of where it sits. Reading the list above in priority
order (lowest to highest):

1. `theme` (Tailwind's own token layer) — nothing here should ever need to
   win against anything.
2. `branchleft-base` — this package's element defaults.
3. `base` (Tailwind's preflight, plus wherever the site wraps its own
   element defaults in `@layer base`, matching Tailwind's own name) — beats
   `branchleft-base`, so the site's own choice for e.g. `h1` always wins
   over this package's.
4. `branchleft-components` — beats both `base` layers above, so
   `.bl-wordmark--hero` on an `<h1>` wins even though the site's own `h1`
   rule sits in `base`. This is the fix for the defect where the class lost
   to the element rule purely because both were registered in the same
   (lowest) priority layer.
5. `components` (the site's own component classes, in `@layer components`)
   — beats `branchleft-components`, so a same-named or overlapping site
   class still wins if one is ever written.
6. `utilities` (Tailwind's utility classes) — highest, as in any ordinary
   Tailwind app: a `text-*`/`font-*` utility on an element still beats
   every layer below it.

**This order must be declared explicitly — there is no working import-order
fallback.** A plain `@import` sequence cannot interleave this package's two
layers between Tailwind's four: whichever side imports first, its layers
register as a contiguous block, either entirely below or entirely above
the other side's, never split across it. Measured directly: importing this
package's stylesheet before `@import 'tailwindcss'`, with no explicit
`@layer` statement, put BOTH of this package's layers above `utilities` —
the opposite of layer 2's requirement, and a bare `h1` then read this
package's font instead of the site's. If your bundler's CSS pipeline
doesn't reliably preserve an explicit multi-name `@layer` statement across
its own concatenation pass (this repo hit exactly that with an unrelated
unlayered override file, historically), treat that as a bundler defect to
fix, or as a reason to leave this package's own component classes (`.bl-
wordmark`, etc.) unlayered in your build instead of relying on this order
— not a reason to fall back to import order, which does not achieve it.

### Verifying this

Layer-priority claims in this file are checked against a real build, not
asserted from the spec text alone: `packages/brand-branchleft/src/styles/
branchleft.layers.test.ts` asserts the built CSS uses flat (undotted)
layer names and that every class-based rule lives in the higher-priority
one. Proving the FULL claim — that a real Tailwind v4 app's own `h1` rule
beats this package's element default, while this package's component class
still beats that same `h1` rule — needs a real Tailwind compile and a real
browser's computed styles; CSS Cascade Layers priority is not something
jsdom or a text-only test can evaluate correctly. This package has no
existing browser-test toolchain and this repo's CI has no sibling app to
build against, so that full proof is a manual, documented script rather
than a CI gate — see `packages/brand-branchleft/scripts/verify-layer-order.mjs`
and its own header comment for how to run it (it needs a Tailwind v4
install and a Chromium binary, e.g. via a sibling `website/` checkout's
`node_modules`, exactly as used to produce the measurements in this
package's PR history).

Fonts (Space Grotesk, Syne, IBM Plex Sans, Roboto Mono) ship as their own
`dist/fonts/*.woff2` files, referenced by the stylesheet's own `@font-face`
rules — nothing is base64-inlined, so an unrelated colour/spacing change
never forces a re-download of unchanged font bytes. If you need to reach a
font file directly (e.g. `<link rel="preload">`), it's reachable via the
package's `./fonts/*` export subpath. Every family is SIL Open Font License
1.1 — each family's own `OFL.txt` licence text ships alongside its
`dist/fonts/<Family>/*.woff2`, separately from this package's own `MIT`
`license` field in `package.json`, which covers only its code.

### Theme toggle

Dark is the brand default; light is opt-in via `data-theme="light"` on
`<html>`. `@branchleft/components`'s `ThemeToggle` renders that switch as a
real `<form>` around an icon button, so it works with JavaScript disabled.
It takes the theme ALREADY in effect as a required `theme` prop — your
server computes this once with `parseThemeCookie` and the same value must
reach both the server render and the client's first render, so there is
nothing for either side to guess and no hydration mismatch:

```tsx
import { ThemeToggle } from '@branchleft/components';

<ThemeToggle theme={theme} action="/theme" />;
```

**Without JavaScript**, clicking the button submits the form to `action`
with `theme=<the mode to switch TO>` — your server reads that field, stores
it under `THEME_COOKIE_NAME`, and redirects back to the page with
`<html data-theme>` already set to match (via `parseThemeCookie` against
the incoming request's `Cookie` header). Keep the redirect target safe: a
form with no return path can only fall back to `Referer`, which a
cross-site page can forge, so redirect only to a same-origin relative
path you've validated — never trust an absolute URL from the request:

```tsx
import { THEME_COOKIE_NAME, parseThemeCookie } from '@branchleft/components';

// In your server's request handler, e.g. a POST /theme route:
const body = new URLSearchParams(await request.text());
const theme = body.get('theme') === 'light' ? 'light' : 'dark';
const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
const cookie = `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;

// A same-origin PATH only — never an absolute URL (open-redirect risk).
// Reject anything not starting with exactly one `/` (so neither `//evil.com`,
// a protocol-relative URL, nor `/\evil.com`, which some browsers still treat
// as `//`, can redirect off-site), falling back to `/`.
const returnTo = body.get('return') ?? '';
const safeReturnTo = /^\/(?!\/|\\)/.test(returnTo) ? returnTo : '/';
// set-cookie: <cookie>, then redirect (303) to safeReturnTo

// And on every request, when rendering <html>:
const theme = parseThemeCookie(request.headers.get('cookie'));
// <html lang="en" data-theme={theme === 'light' ? 'light' : undefined}>
```

**With JavaScript**, `ThemeToggle` intercepts that same submit,
`preventDefault`s the navigation, sets `data-theme` on `<html>` immediately,
and writes the same cookie itself via `document.cookie` (`Path=/`,
`SameSite=Lax`, a one-year `Max-Age`, plus `Secure` only when the page
itself is https — the same rule as the server snippet above, since an
unconditional `Secure` is silently rejected on a plain-http origin) — so
the switch feels instant, landing on the exact same state either way.
After that first render, it tracks its own state independently of the
`theme` prop.

The button is icon-only (a sun in dark mode, a moon in light mode, via
`lucide-react`) with no `aria-pressed` — its accessible name states the
action directly ("Switch to light mode" / "Switch to dark mode"), which a
static pressed/unpressed state can't convey on its own. Override either
string:

```tsx
<ThemeToggle
  theme={theme}
  action="/theme"
  switchToLightLabel="Go light"
  switchToDarkLabel="Go dark"
/>
```

For a **static app with no server** to set a cookie, `THEME_STORAGE_KEY`,
`themeInitScript` and `themeInitScriptHash` remain available as an
optional, JS-only fallback path — `ThemeToggle` still writes
`localStorage` under `THEME_STORAGE_KEY` on every toggle for back-compat
with this path, but a server-backed app should prefer the cookie above,
which is also what makes the no-JS form submission actually work. Embed
`themeInitScript` in the document `<head>` (before any stylesheet or
hydration) so a returning light-mode visitor's page doesn't flash dark on
first paint:

```tsx
import { themeInitScript } from '@branchleft/components';

<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />;
```

Inlining that script needs your `Content-Security-Policy`'s `script-src` to
allow it — either a per-response `nonce`, or the pre-computed
`themeInitScriptHash`:

```tsx
import { themeInitScriptHash } from '@branchleft/components';
// themeInitScriptHash === "sha256-eaTM2OdrPnWt18EwafzafEMGqGT6XQixJje4JPQ2gUg="

// e.g. as a response header:
// Content-Security-Policy: script-src 'self' 'sha256-eaTM2OdrPnWt18EwafzafEMGqGT6XQixJje4JPQ2gUg='
```

A hash-based CSP entry only matches the exact script text, so if
`themeInitScript` is ever edited, `themeInitScriptHash` must be
regenerated to match — `ThemeToggle.hash.test.ts` fails the build if the
two ever drift apart.

Form validation styling (`input:invalid`, `[aria-invalid="true"]`) uses a
dedicated `--bl-color-danger` token — never a ValuesColour, since the
brand owner's ValuesColours ruling scopes them to "describing things
related to those values," not generic UI error states. Colour is never
the only signal: pair an invalid control with `aria-invalid="true"` and
visible error text (the `.bl-form-error` class styles that text)
referenced via `aria-describedby`, so the error reaches assistive tech the
same way it reaches a sighted user.

## PublicPress mark

`PublicPressWordmark` and `PublicPressLogo` (from `@branchleft/brand-publicpress`)
render the PublicPress mark as SVG path outlines (Libre Franklin Bold
letters, both Ps the pilcrow P, knocked out of a solid colour block) — no web
font is loaded.

```tsx
import { PublicPressWordmark, PublicPressLogo } from '@branchleft/brand-publicpress';

export function Example() {
  return (
    <>
      <PublicPressWordmark color="blue" height={48} />
      <PublicPressLogo color="pink" height={32} />
    </>
  );
}
```

- `color`: `'blue' | 'black' | 'pink' | 'yellow'`, default `'blue'`.
- `height`: a number (px) or any CSS length string, default `32`; width
  follows the mark's aspect ratio automatically. The mark's own coordinate
  space is thousands of units per em, so a default of "no height" would
  render at that size — always pick an explicit `height` for anything other
  than a small inline mark.
- `title`: overrides the default accessible name, `"PublicPress"`.
- `decorative`: renders the mark with `aria-hidden` instead of an accessible
  name, for use next to visible "PublicPress" text.

The glyph outlines, block geometry and kerning (the wordmark applies the
Libre Franklin r-e kern) are generated from
[`packages/brand-publicpress/scripts/publicpress-mark-spec.json`](packages/brand-publicpress/scripts/publicpress-mark-spec.json)
via
[`packages/brand-publicpress/scripts/generate-publicpress-mark.mjs`](packages/brand-publicpress/scripts/generate-publicpress-mark.mjs)
into `src/components/publicPressMark.generated.ts` — regenerate with
`pnpm --filter @branchleft/brand-publicpress generate-mark` rather than
editing that file by hand.

`@branchleft/brand-publicpress`'s code is MIT licensed, but the PublicPress
name and marks (the output of `PublicPressWordmark` and `PublicPressLogo`)
are trade marks of BRANCHLEFT LTD (UK trade mark application
UK00004450168) and are not licensed under the MIT licence below. Their
letterforms derive from Libre Franklin, licensed under the SIL Open Font
License 1.1.

## Development

```sh
pnpm install
pnpm dev            # Storybook on :6006, covering all three packages
pnpm test:unit
pnpm build           # builds all three packages' dist/
```

See [`CLAUDE.md`](./CLAUDE.md) for conventions.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Release

See [RELEASING.md](RELEASING.md) — Changesets tracks each package's version; a signed tag push triggers CI to publish whichever packages changed.

## License

MIT — see [`LICENSE`](./LICENSE).
