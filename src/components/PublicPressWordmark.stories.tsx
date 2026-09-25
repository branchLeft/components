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

/** The default presentation: blue block, paper letters. */
export const Blue: Story = {
  args: {
    color: 'blue',
    height: 64,
  },
};

/** Black block, paper letters. */
export const Black: Story = {
  args: {
    color: 'black',
    height: 64,
  },
};

/** Fluorescent pink block, white letters — not black-on-pink. */
export const Pink: Story = {
  args: {
    color: 'pink',
    height: 64,
  },
};

/** Yellow block, black letters. */
export const Yellow: Story = {
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
