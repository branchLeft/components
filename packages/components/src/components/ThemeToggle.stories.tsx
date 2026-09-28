import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from './ThemeToggle';

const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Click to flip `data-theme` on `<html>` between `"dark"` and `"light"` —
 * open this story's HTML panel to see the attribute change. The choice
 * persists to `localStorage`, so reloading Storybook keeps whichever mode
 * was last picked.
 */
export const Default: Story = {
  args: {},
};

/**
 * A consumer-supplied label overrides the default accessible name/visible
 * text.
 */
export const CustomLabel: Story = {
  args: { label: 'Switch theme' },
};
