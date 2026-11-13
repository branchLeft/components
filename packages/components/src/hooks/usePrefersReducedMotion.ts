import * as React from 'react';

/**
 * Tracks `prefers-reduced-motion: reduce`. Returns false on the server (no preference is
 * available); on the client reads the query on first render, not a guess.
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
