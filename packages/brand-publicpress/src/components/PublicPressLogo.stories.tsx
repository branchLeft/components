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
    // No editable `color` control by default — see
    // PublicPressWordmark.stories.tsx's identical comment for why.
    // `Playground` below re-enables it at the story level, on purpose.
    color: { control: false },
    height: { control: 'text' },
    title: { control: 'text' },
    decorative: { control: 'boolean' },
  },
} satisfies Meta<typeof PublicPressLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every colour, with the interactive `color` control — the only story
 * here where changing it is the point. Every other story below pins its
 * own colour and cannot be changed via args/the URL.
 */
export const Playground: Story = {
  argTypes: {
    color: {
      control: { type: 'inline-radio' },
      options: ['blue', 'black', 'pink', 'yellow'],
    },
  },
  args: {
    color: 'blue',
    height: 96,
  },
};

/** The default presentation: blue block, paper pilcrow P. */
export const Blue: Story = {
  args: {
    color: 'blue',
    height: 96,
  },
};

/** Black block, paper pilcrow P. */
export const Black: Story = {
  args: {
    color: 'black',
    height: 96,
  },
};

/** Fluorescent pink block, white pilcrow P — not black-on-pink. */
export const Pink: Story = {
  args: {
    color: 'pink',
    height: 96,
  },
};

/** Yellow block, black pilcrow P. */
export const Yellow: Story = {
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
