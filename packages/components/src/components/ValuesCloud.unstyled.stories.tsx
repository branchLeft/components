import type { Meta, StoryObj } from '@storybook/react';
import { Leaf, Users, Sparkles } from 'lucide-react';
import { ValuesCloud, type Value } from './ValuesCloud';
// Deliberately no `import './ValuesCloud.css'` here — this file demonstrates
// the component with zero CSS applied. Keep it in its own module so
// Storybook never loads the styled story's CSS import alongside it.

const meta = {
  title: 'Components/ValuesCloud',
  component: ValuesCloud,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ValuesCloud>;

export default meta;
type Story = StoryObj<typeof meta>;

const values: readonly Value[] = [
  { title: 'Sustainability', accent: 'sustainability', icon: Leaf },
  { title: 'People', accent: 'people', icon: Users },
  { title: 'Craft', accent: 'craft', icon: Sparkles },
];

/**
 * Zero CSS applied — raw markup only. `ValuesCloud`'s ring layout depends
 * on real positioning rules, so without `@branchleft/components/css` (or
 * your own equivalent) this is what you get: everything stacked in
 * document order. Import the package CSS (see the "Default" story) or
 * write your own against the `bl-values-cloud*` class hooks.
 */
export const Unstyled: Story = {
  args: {
    values,
    ariaLabel: 'Values',
  },
};
