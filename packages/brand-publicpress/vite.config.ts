import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// The two font families this package ships (see styles/fonts.css), in the
// exact order their @font-face rules declare them there —
// `extractFontsPlugin` below relies on that order to match each base64 data
// URI Vite produces back to the real source file it came from. Mirrors
// @branchleft/brand-branchleft's own vite.config.ts.
const FONT_FILES = [
  'Jost/Jost-Variable.woff2',
  'Jost/Jost-Italic-Variable.woff2',
  'CourierPrime/CourierPrime-Regular.woff2',
  'CourierPrime/CourierPrime-Italic.woff2',
  'CourierPrime/CourierPrime-Bold.woff2',
  'CourierPrime/CourierPrime-BoldItalic.woff2',
];

// Every family's own SIL OFL 1.1 licence text (`src/styles/fonts/<Family>/
// OFL.txt`), one per family directory in FONT_FILES.
const FONT_LICENCE_FILES = Array.from(
  new Set(FONT_FILES.map((relativePath) => path.dirname(relativePath) + '/OFL.txt'))
);

/**
 * Emits every font as its own file under `dist/fonts/`, addressed by a
 * plain relative `url()` from `dist/publicpress.css` — Vite's library mode
 * always base64-inlines assets regardless of `assetsInlineLimit` (its docs
 * say so; confirmed by testing `0` directly, which made no difference).
 * There is no library-mode "don't inline" switch to reach for.
 */

/**
 * Runs in `writeBundle` (once the real files exist on disk — NOT
 * `generateBundle`, where the CSS chunk isn't in the bundle map yet in lib
 * mode), reading the written CSS back and replacing each inlined font
 * `url()` with a real relative path, in declaration order, to a font file
 * copied alongside it. Filenames aren't content-hashed — a font's bytes
 * never change between releases — so an unrelated tweak only touches
 * `publicpress.css`, never re-fetches untouched font bytes.
 */
function extractFontsPlugin(): Plugin {
  const fontsDir = path.resolve(__dirname, 'src/styles/fonts');

  return {
    name: 'publicpress-extract-fonts',
    writeBundle(outputOptions) {
      // `build.lib`'s two formats (es, cjs) each run a fully independent
      // render+write of publicpress.css to this same path — NOT the same
      // file re-visited, a fresh (still base64-inlined) one each time, so
      // this hook must process every pass rather than skip after the
      // first.
      const outDir = outputOptions.dir;
      if (!outDir) throw new Error('extractFontsPlugin requires build.rollupOptions.output.dir');

      const cssPath = path.join(outDir, 'publicpress.css');
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
      // pull the PublicPress fonts into the build graph so Vite extracts
      // them to dist/publicpress.css (see assetFileNames below) for the
      // `./css` export — it produces a throwaway styles.{js,cjs} chunk
      // that nothing in package.json references. Mirrors
      // @branchleft/brand-branchleft's own vite.config.ts.
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        styles: path.resolve(__dirname, 'src/styles.ts'),
      },
      name: 'branchLeftBrandPublicPress',
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
        // force it to `publicpress.css` to match the `./css` export in
        // package.json.
        assetFileNames: 'publicpress.[ext]',
      },
    },
  },
});
