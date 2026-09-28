import type { Meta, StoryObj } from '@storybook/react';
import {
  Leaf,
  Users,
  Sparkles,
  Lightbulb,
  Eye,
  Award,
  HeartHandshake,
  ShieldCheck,
  TrendingUp,
  Globe,
} from 'lucide-react';
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

const extendedValues: readonly Value[] = [
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
  {
    title: 'Innovation',
    accent: 'innovation',
    icon: Lightbulb,
    body: 'We explore new approaches and technologies thoughtfully.',
  },
  {
    title: 'Transparency',
    accent: 'transparency',
    icon: Eye,
    body: 'We communicate openly with our team and customers.',
  },
  {
    title: 'Excellence',
    accent: 'excellence',
    icon: Award,
    body: 'We strive for high quality in everything we do.',
  },
  {
    title: 'Collaboration',
    accent: 'collaboration',
    icon: HeartHandshake,
    body: 'We work together to achieve shared goals.',
  },
  {
    title: 'Integrity',
    accent: 'integrity',
    icon: ShieldCheck,
    body: 'We uphold our values even when it is difficult.',
  },
  {
    title: 'Growth',
    accent: 'growth',
    icon: TrendingUp,
    body: 'We continuously learn and improve ourselves.',
  },
  {
    title: 'Community',
    accent: 'community',
    icon: Globe,
    body: 'We support and lift up those around us.',
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
 * Per-value accent colours: each value can have its own colour by targeting
 * the `data-accent` attribute with your CSS, loaded after the package's CSS.
 * This demo sets a different colour for each value via `--value-accent`, so
 * you see green for sustainability, blue for people, and orange for craft.
 * Consumers can use this to create a visual hierarchy or match brand colours.
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

/**
 * Ten values showing how the cloud scales with more entries. The ring
 * automatically distributes them evenly, and scrollspy still works on small
 * screens with the accordion layout.
 */
export const ManyValues: Story = {
  args: {
    values: extendedValues,
    ariaLabel: 'Core values',
  },
};
