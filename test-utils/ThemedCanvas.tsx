import type { Decorator } from '@storybook/react';

/**
 * Storybook's docs-page "canvas" card paints a fixed light background
 * around an embedded story, independent of the "theme" toolbar global — a
 * brand stylesheet keyed off `data-theme` only recolours `html`/`body`, so
 * its text colour goes white-on-white against that card. An inline style
 * wins regardless of Storybook's own CSS. Only for stories that load such
 * a stylesheet.
 */
export const themedCanvas: Decorator = (Story) => (
  <div style={{ background: 'var(--bl-color-bg)', color: 'var(--bl-color-fg)', padding: '1rem' }}>
    <Story />
  </div>
);
