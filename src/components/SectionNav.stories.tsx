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

/**
 * Nested navigation built by the consumer as a dropdown, the same pattern
 * used for the "Solutions" item in the website's `NavBar` — native
 * `<details>/<summary>` for keyboard and screen-reader support, with no
 * hand-rolled ARIA state. SectionNav's `Section` type stays flat; a dropdown
 * item is composed alongside plain links using the same `bl-section-nav__link`
 * class hook so it matches the surrounding nav visually.
 */
export const NestedCustom: Story = {
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
