import { configureAxe } from 'vitest-axe';

/**
 * Shared axe instance for component a11y tests. Tests render a fragment, not a page, so axe's `region` rule
 * would fire on all of them; page landmarks are the consumer's job, so it is disabled here.
 */
export const axe: ReturnType<typeof configureAxe> = configureAxe({
  rules: {
    region: { enabled: false },

    // jsdom has no layout or computed colours, so axe's colour-contrast rule throws and logs a stack
    // trace; and this package ships almost no CSS, so contrast is the consumer's theme. The website's
    // Playwright + axe suite checks it in a real browser.
    'color-contrast': { enabled: false },
  },
});
