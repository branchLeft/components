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
    // esbuild picks a JSX transform by walking up from each source file for
    // the nearest literal `tsconfig.json` — this repo's root has none (only
    // `tsconfig.node.json`, a different filename esbuild doesn't look for),
    // so a `.tsx` file with no closer one of its own (a decorator directly
    // under `.storybook/`) silently gets the classic transform, which
    // needs `React` in scope and throws `ReferenceError: React is not
    // defined` when it isn't. Forced explicitly so this never again depends
    // on tsconfig discovery succeeding, in any checkout layout.
    viteConfig.esbuild = {
      ...viteConfig.esbuild,
      jsx: 'automatic',
    };

    // Every workspace package gets aliased to its own source, not just
    // `@branchleft/components` — CI's job order builds each package's
    // `dist/` (`pnpm build`) before building Storybook, so without this a
    // package-name import here can resolve to a STALE or differently
    // externalised build artifact instead of the source Storybook actually
    // compiles everything else from. Matches each brand package's own
    // vitest.config.ts alias and tsconfig.json `paths` override.
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
