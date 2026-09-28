import * as React from 'react';
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  // A brand-neutral "which mode" toolbar — every story gets it, but it only
  // does anything once a brand stylesheet keying off `data-theme` (e.g.
  // `@branchleft/brand-branchleft/css`) is loaded, which is exactly the
  // "HTML elements"/"ValuesColours" stories in that package's own
  // `src/styles/` — everything else simply ignores the attribute.
  globalTypes: {
    theme: {
      description: 'Colour mode (only affects stories that load a brand stylesheet)',
      defaultValue: 'dark',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      document.documentElement.setAttribute('data-theme', context.globals.theme ?? 'dark');
      return React.createElement(Story);
    },
  ],
};

export default preview;
