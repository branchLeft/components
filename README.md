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
covers, all inside a single `branchleft.base` cascade layer so a consuming
app can override anything without fighting specificity:

```tsx
import '@branchleft/brand-branchleft/css';
```

Fonts (Space Grotesk, Syne, IBM Plex Sans, Roboto Mono) ship as their own
`dist/fonts/*.woff2` files, referenced by the stylesheet's own `@font-face`
rules — nothing is base64-inlined, so an unrelated colour/spacing change
never forces a re-download of unchanged font bytes. If you need to reach a
font file directly (e.g. `<link rel="preload">`), it's reachable via the
package's `./fonts/*` export subpath.

Dark is the brand default; light is opt-in via `data-theme="light"` on
`<html>`. `@branchleft/components`'s `ThemeToggle` sets that attribute and
persists the choice:

```tsx
import { ThemeToggle } from '@branchleft/components';

<ThemeToggle />;
```

For an SSR app, embed `themeInitScript` in the document `<head>` (before
any stylesheet or hydration) so a returning light-mode visitor's page
doesn't flash dark on first paint:

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
same way it reaches a sighted user. `--bl-color-danger` is marked
provisional in `tokens.css` — not yet confirmed by the brand owner.

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
