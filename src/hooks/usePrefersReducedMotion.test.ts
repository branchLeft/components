import { describe, it, expect, vi, afterEach } from 'vitest';
import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mockMatchMedia(matches: boolean) {
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

let container: HTMLDivElement;
let root: Root;

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(): { value: boolean | undefined } {
  const result: { value: boolean | undefined } = { value: undefined };
  function Probe() {
    result.value = usePrefersReducedMotion();
    return null;
  }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(React.createElement(Probe)));
  return result;
}

describe('usePrefersReducedMotion', () => {
  it('reflects a false initial match', () => {
    mockMatchMedia(false);
    const result = mount();
    expect(result.value).toBe(false);
  });

  it('reflects a true initial match', () => {
    mockMatchMedia(true);
    const result = mount();
    expect(result.value).toBe(true);
  });

  it('updates when the media query change event fires', () => {
    const media = mockMatchMedia(false);
    const result = mount();
    expect(result.value).toBe(false);

    act(() => media.fire(true));
    expect(result.value).toBe(true);
  });
});
