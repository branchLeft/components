import { configureAxe } from 'vitest-axe';

/**
 * Shared `axe` instance for component-level a11y tests.
 *
 * These tests render a single component's markup in isolation via
 * `renderToStaticMarkup`, not a full page. Axe's `region` rule ("all page
 * content must be contained by a landmark") fires on every such fragment
 * regardless of whether the component itself is accessible — a real page
 * assembled from these components supplies that landmark structure at the
 * page level, which is the consumer's responsibility (see CLAUDE.md
 * "Site-level theming is the consumer's job, not this package's" — the same
 * split applies to page landmarks). Disabled globally here rather than
 * worked around per test.
 */
export const axe: ReturnType<typeof configureAxe> = configureAxe({
  rules: {
    region: { enabled: false },

    // jsdom does not implement layout or resolve computed colours, so
    // axe's colour-contrast rule throws internally on every run and logs a
    // stack trace before reporting "incomplete" rather than a violation.
    // It could not produce a meaningful result here anyway: this package
    // ships almost no CSS by design, so a component's real contrast is
    // decided entirely by the consumer's theme. The website's Playwright +
    // axe suite checks contrast in a real browser against real tokens,
    // which is the only place the answer is knowable.
    'color-contrast': { enabled: false },
  },
});
