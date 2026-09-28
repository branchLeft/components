import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Matches tsconfig.json's `paths` override: tests run against
    // `@branchleft/components`'s source, not its `dist/`, so this package's
    // own tests don't depend on that package having been built yet.
    alias: {
      '@branchleft/components': path.resolve(__dirname, '../components/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../test-utils/axe-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
