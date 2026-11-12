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
  argTypes: {
    // A JSX fixture, not for editing: the Controls addon's default JSON-tree renderer
    // fails color-contrast in both themes, so plain-text columns are used instead
    // (see .storybook/README.md).
    children: {
      control: false,
      table: { type: { summary: 'ReactNode' }, defaultValue: { summary: undefined } },
    },
  },
} satisfies Meta<typeof PageTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

const demoDecorator: Decorator = (Story) => (
  <div className="sb-demo">
    <Story />
  </div>
);

/**
 * Fades and slides content in on mount (re-select the story to replay). The dashed box is Storybook-only,
 * showing the `flex: 1` layout consumers typically want via `bl-page-transition`.
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
