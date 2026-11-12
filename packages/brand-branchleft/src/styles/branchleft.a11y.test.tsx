// @vitest-environment node
// Starts in Node, not the jsdom default: `beforeAll` builds the stylesheet with vite
// first, then installs jsdom's globals so axe runs on real DOM and CSS (see README.md).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { builtinEnvironments } from 'vitest/runtime';
import * as React from 'react';
import { act } from 'react';
import { buildStylesheet } from './testUtils/buildStylesheet';
import { installLocalStorage } from '../../../../test-utils/localstorage-setup';
import { axe } from '../../../../test-utils/axe';
import { HtmlElements } from './HtmlElements';

let teardownJsdom: (() => unknown) | undefined;
let createRoot: (typeof import('react-dom/client'))['createRoot'];
let ThemeToggle: (typeof import('@branchleft/components'))['ThemeToggle'];

beforeAll(async () => {
  const css = await buildStylesheet();

  const { teardown } = await builtinEnvironments.jsdom.setup(globalThis, {});
  teardownJsdom = () => teardown(globalThis);
  // jsdom's setup skips `localStorage` when Node's experimental global of that name exists, as in
  // `test-utils/localstorage-setup.ts`; called directly because jsdom is installed after setupFiles ran.
  installLocalStorage();

  // Imported dynamically AFTER jsdom's globals exist: react-dom/client and @branchleft/components touch
  // `document`/`window` at module-evaluation or first-render time, so an earlier import could capture absent globals.
  ({ createRoot } = await import('react-dom/client'));
  ({ ThemeToggle } = await import('@branchleft/components'));

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}, 30_000);

afterAll(async () => {
  await teardownJsdom?.();
});

function mount(children: React.ReactNode): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(children));
  return container;
}

describe.each(['dark', 'light'] as const)('branchleft stylesheet a11y — %s mode', (mode) => {
  it('the HTML-elements showcase and ThemeToggle have no axe violations', async () => {
    if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    const container = mount(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(ThemeToggle, { action: '/theme', theme: mode }),
        React.createElement(HtmlElements)
      )
    );

    try {
      // jsdom has no layout or computed colours, so axe's `color-contrast` rule is disabled globally
      // (`test-utils/axe.ts`): this proves structure/semantics/ARIA only. `branchleft.contrast.test.ts`
      // proves colour readability against the built CSS.
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    } finally {
      container.remove();
    }
  });
});
