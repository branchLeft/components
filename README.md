# @branchleft/components

Reusable React component library for branchLeft.

Published to [GitHub Packages](https://github.com/branchLeft/components/packages) under the `@branchleft` scope.

## Install

```sh
# One-time: point the @branchleft scope at GitHub Packages and provide a token
# with `read:packages` scope in your user-level ~/.npmrc:
#   @branchleft:registry=https://npm.pkg.github.com
#   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT

pnpm add @branchleft/components
```

Peer deps: `react` and `react-dom` >= 18.

## Usage

```tsx
import { Logo, SectionHeading } from '@branchleft/components';

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

Most components ship **no CSS** by default. They expose stable class-name
hooks (`bl-section-heading`, `bl-section-heading--linked`,
`bl-section-heading__link`, `bl-section-heading__icon`) so consumers can
theme them however they like.

A few components ship real, structural CSS — layout too fiddly to reasonably
ask every consumer to reimplement (`ValuesCloud`'s ring geometry,
`AccordionItem`'s reveal animation and the browser-default overrides it
needs) or a single spacing rule that's easy to miss and not really a
themeable decision (`SectionHeading`'s icon/text gap). That CSS lives behind
a separate entry point — import it once, anywhere in your app, if you use
any such component:

```tsx
import '@branchleft/components/css';
```

That stylesheet only handles layout/positioning/spacing; colours and fonts
read from `--bl-*` custom properties (with built-in fallbacks) so it stays
themable — see each component's Storybook docs for the full list of
customisable properties.

## PublicPress mark

`PublicPressWordmark` and `PublicPressLogo` render the PublicPress mark as SVG
path outlines (Libre Franklin Bold letters, both Ps the pilcrow P, knocked out
of a solid colour block) — no web font is loaded.

```tsx
import { PublicPressWordmark, PublicPressLogo } from '@branchleft/components';

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
- `height`: a number (px) or any CSS length string; width follows the mark's
  aspect ratio automatically.
- `title`: overrides the default accessible name, `"PublicPress"`.
- `decorative`: renders the mark with `aria-hidden` instead of an accessible
  name, for use next to visible "PublicPress" text.

The glyph outlines and block geometry are generated from
[`scripts/publicpress-mark-spec.json`](scripts/publicpress-mark-spec.json) via
[`scripts/generate-publicpress-mark.mjs`](scripts/generate-publicpress-mark.mjs)
into `src/components/publicPressMark.generated.ts` — regenerate with
`node scripts/generate-publicpress-mark.mjs` rather than editing that file by
hand.

This package's code is MIT licensed, but the PublicPress name and marks
(the output of `PublicPressWordmark` and `PublicPressLogo`) are trade marks of
BRANCHLEFT LTD (UK trade mark application UK00004450168) and are not licensed
under the MIT licence below. Their letterforms derive from Libre Franklin,
licensed under the SIL Open Font License 1.1.

## Development

```sh
pnpm install
pnpm dev            # Storybook on :6006
pnpm test:unit
pnpm build          # emits dist/{index.js, index.cjs, index.d.ts}
```

See [`CLAUDE.md`](./CLAUDE.md) for conventions.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Release

Bump `version` in `package.json`, commit, push to `main`, then tag once CI is green — CI publishes automatically. See [RELEASING.md](RELEASING.md) for the exact commands.

## License

MIT — see [`LICENSE`](./LICENSE).
