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

Components ship **no CSS**. They expose stable class-name hooks
(`bl-section-heading`, `bl-section-heading--linked`, `bl-section-heading__link`,
`bl-section-heading__icon`) so consumers can theme them however they like.

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
