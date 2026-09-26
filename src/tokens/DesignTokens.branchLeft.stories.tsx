import type { Meta, StoryObj } from '@storybook/react';
import { DesignTokensDocs } from './DesignTokensDocs';
import { branchLeftTokens } from './branchLeftTokens';

const meta = {
  title: 'Design Tokens/branchLeft',
  component: DesignTokensDocs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DesignTokensDocs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The full branchLeft token set — colour (light/dark), type faces and
 * scale, spacing, radius and motion — extracted from `website/app/styles/`.
 * Entries marked PROVISIONAL are not settled by any written source (most
 * notably: the site is dark-only, so every "light" colour value here is a
 * guess, not a ruling) — see the components PR body's "Open questions for
 * the brand owner".
 */
export const Tokens: Story = {
  args: {
    tokens: branchLeftTokens,
  },
};
