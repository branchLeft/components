import type { Meta, StoryObj } from '@storybook/react';
import { DesignTokensDocs } from './DesignTokensDocs';
import { publicPressTokens } from './publicPressTokens';

const meta = {
  title: 'Design Tokens/PublicPress',
  component: DesignTokensDocs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DesignTokensDocs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The PublicPress token set. Only the wordmark/logo mark itself (the four
 * ink blocks, Libre Franklin Bold) is a settled ruling — everything else
 * shown here as PROVISIONAL is a placeholder pending Rob's brand sketch,
 * mostly borrowed from branchLeft's own tokens so the shared structure has
 * something to render. See the components PR body's "Open questions for
 * Rob" for the full list of what's still undecided.
 */
export const Tokens: Story = {
  args: {
    tokens: publicPressTokens,
  },
};
