import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { PageTransition } from './PageTransition';
import './PageTransition.stories.css';

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

const demoDecorator: Decorator = (Story) => (
  <div className="sb-demo">
    <Story />
  </div>
);

/**
 * Fades and slides page content in on mount (re-select this story in the
 * sidebar to replay it). The dashed box is Storybook-only, demonstrating
 * the `flex: 1` layout consumers typically want — see the `bl-page-transition`
 * class hook.
 */
export const Default: Story = {
  args: {
    children: <p>Page content fades and slides up on mount.</p>,
  },
  decorators: [demoDecorator],
};

/** Zero CSS applied — the fade/slide animation itself is inline (framer-motion), so it still plays; only the `bl-page-transition` layout hook is missing. */
export const Unstyled: Story = {
  args: {
    children: <p>Page content fades and slides up on mount.</p>,
  },
};
