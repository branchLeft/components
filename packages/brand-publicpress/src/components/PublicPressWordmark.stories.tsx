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
    // No editable `color` control by default — a story named after a
    // colour (Blue, Black, Pink, Yellow) must always render that colour;
    // an editable control on the meta lets `&args=color:pink` in the URL
    // (via the docs page's shared Controls table, which drives the
    // primary/first story's canvas) repaint the "Blue" story pink while
    // its heading and description still say "Blue" — this is the one
    // mechanism found that reproduces exactly that report. `Playground`
    // below re-enables the control at the story level, on purpose.
    color: { control: false },
    height: { control: 'text' },
    title: { control: 'text' },
    decorative: { control: 'boolean' },
  },
} satisfies Meta<typeof PublicPressWordmark>;

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
    height: 64,
  },
};

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
