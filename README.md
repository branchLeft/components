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
ask every consumer to reimplement (`ValuesCloud`'s ring geometry) or a single
spacing rule that's easy to miss and not really a themeable decision
(`SectionHeading`'s icon/text gap). That CSS lives behind a separate entry
point — import it once, anywhere in your app, if you use any such component:

```tsx
import '@branchleft/components/css';
```

That stylesheet only handles layout/positioning/spacing; colours and fonts
read from `--bl-*` custom properties (with built-in fallbacks) so it stays
themable — see each component's Storybook docs for the full list of
customisable properties.

## Development

```sh
pnpm install
pnpm dev            # Storybook on :6006
pnpm test:unit
pnpm build          # emits dist/{index.js, index.cjs, index.d.ts}
```

See [`CLAUDE.md`](./CLAUDE.md) for conventions.

## Release

Bump `version` in `package.json`, commit, push to `main`, then tag — CI publishes automatically:

```sh
git tag v$(node -p "require('./package.json').version")
git push origin v$(node -p "require('./package.json').version")
```

## License

MIT — see [`LICENSE`](./LICENSE).
