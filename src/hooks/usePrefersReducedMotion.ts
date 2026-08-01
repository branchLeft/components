import * as React from 'react';

/**
 * Tracks the `prefers-reduced-motion: reduce` media query.
 *
 * Assumes motion is fine on the initial/SSR render so animations aren't
 * stripped from the very first client paint; updates on subsequent renders
 * once the real media query value is known.
 */
export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      media.addEventListener('change', onStoreChange);
      return () => media.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );
}
