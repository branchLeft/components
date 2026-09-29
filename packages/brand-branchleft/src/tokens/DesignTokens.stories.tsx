import type { Meta, StoryObj } from '@storybook/react';
import { DesignTokensDocs } from '../../../../test-utils/DesignTokensDocs';
import { branchLeftTokens } from './branchLeftTokens';

const meta = {
  title: 'Design Tokens/branchLeft',
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
      table: { type: { summary: 'DesignTokens' }, defaultValue: { summary: 'branchLeftTokens' } },
    },
  },
} satisfies Meta<typeof DesignTokensDocs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The full branchLeft token set — colour (light/dark), type faces and
 * scale, spacing, radius and motion — extracted from `website/app/styles/`
 * and this package's own settled stylesheet. Entries still marked
 * PROVISIONAL are not settled by any written source or ruling yet.
 */
export const Tokens: Story = {
  args: {
    tokens: branchLeftTokens,
  },
};
