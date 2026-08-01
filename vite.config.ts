import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      // Two entries: `index` is the real JS API. `styles` exists only to
      // pull ValuesCloud.css into the build graph so Vite extracts it to
      // dist/index.css (see assetFileNames below) for the `./css` export —
      // it produces a throwaway styles.{js,cjs} chunk that nothing in
      // package.json references.
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        styles: path.resolve(__dirname, 'src/styles.ts'),
      },
      name: 'branchLeftComponents',
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
        // force it to `index.css` to match the `./css` export in package.json.
        assetFileNames: 'index.[ext]',
      },
    },
  },
});
