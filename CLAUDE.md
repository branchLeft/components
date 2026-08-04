# CLAUDE.md — branchLeft Components

## Stack

- **Runtime/Package manager:** Node.js, pnpm
- **Framework:** React 18 + TypeScript
- **Build:** Vite (library mode) — outputs ESM + CJS to `dist/`
- **Dev environment:** Storybook 8
- **Tests:** Vitest + jsdom

## Node Version

This repo has an `.nvmrc`. Always run `nvm use` before any commands to activate the correct Node version. Do not hardcode version paths or manipulate `$PATH` manually.

```bash
nvm use
```

## Commands

### Non-interactive (safe to run directly)

```bash
pnpm build             # compile library to dist/
pnpm build:storybook   # build static Storybook to storybook-static/
pnpm type-check        # tsc --noEmit
pnpm test:unit --run   # single vitest pass — ALWAYS use --run to avoid watch mode
pnpm lint              # eslint
pnpm format            # prettier --write
```

### Long-running servers — async terminal mode only

These commands block indefinitely. Only start them in a background/async terminal; never `await` them in a script or agent task.

```bash
pnpm dev       # Storybook dev server on :6006
pnpm preview   # Vite preview server
```

### Installing dependencies

```bash
pnpm install --frozen-lockfile   # CI-safe install; never prompts
```

## Non-Interactive Tool Guidance

When running commands as an agent or in CI:

- **Vitest:** `pnpm test:unit --run` — omitting `--run` starts watch mode, which blocks forever.
- **Storybook:** use `pnpm build:storybook` for a one-shot build. Never run `pnpm dev` synchronously.
- **pnpm install:** always pass `--frozen-lockfile` to prevent interactive dependency prompts.
- **ESLint / Prettier:** both exit cleanly with non-zero codes on failure — no interaction needed.
- **TypeScript:** `pnpm type-check` is fully non-interactive.

## Pre-Commit Hooks

Hooks are managed by [pre-commit](https://pre-commit.com) and defined in `.pre-commit-config.yaml`.

### What runs on commit

1. **pre-commit-hooks** — trailing whitespace, end-of-file fixer, YAML check, large-file guard, merge-conflict check
2. **Prettier** — formats `.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.yml`, `.yaml`, `.md`
3. **ESLint** — lints `.js`, `.jsx`, `.ts`, `.tsx`
4. **Vitest** — runs `pnpm test:unit` (single pass, not watch mode) against any changed source files

### Running checks manually

```bash
pnpm format            # Prettier
pnpm lint              # ESLint
pnpm test:unit --run   # Vitest
pnpm type-check        # TypeScript
```

If a commit is blocked, fix the reported issues and re-commit. Hooks run automatically; you do not need to invoke pre-commit directly.

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
