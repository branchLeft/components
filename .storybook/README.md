# Storybook configuration notes

Background for the short comments in `main.ts`, `preview.tsx`, the probe story and the `DesignTokens` and `PageTransition` stories.

## Automatic JSX runtime is forced in `main.ts`

esbuild picks a JSX transform by walking up from each source file to the nearest literal `tsconfig.json`. This repo's root has none (only `tsconfig.node.json`, a different filename esbuild does not look for). A `.tsx` file with no closer `tsconfig.json` of its own, such as a decorator directly under `.storybook/`, therefore gets the classic transform. That transform needs `React` in scope and throws `ReferenceError: React is not defined` when it is not.

`viteFinal` sets the automatic runtime explicitly, so the result never depends on tsconfig discovery succeeding in any checkout layout. `probes/JsxRuntimeProbe.stories.tsx` is the regression probe: it has no `React` import and sits where no tsconfig applies, so removing the setting makes it throw at render, which `scripts/storybook-a11y-check.mjs` reports as a render error.

## The `theme` toolbar is brand-neutral

`preview.tsx` adds a mode toolbar to every story. It only does anything once a brand stylesheet keyed off `data-theme` is loaded, such as `@branchleft/brand-branchleft/css`, which is what the "HTML elements" and "ValuesColours" stories in that package's `src/styles/` use. Every other story ignores the attribute.

## Plain-text Controls columns for fixture components

The `DesignTokens` stories and the `PageTransition` story render a fixed fixture (a whole token set, or JSX children) that is not meant for interactive editing. The Controls addon's default JSON-tree renderer for a non-primitive value fails color-contrast in both themes, so those stories override the type and default columns to plain text.

Disabling the row outright (`table.disable`) is not an option: the fixture is the component's only prop, so an empty Args table falls back to Storybook's own "couldn't be auto-generated" notice, which has the same contrast bug.
