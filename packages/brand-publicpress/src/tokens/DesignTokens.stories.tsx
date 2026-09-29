import type { Meta, StoryObj } from '@storybook/react';
import { DesignTokensDocs } from '../../../../test-utils/DesignTokensDocs';
import { publicPressTokens } from './publicPressTokens';

const meta = {
  title: 'Design Tokens/PublicPress',
  component: DesignTokensDocs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    // A fixed, whole-token-set fixture, not meant for interactive editing —
    // the Controls addon's default JSON-tree renderer for a non-primitive
    // value also fails color-contrast in both themes. Overriding the
    // type/default columns to plain text avoids that renderer entirely;
    // disabling the row outright (`table.disable`) isn't an option here —
    // `tokens` is this component's only prop, so an empty Args table falls
    // back to Storybook's own "couldn't be auto-generated" notice, which
    // has the same colour-contrast bug.
    tokens: {
      control: false,
      table: {
        type: { summary: 'DesignTokens' },
        defaultValue: { summary: 'publicPressTokens' },
      },
    },
  },
} satisfies Meta<typeof DesignTokensDocs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The PublicPress token set. Only the wordmark/logo mark itself (the four
 * ink blocks, Libre Franklin Bold) is a settled ruling — everything else
 * shown here as PROVISIONAL is a placeholder pending the brand owner's
 * brand sketch, mostly borrowed from branchLeft's own tokens so the shared
 * structure has something to render. See the components PR body's "Open
 * questions for the brand owner" for the full list of what's still
 * undecided.
 */
export const Tokens: Story = {
  args: {
    tokens: publicPressTokens,
  },
};
