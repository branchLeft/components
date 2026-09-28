# @branchleft/brand-publicpress

## 0.1.0

### Minor Changes

- Split the single `@branchleft/components` package into three: `@branchleft/components` keeps the brand-neutral components, hooks and the shared `DesignTokens` types; `@branchleft/brand-branchleft` carries `Logo` and `branchLeftTokens`; `@branchleft/brand-publicpress` carries the PublicPress marks, geometry and tokens.

  Moving `Logo`, the PublicPress exports and the brand token sets out of `@branchleft/components` is a breaking change for anything importing them from there — see the README for the new import paths.

### Patch Changes

- Updated dependencies
  - @branchleft/components@0.4.0
