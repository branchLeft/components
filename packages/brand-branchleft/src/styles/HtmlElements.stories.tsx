import type { Meta, StoryObj } from '@storybook/react';
import { HtmlElements } from './HtmlElements';
import '../styles';

const meta = {
  title: 'branchLeft stylesheet/HTML elements',
  component: HtmlElements,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HtmlElements>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One of every element `elements.css` defines a default for. Use the
 * "theme" toolbar (top of the Storybook toolbar) to switch between dark
 * (the default) and light — a11y/axe checks run against both.
 */
export const Default: Story = {};
