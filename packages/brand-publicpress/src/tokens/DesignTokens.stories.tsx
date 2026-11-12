import type { Meta, StoryObj } from '@storybook/react';
import { DesignTokensDocs } from '../../../../test-utils/DesignTokensDocs';
import { publicPressTokens } from './publicPressTokens';
// Loads Jost + Courier Prime so the type specimens render in the real
// faces, not a fallback; fonts.css holds only @font-face rules, no element
// styles.
import '../styles/fonts.css';

const meta = {
  title: 'Design Tokens/PublicPress',
  component: DesignTokensDocs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    // Fixed fixture, not for editing: the Controls addon's default JSON-tree renderer
    // fails color-contrast in both themes, so plain-text columns are used instead
    // (see .storybook/README.md).
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
 * The PublicPress token set. Only the wordmark/logo (four ink blocks, Libre Franklin Bold) is a settled
 * ruling; everything shown as PROVISIONAL is a placeholder, mostly borrowed from branchLeft's tokens.
 */
export const Tokens: Story = {
  args: {
    tokens: publicPressTokens,
  },
};
