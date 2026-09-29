---
'@branchleft/brand-publicpress': minor
---

Add the PublicPress yellow (`#FFE800`) as `publicPressTokens.colour.active` — the active/accent colour (links, hover, focus), per the owner's ruling on workspace#1596. It clears 16.79:1 on black in dark mode. In light mode the same hex is only ~1.25:1 on white, so it can never be text or a thin line there — only a fill sitting behind dark text/icons, the mark's own block-and-knockout convention. `colour.light` instead carries a deeper derived variant (`#837800`, same hue, ~4.51:1 on white) for light-mode text/UI use, marked `provisional: true` pending the owner's confirmation of that specific derived value.
