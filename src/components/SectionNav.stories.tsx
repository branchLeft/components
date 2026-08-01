import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { SectionNav } from './SectionNav';
import './SectionNav.stories.css';

const meta = {
  title: 'Components/SectionNav',
  component: SectionNav,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionNav>;

export default meta;
type Story = StoryObj<typeof meta>;

const demoDecorator: Decorator = (Story) => (
  <div className="sb-demo">
    <Story />
  </div>
);

/**
 * With minimal demo CSS applied (not shipped — see the package's own
 * `bl-section-nav*` class hooks in the "Unstyled" story below).
 */
export const Default: Story = {
  args: {
    sections: [
      { id: 'overview', label: 'Overview' },
      { id: 'values', label: 'Values' },
      { id: 'solutions', label: 'Solutions' },
      { id: 'contact', label: 'Contact' },
    ],
    ariaLabel: 'Page sections',
  },
  decorators: [demoDecorator],
};

/** A longer list demonstrates the horizontal-scroll fallback consumers should provide on narrow screens. */
export const ManySections: Story = {
  args: {
    sections: [
      { id: 'one', label: 'Introduction' },
      { id: 'two', label: 'Background' },
      { id: 'three', label: 'Approach' },
      { id: 'four', label: 'Results' },
      { id: 'five', label: 'Discussion' },
      { id: 'six', label: 'Conclusion' },
      { id: 'seven', label: 'References' },
    ],
  },
  decorators: [demoDecorator],
};

/** Zero CSS applied — raw markup only, styled by nothing but the `bl-section-nav*` class hooks. */
export const Unstyled: Story = {
  args: {
    sections: [
      { id: 'overview', label: 'Overview' },
      { id: 'values', label: 'Values' },
      { id: 'solutions', label: 'Solutions' },
    ],
  },
};
