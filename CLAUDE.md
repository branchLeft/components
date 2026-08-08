# CLAUDE.md — branchLeft Components

branchLeft-internal: cross-repo standards (Node/nvm, non-interactive commands, pre-commit, comment style) live in the local workspace root CLAUDE.md (not part of this repo).

## Stack

- **Runtime/Package manager:** Node.js, pnpm
- **Framework:** React 18 + TypeScript
- **Build:** Vite (library mode) — outputs ESM + CJS to `dist/`
- **Dev environment:** Storybook 8
- **Tests:** Vitest + jsdom

## Commands

```bash
pnpm build             # compile library to dist/
pnpm build:storybook   # build static Storybook to storybook-static/
pnpm type-check        # tsc --noEmit
pnpm test:unit --run   # single vitest pass
pnpm lint              # eslint
pnpm format            # prettier --write
pnpm dev               # Storybook dev server on :6006 — async terminal only
pnpm preview           # Vite preview server — async terminal only
```

To verify Storybook output non-interactively, use `pnpm build:storybook` — never run `pnpm dev` synchronously to check it.

## Project Conventions

### Component authorship

- Components live flat under `src/components/` — no per-component subdirectories. Each component is `ComponentName.tsx`, colocated with `ComponentName.test.tsx` and `ComponentName.stories.tsx` (plus `ComponentName.css` for the styled exceptions below).
- Export everything public through `src/index.ts`.
- No default exports.

### Styling

- Components must be unstyled or accept a `className` prop — consumers apply their own styles.
- Do not import CSS that would leak into the consumer's bundle unless explicitly exported via `dist/index.css`.
- **Site-level theming is the consumer's job, not this package's.** The `website/` app centralises all visual decisions in `app/theme.css` (tokens, element defaults, component classes) — see `website/CLAUDE.md` → "Styling". Do not mirror those tokens here; keep components style-agnostic so any consumer can theme them.
- **Exception — components whose layout/spacing can't reasonably be left to every consumer** (currently `ValuesCloud`, `SectionHeading`, and `AccordionItem`) may ship real, structural CSS via the `./css` export subpath:
  - Source CSS lives colocated as `ComponentName.css` next to the component. Register it in `src/styles.ts` (a CSS-only build entry, kept separate from `src/index.ts` so importing the JS API never pulls in styles as a side effect) — see `vite.config.ts` for how that's wired to `dist/index.css`.
  - Every colour/font value must read from a `--bl-*` custom property with a fallback (e.g. `var(--bl-color-bg, #fff)`), never a hardcoded design-system token — this is still meant to be themable, just not layout-agnostic.
  - No `@apply`/Tailwind syntax — this package has no Tailwind pipeline; write plain CSS.
  - Document the export in the component's Storybook doc comment and in the README.

### Accessibility

- Use semantic HTML. Add ARIA attributes only where semantics are insufficient.
- All interactive elements must be keyboard-navigable.

### TypeScript

- Strict mode. No `any`.
- Prop types are named `ComponentNameProps` and exported alongside the component.

## Publishing

Publishing is handled by CI — do not run `pnpm publish` locally.

### Release flow

1. Bump `version` in `package.json`, commit, and push to `main`.
2. Create and push a semver tag — CI publishes automatically:

```bash
git tag v1.2.3
git push origin v1.2.3
```

The `.github/workflows/publish.yml` workflow triggers on tags matching `v[0-9]+.[0-9]+.[0-9]+`, builds the package via `prepublishOnly`, and publishes to GitHub Packages using `GITHUB_TOKEN`.

### Notes

- The tag version must match `version` in `package.json` — there is no automated check, so bump the version before tagging.
- Pre-release tags (e.g. `v1.0.0-beta.1`) do **not** trigger the workflow. Stable semver only.
