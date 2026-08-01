import * as React from 'react';

/**
 * Tracks the `prefers-reduced-motion: reduce` media query.
 *
 * On the server (SSR), returns false since no user preference is available
 * and animations don't run in the HTML output anyway. On the client, reads
 * the media query on first render (not a guess), so `PageTransition` and
 * similar components zero their animation durations when the preference
 * is set — including in test environments where Playwright emulates it.
 */
export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') {
        return () => {};
      }
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      media.addEventListener('change', onStoreChange);
      return () => media.removeEventListener('change', onStoreChange);
    },
    () =>
      typeof window === 'undefined'
        ? false
        : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );
}
