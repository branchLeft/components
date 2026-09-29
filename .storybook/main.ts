import path from 'path';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../packages/*/src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  async viteFinal(viteConfig) {
    // Every workspace package gets aliased to its own source, not just
    // `@branchleft/components` — CI's job order builds each package's
    // `dist/` (`pnpm build`) before building Storybook, so without this a
    // package-name import here can resolve to a STALE or differently
    // externalised build artifact instead of the source Storybook actually
    // compiles everything else from (a real, CI-only failure this fixes:
    // a brand package's own `dist/index.js` externalises `react`, and
    // Storybook's build has no reason to know how to provide it). Matches
    // each brand package's own vitest.config.ts alias and tsconfig.json
    // `paths` override.
    viteConfig.resolve ??= {};
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      '@branchleft/components': path.resolve(__dirname, '../packages/components/src/index.ts'),
      '@branchleft/brand-branchleft': path.resolve(
        __dirname,
        '../packages/brand-branchleft/src/index.ts'
      ),
      '@branchleft/brand-publicpress': path.resolve(
        __dirname,
        '../packages/brand-publicpress/src/index.ts'
      ),
    };
    return viteConfig;
  },
};
export default config;
