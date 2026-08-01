import type { Meta, StoryObj } from '@storybook/react';
import { SectionNav } from './SectionNav';

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

/** Default sticky in-page nav with a handful of sections. */
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
};
