import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { HtmlElements } from './HtmlElements';
import '../styles';

// Storybook's docs-page "canvas" card paints a fixed light background
// around an embedded story, independent of the "theme" toolbar global — a
// brand stylesheet keyed off `data-theme` only recolours `html`/`body`, so
// its text colour goes white-on-white against that card. An inline style
// wins regardless of Storybook's own CSS. Not shared with
// ValuesColoursSwatch.stories.tsx's identical copy — see that file's own
// comment for why.
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
 * One of every element `elements.css` defines a default for. Use the
 * "theme" toolbar (top of the Storybook toolbar) to switch between dark
 * (the default) and light — a11y/axe checks run against both.
 */
export const Default: Story = {};

/**
 * `elements.css` deliberately does NOT set `font-size`/`color` on a bare
 * `<p>`/`<li>`/etc. (only on `html`/`body`), so a consumer's own ancestor-
 * based sizing/colouring inherits through it undisturbed.
 *
 * This story is that claim made visible: the two paragraphs below have no
 * classes/styling of their own — only their parent's `font-size`/`color`
 * differ, and each should visibly match its own parent.
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
