import type { Meta, StoryObj } from '@storybook/react';
import { PublicPressWordmark } from './PublicPressWordmark';

const meta = {
  title: 'Components/PublicPressWordmark',
  component: PublicPressWordmark,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: { type: 'inline-radio' },
      options: ['blue', 'black', 'pink', 'yellow'],
    },
    height: { control: 'text' },
    title: { control: 'text' },
    decorative: { control: 'boolean' },
  },
} satisfies Meta<typeof PublicPressWordmark>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every colour, with the interactive `color` control. The four stories
 * named after a colour pin their own and ignore it.
 */
export const Playground: Story = {
  args: {
    color: 'blue',
    height: 64,
  },
};

/** The default presentation: blue block, paper letters. */
export const Blue: Story = {
  // Renders its own colour whatever the args say, so a URL's
  // `args=color:...` cannot repaint a story named after a colour.
  argTypes: { color: { control: false } },
  render: (args) => <PublicPressWordmark {...args} color="blue" />,
  args: {
    color: 'blue',
    height: 64,
  },
};

/** Black block, paper letters. */
export const Black: Story = {
  // Renders its own colour whatever the args say, so a URL's
  // `args=color:...` cannot repaint a story named after a colour.
  argTypes: { color: { control: false } },
  render: (args) => <PublicPressWordmark {...args} color="black" />,
  args: {
    color: 'black',
    height: 64,
  },
};

/** Fluorescent pink block, white letters — not black-on-pink. */
export const Pink: Story = {
  // Renders its own colour whatever the args say, so a URL's
  // `args=color:...` cannot repaint a story named after a colour.
  argTypes: { color: { control: false } },
  render: (args) => <PublicPressWordmark {...args} color="pink" />,
  args: {
    color: 'pink',
    height: 64,
  },
};

/** Yellow block, black letters. */
export const Yellow: Story = {
  // Renders its own colour whatever the args say, so a URL's
  // `args=color:...` cannot repaint a story named after a colour.
  argTypes: { color: { control: false } },
  render: (args) => <PublicPressWordmark {...args} color="yellow" />,
  args: {
    color: 'yellow',
    height: 64,
  },
};

/** A CSS length instead of a pixel number — width still follows the aspect ratio. */
export const CssLengthHeight: Story = {
  args: {
    color: 'blue',
    height: '4rem',
  },
};

/** Marked decorative — hidden from assistive technology via `aria-hidden`. */
export const Decorative: Story = {
  args: {
    color: 'blue',
    height: 64,
    decorative: true,
  },
};
