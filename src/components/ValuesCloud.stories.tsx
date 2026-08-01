import type { Meta, StoryObj } from '@storybook/react';
import { Leaf, Users, Sparkles } from 'lucide-react';
import { ValuesCloud, type Value } from './ValuesCloud';

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
 * A minimal set of values with icons. The consumer's CSS supplies the
 * `--value-accent` colour for each `data-accent` and the ring/accordion
 * layout — see the component doc for the full class-hook list.
 */
export const Default: Story = {
  args: {
    values,
    ariaLabel: 'Values',
  },
};
