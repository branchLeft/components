# Releasing

This is a pnpm workspace publishing three independently versioned packages — `@branchleft/components`, `@branchleft/brand-branchleft`, `@branchleft/brand-publicpress` — each to GitHub Packages.

## Versioning

[Changesets](https://github.com/changesets/changesets) tracks per-package version bumps and changelogs.

1. After a change that should bump a package's published version, run `pnpm changeset` and follow its prompts (which package(s) changed, the bump type, a short summary — this becomes the package's `CHANGELOG.md` entry).
2. Commit the generated `.changeset/*.md` file(s) alongside the change, in the same PR.
3. Once ready to cut a release, a maintainer runs `pnpm version-packages` on `main`. This consumes every pending changeset, bumps each affected package's `version` in `package.json`, writes its `CHANGELOG.md`, and updates any internal `workspace:^` dependant. Commit the result.
4. Note which packages actually got a version bump from that run (`git diff` on the `package.json` files it touched) — you'll need that exact list for the tag message below.

## Publishing

Publishing to GitHub Packages ([.github/workflows/publish.yml](.github/workflows/publish.yml)) is triggered by pushing a tag matching `v[0-9]+.[0-9]+.[0-9]+` — the same protected tag pattern as before. But because the three packages version independently, **the tag is a trigger, not a version**: it no longer has to match any single package's `version`, and nothing about its own name is checked. What ties a tag to what it releases is its **message**.

### Choosing the tag name

Pick anything matching `v[0-9]+.[0-9]+.[0-9]+` that isn't already used — there's no rule tying it to a package version. A simple running counter (`v0.5.0`, `v0.6.0`, ...) is fine; it's a release-train number, not a package version.

### Writing the tag message

The tag message's first line is a free-text subject (anything you like); after that, one line per package this tag releases, exactly `name@version`:

```
v0.5.0

@branchleft/brand-branchleft@0.1.1
@branchleft/brand-publicpress@0.1.1
```

List **every** package whose `package.json` version changed since the last tag — the same set `pnpm version-packages` just bumped. CI parses these lines and fails the release if they don't exactly match the set of workspace packages whose current version isn't yet on the registry: a package due for release but missing from this list, or a package named here that isn't actually due for release (already published, unversioned, or private), both fail it. Blank lines and any other prose are ignored, so the signature block a signed tag carries in its own message body doesn't need special handling.

### Creating and pushing the tag

Release tags are protected: once pushed, a tag cannot be deleted, moved, or force-pushed, and must carry a valid signature. Create tags as annotated and signed, not with `gh release create` alone (which creates a lightweight, unsigned tag):

```bash
git tag -s vX.Y.Z -m "$(cat <<'EOF'
vX.Y.Z

@branchleft/brand-branchleft@0.1.1
@branchleft/brand-publicpress@0.1.1
EOF
)"
git push origin vX.Y.Z
gh release create vX.Y.Z --verify-tag
```

`git tag -s` uses the signing key configured by `git config gpg.format` / `user.signingkey` (SSH signing here — see `~/.gitconfig`). `--verify-tag` tells `gh release create` to use the tag you already pushed rather than creating its own.

### What CI does with it

On a tag push:

1. Asserts the tag is a signed, annotated tag, and that CI passed for the tagged commit.
2. Runs `scripts/release-plan.mjs` (via `pnpm release-plan`), which checks every workspace package's current `package.json` version against the registry to compute which ones aren't there yet, compares that set against the tag message's `name@version` lines, and fails if they don't match exactly. It also writes the release plan to the run's job summary. A registry lookup failure fails the job rather than silently skipping a package.
3. Builds every workspace package, in dependency order (`pnpm -r build`) — always, even a package this run isn't about to publish, because the brand packages' own build needs `@branchleft/components`'s `dist/` to exist regardless of whether that package itself is being published this time.
4. Publishes with the standard tool, `pnpm -r publish --no-git-checks`, which already skips a package whose current version is already on the registry and already runs in dependency order.

Don't run `pnpm publish`, `pnpm -r publish` or `pnpm release-plan` locally — publishing is CI-only, triggered by the tag.
