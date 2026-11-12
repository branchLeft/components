import path from 'path';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../packages/*/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    // Lives outside every package so no tsconfig applies to it: the only
    // thing that makes its JSX compile is the esbuild setting below.
    './probes/*.stories.tsx',
  ],
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
    // esbuild finds no root `tsconfig.json` (only `tsconfig.node.json`), so a `.tsx`
    // with no closer one gets the classic JSX transform and throws `React is not
    // defined`; forced explicitly here. See .storybook/README.md.
    viteConfig.esbuild = {
      ...viteConfig.esbuild,
      jsx: 'automatic',
    };

    // Every workspace package is aliased to its own source: CI builds each `dist/` before
    // Storybook, so a package-name import could resolve to a STALE or differently externalised
    // artifact. Matches each brand's vitest alias and tsconfig `paths` override.
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
