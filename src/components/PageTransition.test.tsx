import { describe, it, expect, vi, afterEach } from 'vitest';
import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { act } from 'react';
import { PageTransition } from './PageTransition';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// framer-motion's actual motion.div doesn't expose the transition it was
// given anywhere inspectable in the DOM, so the mock captures it directly —
// this is the only way to assert PageTransition picked the right duration.
let capturedTransition: { duration?: number; ease?: string } | undefined;

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      className,
      transition,
      children,
    }: {
      className?: string;
      transition?: { duration?: number; ease?: string };
      children?: React.ReactNode;
    }) => {
      capturedTransition = transition;
      return React.createElement('div', { className }, children);
    },
  },
}));

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as typeof window.matchMedia;
}

let mounted: { container: HTMLDivElement; root: Root } | undefined;

afterEach(() => {
  if (mounted) {
    act(() => mounted!.root.unmount());
    mounted.container.remove();
    mounted = undefined;
  }
  capturedTransition = undefined;
});

function mount(children: React.ReactNode): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(React.createElement(PageTransition, null, children)));
  mounted = { container, root };
  return container;
}

describe('PageTransition', () => {
  it('server-renders without touching matchMedia (SSR has no window preference to read)', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageTransition, null, React.createElement('p', null, 'Page content'))
    );
    expect(html).toContain('bl-page-transition');
    expect(html).toContain('Page content');
  });

  it('renders children inside the bl-page-transition class hook', () => {
    mockMatchMedia(false);
    const rendered = mount(React.createElement('p', null, 'Page content'));
    expect(rendered.querySelector('.bl-page-transition')).not.toBeNull();
    expect(rendered.textContent).toContain('Page content');
  });

  it('animates with a non-zero duration when no reduced-motion preference is set', () => {
    mockMatchMedia(false);
    mount(React.createElement('p', null, 'content'));
    expect(capturedTransition?.duration).toBe(0.3);
  });

  it('zeroes the transition duration when prefers-reduced-motion is set', () => {
    mockMatchMedia(true);
    mount(React.createElement('p', null, 'content'));
    expect(capturedTransition?.duration).toBe(0);
  });
});
