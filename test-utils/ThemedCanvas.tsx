import type { Decorator } from '@storybook/react';

/**
 * Storybook's own docs-page "canvas" card paints a fixed light background
 * around an embedded story, independent of the "theme" toolbar global — so a
 * story that loads a brand stylesheet keyed off `data-theme` (dark by
 * default) ends up with that stylesheet's `color: var(--bl-color-fg)`
 * (white) inherited onto the card's own light background, both in the docs
 * embed and in the standalone story canvas. Inline styles win over that card
 * background regardless of which cascade layer or specificity Storybook's
 * own CSS uses, so this decorator paints its own opaque background/text
 * colour, from the same tokens the stylesheet itself uses, immediately
 * inside the story tree — only for stories that import a stylesheet driven
 * by that same `data-theme` attribute.
 */
export const themedCanvas: Decorator = (Story) => (
  <div style={{ background: 'var(--bl-color-bg)', color: 'var(--bl-color-fg)', padding: '1rem' }}>
    <Story />
  </div>
);
