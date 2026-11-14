import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { HtmlElements } from './HtmlElements';
import '../styles';

// Storybook's docs canvas paints a fixed light card regardless of the "theme" toolbar, so a
// `data-theme` stylesheet's white text goes white-on-white; an inline style wins. Not shared with
// ValuesColoursSwatch.stories.tsx's identical copy (see its comment).
const themedCanvas: Decorator = (Story) => (
  <div style={{ background: 'var(--bl-color-bg)', color: 'var(--bl-color-fg)', padding: '1rem' }}>
    <Story />
  </div>
);

const meta = {
  title: 'branchLeft stylesheet/HTML elements',
  component: HtmlElements,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [themedCanvas],
} satisfies Meta<typeof HtmlElements>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One of every element `elements.css` defaults. Use the "theme" toolbar to switch dark (default) and light;
 * a11y checks run against both.
 */
export const Default: Story = {};

/**
 * `elements.css` sets no `font-size`/`color` on a bare `<p>`/`<li>`, so an ancestor's
 * values inherit through; each paragraph below should match its own parent.
 */
export const InheritsFromAnAncestor: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ fontSize: '2rem', color: 'var(--bl-value-environment)' }}>
        <p>
          This parent sets a 2rem font size and the "environment" ValuesColour — this paragraph has
          no font-size or colour of its own, so it inherits both from here.
        </p>
      </div>
      <div style={{ fontSize: '0.75rem' }}>
        <p>This parent only sets a 0.75rem font size — this paragraph inherits just that.</p>
      </div>
    </div>
  ),
};
