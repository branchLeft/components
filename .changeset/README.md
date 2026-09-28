# Changesets

Run `pnpm changeset` after a change that should bump a package's published version, then answer its prompts (which package(s), bump type, a short summary for the changelog).

A maintainer runs `pnpm version-packages` to consume all pending changesets, bump each affected package's `version` in `package.json`, and write its `CHANGELOG.md` — then commits the result. See [RELEASING.md](../RELEASING.md) for the rest of the release flow.
