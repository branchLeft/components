# vite.config.ts notes

## `extractFontsPlugin`

The plugin runs in `writeBundle`, once the real files exist on disk. It cannot run in `generateBundle`: in library mode the CSS chunk is not in the bundle map yet at that point. It reads the written CSS back and replaces each inlined font `url()` with a real relative path, in declaration order, to a font file copied alongside it.

Filenames are not content-hashed, because a font's bytes never change between releases. An unrelated colour or spacing tweak therefore only touches `branchleft.css` and never makes consumers re-fetch untouched font bytes.

Matching is by position, so `src/styles/branchleft.font-hash.test.ts` compares a sha256 of each emitted font against its source to catch a wrong pairing.
