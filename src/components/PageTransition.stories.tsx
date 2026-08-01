import type { Meta, StoryObj } from '@storybook/react';
import { PageTransition } from './PageTransition';

const meta = {
  title: 'Components/PageTransition',
  component: PageTransition,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fades and slides page content in on mount. Re-mount (e.g. change the key in Storybook's canvas) to replay it. */
export const Default: Story = {
  args: {
    children: <p>Page content fades and slides up on mount.</p>,
  },
};
