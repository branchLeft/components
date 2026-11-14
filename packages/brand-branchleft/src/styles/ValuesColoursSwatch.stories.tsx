import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { ValuesColoursSwatch } from './ValuesColoursSwatch';
import '../styles';

// Storybook's docs canvas paints a fixed light card regardless of the "theme" toolbar,
// so a `data-theme` stylesheet's white text goes white-on-white; an inline style wins.
// Deliberately a per-file copy, not a shared helper: sharing one was the common factor
// in the CI-only "React is not defined" failures.
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
 * Every named ValuesColour, each 4.5:1+ on the current mode's background (see
 * `branchleft.contrast.test.ts`). Use the "theme" toolbar to compare dark and light.
 */
export const Default: Story = {};
