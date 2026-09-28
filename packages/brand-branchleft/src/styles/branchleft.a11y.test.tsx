// @vitest-environment node
//
// Starts in the plain Node environment (this package's vitest.config.ts
// default is jsdom — this override matters here): `beforeAll` first
// builds the stylesheet via vite's `build()` (esbuild under the hood),
// which needs an untouched `TextEncoder`/`Uint8Array` — jsdom's polyfills
// for those break it (see the sibling `branchleft.*.test.ts` files in this
// directory) — and only installs jsdom's own globals, via vitest's own
// jsdom environment setup, once that build step is done. That keeps this
// one file able to do both: build real CSS AND render real DOM to run axe
// against, which a pure `@vitest-environment jsdom` file couldn't (no
// esbuild) and a pure node one couldn't either (no DOM).
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
  // jsdom's environment setup skips installing `localStorage` if
  // Node's own experimental global of that name already exists (see the
  // installLocalStorage's own header comment) — same fix as the shared
  // `test-utils/localstorage-setup.ts` setupFile applies elsewhere,
  // called directly here since jsdom is installed after this file's
  // module-level setupFiles already ran.
  installLocalStorage();

  // Imported dynamically, AFTER jsdom's globals exist: react-dom/client
  // and @branchleft/components (rendered via React DOM) both touch
  // `document`/`window` at module-evaluation or first-render time, so
  // importing them before jsdom is installed risks capturing the wrong
  // (absent) globals.
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
        React.createElement(ThemeToggle, { action: '/theme' }),
        React.createElement(HtmlElements)
      )
    );

    try {
      // jsdom does not implement layout or resolve computed colours —
      // `test-utils/axe.ts` disables axe's `color-contrast` rule globally
      // for exactly that reason. This test proves structure/semantics/ARIA
      // are sound in both modes; it does NOT and cannot prove colours are
      // readable — `branchleft.contrast.test.ts` is what proves that,
      // against the real built CSS's resolved values.
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    } finally {
      container.remove();
    }
  });
});
