import type { Meta, StoryObj } from '@storybook/react';
import { ValuesColoursSwatch } from './ValuesColoursSwatch';
import { themedCanvas } from '../../../../test-utils/ThemedCanvas';
import '../styles';

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
