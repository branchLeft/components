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

// Every family's SIL OFL 1.1 licence text (`src/styles/fonts/<Family>/OFL.txt`), one per family directory in FONT_FILES
// (RobotoMono and IBMPlexSans have several entries, one licence). Derived, not hand-listed, so a new family can't be
// added to one list and forgotten in the other.
const FONT_LICENCE_FILES = Array.from(
  new Set(FONT_FILES.map((relativePath) => path.dirname(relativePath) + '/OFL.txt'))
);

/**
 * Emits each font as its own file under `dist/fonts/`, addressed by a relative `url()`: Vite's library mode
 * always base64-inlines assets whatever `assetsInlineLimit` says, and has no "don't inline" switch.
 */

/**
 * Runs in `writeBundle`, not `generateBundle` (the CSS chunk isn't in the bundle map yet
 * in lib mode); rewrites inlined font `url()`s to copied files. See vite.config.md.
 */
function extractFontsPlugin(): Plugin {
  const fontsDir = path.resolve(__dirname, 'src/styles/fonts');

  return {
    name: 'branchleft-extract-fonts',
    writeBundle(outputOptions) {
      // `build.lib`'s two formats (es, cjs) each render and write branchleft.css to this same path afresh (still
      // base64-inlined), so this hook must process every pass: skipping after the first let the second pass
      // overwrite the fix with its own inlined output.
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

      // Every font family is SIL OFL 1.1 (see fonts.css): its licence text ships beside the woff2 it covers in
      // dist/fonts/<Family>/, as the package's MIT LICENSE grants no rights over font bytes. Copied here, not left to
      // `files: ["dist"]`, so a missing source file fails the build instead of shipping a font with no licence text.
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
      // Two entries: `index` is the JS API; `styles` exists only to pull the stylesheet into the build graph so Vite
      // extracts it to dist/branchleft.css for the `./css` export, producing a throwaway styles.{js,cjs} chunk nothing
      // references. Mirrors @branchleft/components's vite.config.ts.
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
