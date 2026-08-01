import type { Meta, StoryObj } from '@storybook/react';
import { Leaf, Users, Sparkles } from 'lucide-react';
import { ValuesCloud, type Value } from './ValuesCloud';
import './ValuesCloud.css';

const meta = {
  title: 'Components/ValuesCloud',
  component: ValuesCloud,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ValuesCloud>;

export default meta;
type Story = StoryObj<typeof meta>;

const values: readonly Value[] = [
  {
    title: 'Sustainability',
    accent: 'sustainability',
    icon: Leaf,
    body: 'We plan for the long term, not just the next release.',
  },
  {
    title: 'People',
    accent: 'people',
    icon: Users,
    body: 'The people building and using the product come first.',
  },
  {
    title: 'Craft',
    accent: 'craft',
    icon: Sparkles,
    body: 'We care about how something is built, not just that it ships.',
  },
];

/**
 * With the package's shipped CSS (`import '@branchleft/components/css'`)
 * applied — every node shares the same fallback accent colour here since
 * no `[data-accent='...']` overrides are defined. See the "Unstyled" story
 * for what you get with zero CSS.
 */
export const Default: Story = {
  args: {
    values,
    ariaLabel: 'Values',
  },
};

/**
 * The same data with per-value accent colours, set the way a consumer
 * would: `[data-accent='craft'] { --value-accent: ... }` loaded after the
 * package CSS.
 */
export const CustomAccents: Story = {
  args: {
    values,
    ariaLabel: 'Values',
  },
  decorators: [
    (Story) => (
      <>
        <style>{`
          [data-accent='sustainability'] { --value-accent: #2f9e44; }
          [data-accent='people'] { --value-accent: #1c7ed6; }
          [data-accent='craft'] { --value-accent: #f08c00; }
        `}</style>
        <Story />
      </>
    ),
  ],
};

/** The idle floating animation on ring nodes turned off via `disableWiggle`. */
export const NoWiggle: Story = {
  args: {
    values,
    ariaLabel: 'Values',
    disableWiggle: true,
  },
};
