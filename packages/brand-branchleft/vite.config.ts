import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { extractFontsPlugin } from '../build-fonts/src/extractFontsPlugin';
import path from 'path';

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

export default defineConfig({
  plugins: [
    react(),
    extractFontsPlugin({
      fontsDir: path.resolve(__dirname, 'src/styles/fonts'),
      fontFiles: FONT_FILES,
      cssName: 'branchleft.css',
    }),
  ],
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
