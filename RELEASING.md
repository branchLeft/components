# Releasing

This is a pnpm workspace publishing three independently versioned packages — `@branchleft/components`, `@branchleft/brand-branchleft`, `@branchleft/brand-publicpress` — each to GitHub Packages.

## Versioning

[Changesets](https://github.com/changesets/changesets) tracks per-package version bumps and changelogs.

1. After a change that should bump a package's published version, run `pnpm changeset` and follow its prompts (which package(s) changed, the bump type, a short summary — this becomes the package's `CHANGELOG.md` entry).
2. Commit the generated `.changeset/*.md` file(s) alongside the change, in the same PR.
3. Once ready to cut a release, a maintainer runs `pnpm version-packages` on `main`. This consumes every pending changeset, bumps each affected package's `version` in `package.json`, writes its `CHANGELOG.md`, and updates any internal `workspace:^` dependant. Commit the result.

## Publishing

Publishing to GitHub Packages ([.github/workflows/publish.yml](.github/workflows/publish.yml)) is triggered by pushing a tag matching `v[0-9]+.[0-9]+.[0-9]+` — the same protected tag pattern as before. But because the three packages version independently, the tag is now just a trigger, not a version: it no longer has to match any single package's `version`.

On a tag push, CI:

1. Asserts the tag is a signed, annotated tag, and that CI passed for the tagged commit.
2. Runs `scripts/publish-workspace-packages.mjs` (via `pnpm publish-workspace`), which checks every workspace package's current `package.json` version against the registry and publishes whichever ones aren't there yet — skipping the rest. A registry lookup failure fails the whole job rather than silently skipping a package.

So after `pnpm version-packages` bumps (say) only `@branchleft/components`, the next tag push publishes just that one; the two brand packages are already on the registry at their current versions and are skipped.

Release tags are protected: once pushed, a tag cannot be deleted, moved, or force-pushed, and must carry a valid signature. Create tags as annotated and signed, not with `gh release create` alone (which creates a lightweight, unsigned tag):

```bash
git tag -s vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
gh release create vX.Y.Z --verify-tag
```

`git tag -s` uses the signing key configured by `git config gpg.format` / `user.signingkey` (SSH signing here — see `~/.gitconfig`). `--verify-tag` tells `gh release create` to use the tag you already pushed rather than creating its own.

Don't run `pnpm publish` (or `pnpm publish-workspace`) locally — publishing is CI-only, triggered by the tag.
