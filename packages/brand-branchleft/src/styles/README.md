# Stylesheet tests

Background for the short comments in the `branchleft.*.test.ts(x)` files beside this one.

## Tests that build the stylesheet run in plain Node

`branchleft.asset-size`, `branchleft.colour-vision`, `branchleft.font-hash` and `branchleft.a11y` run `vite build()` to get the real built CSS. esbuild's native bridge relies on a `TextEncoder`/`Uint8Array` invariant that jsdom's polyfills break, so these files declare `// @vitest-environment node` rather than using the package's jsdom default.

`branchleft.a11y.test.tsx` needs both a build and a DOM. It starts in Node, builds the stylesheet in `beforeAll`, and only then installs jsdom's globals, so one file can build real CSS and render real DOM to run axe against.

## Dotted layer names are sub-layers

`branchleft.layers.test.ts` asserts the cascade layer structure. A dotted name such as `branchleft.base` registers as a sub-layer of one parent layer. Its position among the top-level siblings is fixed by the parent's first appearance, not by where either child is listed.

A real Tailwind v4 build in a real browser found no achievable order that let a component class beat a same-priority site rule while a plain element default still lost to it, using that naming. That is why the layers are flat names and the README recommends an explicit `@layer` statement.
