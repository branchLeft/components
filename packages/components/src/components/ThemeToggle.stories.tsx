import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from './ThemeToggle';

const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    // Storybook has no server to post to — clicking still works (this
    // story exercises the JS-enhanced path, which preventDefaults the
    // navigation before it would ever reach this URL).
    action: '/theme',
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * An icon button inside a real `<form>`. With JavaScript (as here in
 * Storybook), clicking flips `data-theme` on `<html>` instantly and writes
 * the theme cookie via `document.cookie` — open this story's HTML panel to
 * see the attribute change. With JavaScript disabled, the same click would
 * instead submit the form to `action`, for the consumer's server to handle.
 */
export const Default: Story = {};

/**
 * Both accessible-name strings ("switch to light" / "switch to dark")
 * overridden by props.
 */
export const CustomLabels: Story = {
  args: {
    switchToLightLabel: 'Go light',
    switchToDarkLabel: 'Go dark',
  },
};
