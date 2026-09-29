# @branchleft/brand-publicpress

## 0.2.0

### Minor Changes

- 40142fb: Add the PublicPress yellow as `publicPressTokens.colour.active`, the active/accent colour (links, hover, focus), owner-ruled in both modes. Dark mode uses the mark's own yellow ink, `#FFE800` (16.79:1 on black). In light mode that hex is only ~1.25:1 on the page background, so there it is a fill behind dark text or icons only, never text or a thin line; light-mode text uses the deeper `#7e7300` (4.63:1 on `#FAFAF7`, 4.84:1 on white).

  Every type-scale size (h1–h6, body, small) is now settled rather than provisional. Spacing, radius, motion, the page colours and the non-wordmark type faces remain provisional.

  The Storybook stories for `PublicPressWordmark` and `PublicPressLogo` now pin each named story's ink, so a colour arg carried in a shared URL can no longer repaint the Blue story pink; the Playground story keeps its colour control.

  The `@branchleft/components` peer range is raised to `>=0.6.0 <1.0.0`: the `active` colour key is typed by `ColourTokens` from 0.6.0 onwards, so an older `@branchleft/components` cannot type `publicPressTokens`.

## 0.1.0

### Minor Changes

- Split the single `@branchleft/components` package into three: `@branchleft/components` keeps the brand-neutral components, hooks and the shared `DesignTokens` types; `@branchleft/brand-branchleft` carries `Logo` and `branchLeftTokens`; `@branchleft/brand-publicpress` carries the PublicPress marks, geometry and tokens.

  Moving `Logo`, the PublicPress exports and the brand token sets out of `@branchleft/components` is a breaking change for anything importing them from there — see the README for the new import paths.

### Patch Changes

- Updated dependencies
  - @branchleft/components@0.4.0
