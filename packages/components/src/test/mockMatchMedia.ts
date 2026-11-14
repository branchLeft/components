import { vi } from 'vitest';

/**
 * Stubs `window.matchMedia` with a fake `MediaQueryList` and returns a `fire()` handle to
 * simulate a change. Listeners sit in a `Set`, not invoked eagerly.
 */
export function mockMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_type: 'change', listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: 'change', listener: () => void) => {
      listeners.delete(listener);
    },
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return {
    fire(next: boolean) {
      mql.matches = next;
      for (const listener of listeners) listener();
    },
  };
}
