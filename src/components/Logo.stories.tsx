import type { Meta, StoryObj } from '@storybook/react';
import { Logo } from './Logo';

const meta = {
  title: 'Components/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    overlayOpacity: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    mainColor: { control: 'object' },
    dropShadowColor: { control: 'object' },
    overlayColor: { control: 'object' },
    background: { control: 'object' },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All layers visible with branded colours — the default presentation. */
export const Default: Story = {};

/**
 * All layers white, on a black background.
 * Use for dark-mode or monochrome-on-dark contexts.
 */
export const MonoWhite: Story = {
  args: {
    mainColor: { type: 'monowhite' },
    dropShadowColor: { type: 'monowhite' },
    overlayColor: { type: 'monowhite' },
    background: { type: 'black' },
  },
};

/**
 * All layers black, on a white background.
 * Use for print or monochrome-on-light contexts.
 */
export const MonoBlack: Story = {
  args: {
    mainColor: { type: 'monoblack' },
    dropShadowColor: { type: 'monoblack' },
    overlayColor: { type: 'monoblack' },
    background: { type: 'white' },
  },
};

/** Branded logo on a full-viewport black background. */
export const DarkBackground: Story = {
  args: {
    background: { type: 'black' },
  },
};

/** Branded logo on a full-viewport white background. */
export const LightBackground: Story = {
  args: {
    background: { type: 'white' },
  },
};

/** Custom colour palette — deep navy/teal with a higher overlay opacity. */
export const CustomColors: Story = {
  args: {
    dropShadowColor: { type: 'custom', color: '#0a1628' },
    mainColor: { type: 'custom', color: '#0ea5e9' },
    overlayColor: { type: 'custom', color: '#38bdf8' },
    overlayOpacity: 0.35,
    background: { type: 'custom', color: '#020617' },
  },
};
