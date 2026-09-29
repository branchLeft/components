---
'@branchleft/brand-branchleft': patch
---

Cap the Syne `@font-face`'s own variable weight range at 400–500 (`fonts.css`) — 500 is the weight the branchLeft wordmark itself uses (`--bl-weight-wordmark`), and Syne reads as a visibly wider letterform above it. `branchLeftTokens.ts`'s `type.faces.wordmark.weights` is trimmed to match (`[400, 500]`, down from `[400, 500, 600, 700, 800]`), so the type docs no longer show or imply a heavier Syne than the stylesheet ever actually loads.

Also removes the stale `provisional: true` flag from the `hero-wordmark` type-scale step: `3.75rem / 1` is the website title-page wordmark size, settled from the live site by PR #103 and already backed by this package's own tested `--bl-text-wordmark-hero`/`--bl-leading-wordmark-hero` tokens — it was never actually unruled, just left flagged.
