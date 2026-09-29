---
'@branchleft/brand-publicpress': minor
---

`@branchleft/brand-publicpress` now self-hosts the owner's chosen PublicPress typefaces: Jost (SIL OFL 1.1) as the text face, with the holding page's own Futura stack kept behind it as the fallback chain, and Courier Prime (SIL OFL 1.1) as the mono face. Both ship as latin-subset woff2 files with their OFL.txt licence text, loaded via a new `./css` export (`src/styles/fonts.css`) and served from a new `./fonts/*` export. `publicPressTokens`' `display`, `body` and `mono` faces are updated to match and are no longer provisional.
