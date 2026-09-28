import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// The four font families this package ships (see fonts.css), in the exact
// order their @font-face rules declare them there — `extractFontsPlugin`
// below relies on that order to match each base64 data URI Vite produces
// back to the real source file it came from.
const FONT_FILES = [
  'Syne/Syne-VariableFont_wght.woff2',
  'SpaceGrotesk/SpaceGrotesk-VariableFont_wght.woff2',
  'RobotoMono/RobotoMono-VariableFont_wght.woff2',
  'RobotoMono/RobotoMono-Italic-VariableFont_wght.woff2',
  'IBMPlexSans/IBMPlexSans-Regular.woff2',
  'IBMPlexSans/IBMPlexSans-Italic.woff2',
  'IBMPlexSans/IBMPlexSans-Medium.woff2',
  'IBMPlexSans/IBMPlexSans-SemiBold.woff2',
];

// Every family's own SIL OFL 1.1 licence text (`src/styles/fonts/<Family>/
// OFL.txt`), one per family directory in FONT_FILES (RobotoMono and
// IBMPlexSans each contribute more than one FONT_FILES entry but only one
// licence file). Derived from FONT_FILES rather than hand-listed, so a new
// family can't be added to one list and forgotten in the other.
const FONT_LICENCE_FILES = Array.from(
  new Set(FONT_FILES.map((relativePath) => path.dirname(relativePath) + '/OFL.txt'))
);

/**
 * Emits every font as its own file under `dist/fonts/`, addressed by a
 * plain relative `url()` from `dist/branchleft.css`, instead of Vite's
 * library-mode default.
 *
 * There is no supported config option for this: Vite's own docs for
 * `build.assetsInlineLimit` say plainly "If you specify build.lib,
 * build.assetsInlineLimit will be ignored and assets will always be
 * inlined, regardless of file size" — confirmed by testing `assetsInlineLimit:
 * 0` here directly; it made no difference; `dist/branchleft.css` still came
 * out at 339KB with every font base64-encoded inline (this vite.config.ts
 * used to say otherwise — that comment was simply wrong, per cycle-1
 * review). There is no library-mode "don't inline" switch to reach for.
 *
 * So this plugin works with that default rather than fighting it: it lets
 * Vite inline as it always will in lib mode, then fixes the file it wrote —
 * NOT via `generateBundle` (tried first; logging confirmed `dist/
 * branchleft.css` doesn't exist in the bundle map yet at that point in lib
 * mode — Vite's own CSS-emitting plugin runs its own bundle-mutating hook
 * later), but `writeBundle`, which runs once the real files are already on
 * disk. It reads the written CSS back, finds each
 * `url(data:font/woff2;base64,...)` Vite produced, in declaration order,
 * and replaces it with a real relative path to a font file this plugin
 * copies alongside it. Filenames aren't content-hashed: unlike a JS/CSS
 * chunk, a font's bytes don't change between releases, so there's nothing
 * to bust the cache over — what cycle-1 review flagged is fixed by these
 * simply being separate files: an unrelated colour/spacing tweak now only
 * touches branchleft.css, never forces re-fetching untouched font bytes.
 */
function extractFontsPlugin(): Plugin {
  const fontsDir = path.resolve(__dirname, 'src/styles/fonts');

  return {
    name: 'branchleft-extract-fonts',
    writeBundle(outputOptions) {
      // `build.lib`'s two formats (es, cjs) each run a fully independent
      // render+write of branchleft.css to this same path — NOT the same
      // file re-visited, a fresh (still base64-inlined) one each time, so
      // this hook must process every pass rather than skip after the
      // first (confirmed by testing: skipping left the second format's
      // pass overwriting the first pass's fix with its own untouched
      // inlined output).
      const outDir = outputOptions.dir;
      if (!outDir) throw new Error('extractFontsPlugin requires build.rollupOptions.output.dir');

      const cssPath = path.join(outDir, 'branchleft.css');
      if (!fs.existsSync(cssPath)) return; // this output format didn't produce the CSS chunk

      let index = 0;
      const original = fs.readFileSync(cssPath, 'utf8');
      const rewritten = original.replace(/url\(data:font\/woff2;base64,[^)]*\)/g, () => {
        const relativePath = FONT_FILES[index];
        index += 1;
        if (!relativePath) {
          throw new Error(
            `extractFontsPlugin found more inlined fonts in the built CSS than FONT_FILES lists (expected ${FONT_FILES.length}) — fonts.css likely gained a @font-face rule that FONT_FILES wasn't updated to match.`
          );
        }
        const destPath = path.join(outDir, 'fonts', relativePath);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(path.join(fontsDir, relativePath), destPath);
        return `url('./fonts/${relativePath}')`;
      });

      if (index !== FONT_FILES.length) {
        throw new Error(
          `extractFontsPlugin found ${index} inlined fonts in the built CSS but FONT_FILES lists ${FONT_FILES.length} — one of fonts.css's @font-face rules stopped matching FONT_FILES's order.`
        );
      }

      fs.writeFileSync(cssPath, rewritten);

      // Every font family is SIL OFL 1.1 (see fonts.css's header comment) —
      // its licence text ships alongside the woff2 it covers, in the same
      // dist/fonts/<Family>/ directory, rather than assuming the package's
      // own MIT LICENSE file covers font bytes it never granted rights to.
      // Copied here (not left to package.json's `files: ["dist"]` alone to
      // discover) so a missing source file fails the build loudly instead
      // of silently shipping a font with no licence text next to it.
      for (const relativePath of FONT_LICENCE_FILES) {
        const destPath = path.join(outDir, 'fonts', relativePath);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(path.join(fontsDir, relativePath), destPath);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), extractFontsPlugin()],
  build: {
    lib: {
      // Two entries: `index` is the real JS API. `styles` exists only to
      // pull the branchLeft stylesheet (tokens/fonts/elements) into the
      // build graph so Vite extracts it to dist/branchleft.css (see
      // assetFileNames below) for the `./css` export — it produces a
      // throwaway styles.{js,cjs} chunk that nothing in package.json
      // references. Mirrors @branchleft/components's own vite.config.ts.
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        styles: path.resolve(__dirname, 'src/styles.ts'),
      },
      name: 'branchLeftBrandBranchLeft',
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      // Externalise every subpath of react/react-dom (including
      // `react/jsx-runtime`) so consumers use their own React copy. Bundling
      // `react/jsx-runtime` inline breaks React 19 consumers because the
      // inlined helper reads React 18 internals.
      external: [/^react(\/.*)?$/, /^react-dom(\/.*)?$/],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        // Only one CSS asset is ever produced (from the `styles` entry) —
        // force it to `branchleft.css` to match the `./css` export in
        // package.json.
        assetFileNames: 'branchleft.[ext]',
      },
    },
  },
});
