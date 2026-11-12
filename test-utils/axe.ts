import { configureAxe } from 'vitest-axe';

/**
 * Shared axe instance for component a11y tests. Each test renders one component
 * as a fragment, not a page, so axe's `region` rule fires on all of them. Page
 * landmarks are the consumer's job, so the rule is disabled here, not per test.
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
