# Releasing

Publishing to GitHub Packages ([.github/workflows/publish.yml](.github/workflows/publish.yml)) is triggered by pushing a tag matching `v[0-9]+.[0-9]+.[0-9]+`.

Release tags are protected: once pushed, a tag cannot be deleted, moved, or force-pushed, and must carry a valid signature. Create tags as annotated and signed, not with `gh release create` alone (which creates a lightweight, unsigned tag):

```bash
git tag -s vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
gh release create vX.Y.Z --verify-tag
```

`git tag -s` uses the signing key configured by `git config gpg.format` / `user.signingkey` (SSH signing here — see `~/.gitconfig`). `--verify-tag` tells `gh release create` to use the tag you already pushed rather than creating its own.
