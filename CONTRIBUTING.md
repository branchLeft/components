# Contributing to branchLeft/components

This repo follows the [org-wide contribution guide](https://github.com/branchLeft/.github/blob/main/CONTRIBUTING.md) — fork, branch, PR, squash-merge, one required review. This file covers what's specific to `components`.

## Prerequisites

- Node version pinned in [.nvmrc](.nvmrc) — run `nvm use` before anything else.
- [pnpm](https://pnpm.io) as the package manager.

## Setup

```bash
nvm use
pnpm install --frozen-lockfile
```

## Checks CI runs on every PR

These are exactly what [.github/workflows/ci.yml](.github/workflows/ci.yml) runs, fanning out across all three packages under `packages/`:

```bash
pnpm format:check
pnpm lint
pnpm type-check
pnpm test:unit
pnpm test:scripts   # the publish-selection logic under scripts/
pnpm build
```

## Pre-commit hooks

This repo uses [pre-commit](https://pre-commit.com) (config in [.pre-commit-config.yaml](.pre-commit-config.yaml)) to run formatting, linting, and unit tests automatically on `git commit`:

```bash
pip install pre-commit   # or: brew install pre-commit
pre-commit install
```

If a hook fails, it usually auto-fixes the issue (Prettier, whitespace) — re-stage and commit again. For lint/test failures you'll need to fix the reported issue yourself.

## Component conventions

See [CLAUDE.md](CLAUDE.md) for authorship conventions (file layout, styling boundaries, accessibility, TypeScript strictness) — worth a skim before adding or changing a component.

## Publishing

Don't run `pnpm publish` locally — releases are triggered by pushing a `v*.*.*` tag on `main` and handled entirely by CI. See [README.md](README.md#release).
