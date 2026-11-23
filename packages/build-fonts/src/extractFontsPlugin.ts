import type { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

export interface ExtractFontsOptions {
  /** Absolute directory holding one sub-directory per font family. */
  fontsDir: string;
  /**
   * The brand's font files, relative to `fontsDir`, in the exact order their
   * @font-face rules are declared in the brand's fonts.css. The plugin relies
   * on that order to match each base64 data URI Vite produces back to the real
   * source file it came from.
   */
  fontFiles: readonly string[];
  /** The stylesheet Vite writes to the output dir, e.g. `branchleft.css`. */
  cssName: string;
}

/**
 * Emits every font as its own file under `dist/fonts/`, addressed by a
 * plain relative `url()` from the brand's stylesheet — Vite's library mode
 * always base64-inlines assets regardless of `assetsInlineLimit` (its docs
 * say so; confirmed by testing `0` directly, which made no difference).
 * There is no library-mode "don't inline" switch to reach for.
 *
 * Runs in `writeBundle` (once the real files exist on disk — NOT
 * `generateBundle`, where the CSS chunk isn't in the bundle map yet in lib
 * mode), reading the written CSS back and replacing each inlined font
 * `url()` with a real relative path, in declaration order, to a font file
 * copied alongside it. Filenames aren't content-hashed — a font's bytes
 * never change between releases — so an unrelated colour/spacing tweak
 * only touches the stylesheet, never re-fetches untouched font bytes.
 *
 * Every family is SIL OFL 1.1: its licence text ships alongside the woff2 it
 * covers, in the same dist/fonts/<Family>/ directory. The licence list is
 * derived from `fontFiles`, so a new family can't be added to one list and
 * forgotten in the other. Copied here (not left to package.json's
 * `files: ["dist"]` alone to discover) so a missing source file fails the
 * build loudly instead of silently shipping a font with no licence text.
 */
export function extractFontsPlugin({ fontsDir, fontFiles, cssName }: ExtractFontsOptions): Plugin {
  const licenceFiles = Array.from(
    new Set(fontFiles.map((relativePath) => path.dirname(relativePath) + '/OFL.txt'))
  );

  return {
    name: `${path.parse(cssName).name}-extract-fonts`,
    writeBundle(outputOptions) {
      // `build.lib`'s two formats (es, cjs) each run a fully independent
      // render+write of the stylesheet to this same path — NOT the same file
      // re-visited, a fresh (still base64-inlined) one each time, so this hook
      // must process every pass rather than skip after the first (confirmed by
      // testing: skipping left the second format's pass overwriting the first
      // pass's fix with its own untouched inlined output).
      const outDir = outputOptions.dir;
      if (!outDir) throw new Error('extractFontsPlugin requires build.rollupOptions.output.dir');

      const cssPath = path.join(outDir, cssName);
      if (!fs.existsSync(cssPath)) return; // this output format didn't produce the CSS chunk

      let index = 0;
      const original = fs.readFileSync(cssPath, 'utf8');
      const rewritten = original.replace(/url\(data:font\/woff2;base64,[^)]*\)/g, () => {
        const relativePath = fontFiles[index];
        index += 1;
        if (!relativePath) {
          throw new Error(
            `extractFontsPlugin found more inlined fonts in the built CSS than FONT_FILES lists (expected ${fontFiles.length}) — fonts.css likely gained a @font-face rule that FONT_FILES wasn't updated to match.`
          );
        }
        const destPath = path.join(outDir, 'fonts', relativePath);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(path.join(fontsDir, relativePath), destPath);
        return `url('./fonts/${relativePath}')`;
      });

      if (index !== fontFiles.length) {
        throw new Error(
          `extractFontsPlugin found ${index} inlined fonts in the built CSS but FONT_FILES lists ${fontFiles.length} — one of fonts.css's @font-face rules stopped matching FONT_FILES's order.`
        );
      }

      fs.writeFileSync(cssPath, rewritten);

      for (const relativePath of licenceFiles) {
        const destPath = path.join(outDir, 'fonts', relativePath);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(path.join(fontsDir, relativePath), destPath);
      }
    },
  };
}
