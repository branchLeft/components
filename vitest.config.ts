import { defineConfig } from 'vitest/config';

// Covers only the workspace-root tooling under scripts/ (the publish
// selection logic and the CODEOWNERS proof test) — each package's own
// components/tokens are covered by its own vitest.config.ts instead.
export default defineConfig({
  test: {
    include: ['scripts/**/*.test.mjs', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
