# @branchleft/brand-branchleft

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
