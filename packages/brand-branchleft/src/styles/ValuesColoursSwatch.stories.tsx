import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { ValuesColoursSwatch } from './ValuesColoursSwatch';
import '../styles';

// Storybook's docs-page "canvas" card paints a fixed light background
// around an embedded story, independent of the "theme" toolbar global — a
// brand stylesheet keyed off `data-theme` only recolours `html`/`body`, so
// its text colour goes white-on-white against that card. An inline style
// wins regardless of Storybook's own CSS. Deliberately NOT a shared helper
// with HtmlElements.stories.tsx's identical copy: sharing one across
// exactly these two stories was the one thing every entry that hit a
// CI-only (Linux) "ReferenceError: React is not defined" had in common —
// each file gets its own copy instead of chasing that further.
const themedCanvas: Decorator = (Story) => (
  <div style={{ background: 'var(--bl-color-bg)', color: 'var(--bl-color-fg)', padding: '1rem' }}>
    <Story />
  </div>
);

const meta = {
  title: 'branchLeft stylesheet/ValuesColours',
  component: ValuesColoursSwatch,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [themedCanvas],
} satisfies Meta<typeof ValuesColoursSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every named ValuesColour, each 4.5:1+ on the current mode's background
 * (see `branchleft.contrast.test.ts`). Use the "theme" toolbar to compare
 * dark vs light.
 */
export const Default: Story = {};
