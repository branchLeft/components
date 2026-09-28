# CLAUDE.md — branchLeft Components

branchLeft-internal: cross-repo standards (Node/nvm, non-interactive commands, pre-commit, comment style) live in the local workspace root CLAUDE.md (not part of this repo).

## Stack

- **Runtime/Package manager:** Node.js, pnpm workspace (`packages/*`)
- **Framework:** React 18 + TypeScript
- **Build:** Vite (library mode, per package) — each package outputs ESM + CJS to its own `dist/`
- **Dev environment:** Storybook 8 — one instance at the repo root covers all three packages
- **Tests:** Vitest + jsdom
- **Versioning:** [Changesets](https://github.com/changesets/changesets) — see [RELEASING.md](RELEASING.md)

Three published packages:

- `packages/components` → `@branchleft/components` — brand-neutral components, hooks, and the shared `DesignTokens` types.
- `packages/brand-branchleft` → `@branchleft/brand-branchleft` — the branchLeft `Logo` and `branchLeftTokens`.
- `packages/brand-publicpress` → `@branchleft/brand-publicpress` — the PublicPress marks, geometry and `publicPressTokens`.

A brand package may depend on `@branchleft/components` (via `workspace:^`) for the shared token types, and only where it actually needs them. Nothing depends the other way.

## Commands

Run at the workspace root; each fans out to every package that defines the underlying script:

```bash
pnpm build             # build all three packages' dist/
pnpm build:storybook   # build the single, cross-package Storybook to storybook-static/
pnpm type-check        # tsc --noEmit, per package, plus the root tooling files
pnpm test:unit         # single vitest pass, per package
pnpm test:scripts      # single vitest pass over scripts/ (the publish-selection logic)
pnpm lint              # eslint across packages/*/src
pnpm format            # prettier --write
pnpm dev               # Storybook dev server on :6006 — async terminal only
```

To verify Storybook output non-interactively, use `pnpm build:storybook` — never run `pnpm dev` synchronously to check it.

## Project Conventions

### Component authorship

- Components live flat under each package's `src/components/` — no per-component subdirectories. Each component is `ComponentName.tsx`, colocated with `ComponentName.test.tsx` and `ComponentName.stories.tsx` (plus `ComponentName.css` for the styled exceptions below).
- Export everything public through the package's `src/index.ts`.
- No default exports.

### Styling

- Components must be unstyled or accept a `className` prop — consumers apply their own styles.
- Do not import CSS that would leak into the consumer's bundle unless explicitly exported via `dist/index.css`.
- **`@branchleft/components` stays style-agnostic** — the brand-neutral package ships no brand's tokens, marks or stylesheet, so any consumer can theme it. **The brand packages are where a brand's own look lives**: `@branchleft/brand-branchleft` carries `branchLeftTokens` and (once written) the branchLeft stylesheet; `@branchleft/brand-publicpress` carries `publicPressTokens`. A component belongs in `@branchleft/components` only if it makes no assumption about which brand is using it.
- **Exception — components whose layout/spacing can't reasonably be left to every consumer** (currently `ValuesCloud`, `SectionHeading`, and `AccordionItem`, all in `@branchleft/components`) may ship real, structural CSS via that package's `./css` export subpath:
  - Source CSS lives colocated as `ComponentName.css` next to the component. Register it in `src/styles.ts` (a CSS-only build entry, kept separate from `src/index.ts` so importing the JS API never pulls in styles as a side effect) — see that package's `vite.config.ts` for how that's wired to `dist/index.css`.
  - Every colour/font value must read from a `--bl-*` custom property with a fallback (e.g. `var(--bl-color-bg, #fff)`), never a hardcoded design-system token — this is still meant to be themable, just not layout-agnostic.
  - No `@apply`/Tailwind syntax — no package here has a Tailwind pipeline; write plain CSS.
  - Document the export in the component's Storybook doc comment and in the README.

### Accessibility

- Use semantic HTML. Add ARIA attributes only where semantics are insufficient.
- All interactive elements must be keyboard-navigable.

### TypeScript

- Strict mode. No `any`.
- Prop types are named `ComponentNameProps` and exported alongside the component.

## Publishing

Publishing is handled by CI — do not run `pnpm publish`, `pnpm -r publish` or `pnpm release-plan` locally.

### Release flow

See [RELEASING.md](RELEASING.md) for the full flow: a Changesets bump per package, then pushing a signed `v*.*.*` tag once CI is green on `main`. `.github/workflows/publish.yml` triggers on that tag and publishes whichever workspace packages' current versions aren't already on the registry — never all three unconditionally.

### Notes

- Pre-release tags (e.g. `v1.0.0-beta.1`) do **not** trigger the workflow. Stable semver only.
