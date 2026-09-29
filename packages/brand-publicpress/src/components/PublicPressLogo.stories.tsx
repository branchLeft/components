import type { Meta, StoryObj } from '@storybook/react';
import { PublicPressLogo } from './PublicPressLogo';

const meta = {
  title: 'Components/PublicPressLogo',
  component: PublicPressLogo,
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
} satisfies Meta<typeof PublicPressLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every colour, with the interactive `color` control. The four stories
 * named after a colour pin their own and ignore it.
 */
export const Playground: Story = {
  args: {
    color: 'blue',
    height: 96,
  },
};

/** The default presentation: blue block, paper pilcrow P. */
export const Blue: Story = {
  // Renders its own colour whatever the args say, so a URL's
  // `args=color:...` cannot repaint a story named after a colour.
  argTypes: { color: { control: false } },
  render: (args) => <PublicPressLogo {...args} color="blue" />,
  args: {
    color: 'blue',
    height: 96,
  },
};

/** Black block, paper pilcrow P. */
export const Black: Story = {
  // Renders its own colour whatever the args say, so a URL's
  // `args=color:...` cannot repaint a story named after a colour.
  argTypes: { color: { control: false } },
  render: (args) => <PublicPressLogo {...args} color="black" />,
  args: {
    color: 'black',
    height: 96,
  },
};

/** Fluorescent pink block, white pilcrow P — not black-on-pink. */
export const Pink: Story = {
  // Renders its own colour whatever the args say, so a URL's
  // `args=color:...` cannot repaint a story named after a colour.
  argTypes: { color: { control: false } },
  render: (args) => <PublicPressLogo {...args} color="pink" />,
  args: {
    color: 'pink',
    height: 96,
  },
};

/** Yellow block, black pilcrow P. */
export const Yellow: Story = {
  // Renders its own colour whatever the args say, so a URL's
  // `args=color:...` cannot repaint a story named after a colour.
  argTypes: { color: { control: false } },
  render: (args) => <PublicPressLogo {...args} color="yellow" />,
  args: {
    color: 'yellow',
    height: 96,
  },
};

/** A CSS length instead of a pixel number — the mark stays square. */
export const CssLengthHeight: Story = {
  args: {
    color: 'blue',
    height: '5rem',
  },
};

/** Marked decorative — hidden from assistive technology via `aria-hidden`. */
export const Decorative: Story = {
  args: {
    color: 'blue',
    height: 96,
    decorative: true,
  },
};
