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
    // Storybook plays the part of "the consumer" here — no real
    // server/cookie exists, so this is just the starting mode.
    theme: 'dark',
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * An icon button in a real `<form>`: with JavaScript it flips `data-theme` on `<html>` and writes
 * the theme cookie; without, the click submits the form to `action`.
 */
export const Default: Story = {};

/** Starting from light instead of the default dark. */
export const StartingLight: Story = {
  args: { theme: 'light' },
};

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
