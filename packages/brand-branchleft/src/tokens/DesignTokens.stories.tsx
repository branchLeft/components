import type { Meta, StoryObj } from '@storybook/react';
import { DesignTokensDocs } from '../../../../test-utils/DesignTokensDocs';
import { branchLeftTokens } from './branchLeftTokens';
// Loads the four families so the type specimens render in the real faces,
// not a fallback; fonts.css holds only @font-face rules, no element styles.
import '../styles/fonts.css';

const meta = {
  title: 'Design Tokens/branchLeft',
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
      table: { type: { summary: 'DesignTokens' }, defaultValue: { summary: 'branchLeftTokens' } },
    },
  },
} satisfies Meta<typeof DesignTokensDocs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The full branchLeft token set (colour, type, spacing, radius, motion), from the website styles and this
 * package's stylesheet. Entries marked PROVISIONAL are not settled by any written source or ruling.
 */
export const Tokens: Story = {
  args: {
    tokens: branchLeftTokens,
  },
};
