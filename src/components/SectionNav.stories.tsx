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

/**
 * Demonstrates scroll-into-view behavior on a narrow viewport: when the user
 * scrolls down the page and a new section becomes active, the nav
 * automatically scrolls horizontally to keep the active link in view.
 *
 * View at 375px width to see the horizontal scroll bar. Scroll down to see
 * the nav follow the active section automatically.
 */
export const ScrollIntoViewOnNarrowViewport: Story = {
  args: {
    sections: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'background', label: 'Background' },
      { id: 'approach', label: 'Approach' },
      { id: 'results', label: 'Results' },
      { id: 'discussion', label: 'Discussion' },
    ],
  },
  parameters: {
    viewport: {
      defaultViewport: 'iphone12',
    },
  },
  render: (args) => (
    <div className="sb-scroll-demo">
      <SectionNav {...args} />
      {args.sections?.map((section) => (
        <section key={section.id} id={section.id} className="sb-section-content">
          <h2>{section.label}</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
            nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
            officia deserunt mollit anim id est laborum.
          </p>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
            laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
            architecto beatae vitae dicta sunt explicabo.
          </p>
        </section>
      ))}
    </div>
  ),
  decorators: [],
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

/**
 * Nested navigation built by the consumer as a dropdown, the same pattern
 * used for the "Solutions" item in the website's `NavBar` — native
 * `<details>/<summary>` for keyboard and screen-reader support, with no
 * hand-rolled ARIA state. SectionNav's `Section` type stays flat; a dropdown
 * item is composed alongside plain links using the same `bl-section-nav__link`
 * class hook so it matches the surrounding nav visually.
 */
export const NestedCustom: Story = {
  // `render` builds the markup directly below, so `args` is unused at
  // runtime — it's supplied only to satisfy `SectionNavProps.sections`,
  // which CSF3 requires even for stories that never read `context.args`.
  args: { sections: [] },
  render: () => (
    <nav className="sb-demo sb-nested-nav" aria-label="Page sections">
      <ul className="bl-section-nav__inner">
        <li>
          <a href="#overview" className="bl-section-nav__link">
            Overview
          </a>
        </li>
        <li>
          <details className="sb-nested-nav__details">
            <summary className="bl-section-nav__link sb-nested-nav__summary">
              <span>Values</span>
              <span className="sb-nested-nav__chevron" aria-hidden="true">
                ▾
              </span>
            </summary>
            <ul className="sb-nested-nav__submenu">
              <li>
                <a href="#values-people" className="sb-nested-nav__sublink">
                  People
                </a>
              </li>
              <li>
                <a href="#values-craft" className="sb-nested-nav__sublink">
                  Craft
                </a>
              </li>
              <li>
                <a href="#values-sustainability" className="sb-nested-nav__sublink">
                  Sustainability
                </a>
              </li>
            </ul>
          </details>
        </li>
        <li>
          <a href="#solutions" className="bl-section-nav__link">
            Solutions
          </a>
        </li>
        <li>
          <a href="#contact" className="bl-section-nav__link">
            Contact
          </a>
        </li>
      </ul>
    </nav>
  ),
};
