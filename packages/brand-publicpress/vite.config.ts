import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { extractFontsPlugin } from '../build-fonts/src/extractFontsPlugin';
import path from 'path';

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

export default defineConfig({
  plugins: [
    react(),
    extractFontsPlugin({
      fontsDir: path.resolve(__dirname, 'src/styles/fonts'),
      fontFiles: FONT_FILES,
      cssName: 'publicpress.css',
    }),
  ],
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
