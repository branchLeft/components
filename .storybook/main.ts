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
    // The brand packages' token-docs stories import `@branchleft/components`
    // for its `DesignTokens` type only, but Storybook still has to resolve
    // the specifier at the bundler level. Point it at source so a Storybook
    // build never depends on that package having been built to `dist/`
    // first — matches each brand package's own vitest.config.ts alias and
    // tsconfig.json `paths` override.
    viteConfig.resolve ??= {};
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      '@branchleft/components': path.resolve(__dirname, '../packages/components/src/index.ts'),
    };
    return viteConfig;
  },
};
export default config;
