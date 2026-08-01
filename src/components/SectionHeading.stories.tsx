import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { SectionHeading } from './SectionHeading';
import './SectionHeading.stories.css';

const meta = {
  title: 'Components/SectionHeading',
  component: SectionHeading,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    as: {
      control: { type: 'inline-radio' },
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
    anchor: { control: 'text' },
    children: { control: 'text' },
  },
  args: {
    children: 'Values',
  },
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

const demoDecorator: Decorator = (Story) => (
  <div className="sb-demo">
    <Story />
  </div>
);

/** Plain heading — no anchor, no link, no interactivity. */
export const Plain: Story = {
  args: {
    as: 'h2',
    children: 'Plain heading',
  },
  decorators: [demoDecorator],
};

/** Anchored heading — clickable, resolves to `#values`, icon reveals on hover. */
export const WithAnchor: Story = {
  args: {
    as: 'h2',
    anchor: 'values',
    children: 'Values',
  },
  decorators: [demoDecorator],
};

/**
 * All heading levels, each with an anchor. Useful for visual regression across
 * type-scale ramps.
 */
export const AllLevels: Story = {
  decorators: [demoDecorator],
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SectionHeading as="h1" anchor="h1-example">
        Heading level 1
      </SectionHeading>
      <SectionHeading as="h2" anchor="h2-example">
        Heading level 2
      </SectionHeading>
      <SectionHeading as="h3" anchor="h3-example">
        Heading level 3
      </SectionHeading>
      <SectionHeading as="h4" anchor="h4-example">
        Heading level 4
      </SectionHeading>
      <SectionHeading as="h5" anchor="h5-example">
        Heading level 5
      </SectionHeading>
      <SectionHeading as="h6" anchor="h6-example">
        Heading level 6
      </SectionHeading>
    </div>
  ),
};

/**
 * The shipped CSS applied — spacing between the icon and text (when an
 * anchor is present) — but no styling. Hover/focus states and typography
 * are left to the consumer.
 */
export const Unstyled: Story = {
  args: {
    as: 'h2',
    anchor: 'values',
    children: 'Values',
  },
};
