import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from '../../../../test-utils/axe';
import { ThemeToggle, THEME_STORAGE_KEY, themeInitScript } from './ThemeToggle';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let mounted: { container: HTMLDivElement; root: Root } | undefined;

function mount(children: React.ReactNode): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(children));
  mounted = { container, root };
  return container;
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  if (mounted) {
    act(() => mounted!.root.unmount());
    mounted.container.remove();
    mounted = undefined;
  }
  document.documentElement.removeAttribute('data-theme');
});

describe('ThemeToggle', () => {
  it('defaults to dark: no stored preference renders aria-pressed=false and sets no light attribute', () => {
    const container = mount(React.createElement(ThemeToggle));
    const button = container.querySelector('button')!;
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('renders the default label as both visible text and accessible name', () => {
    const container = mount(React.createElement(ThemeToggle));
    const button = container.querySelector('button')!;
    expect(button.textContent).toBe('Toggle colour theme');
  });

  it('accepts a custom label', () => {
    const container = mount(React.createElement(ThemeToggle, { label: 'Switch theme' }));
    const button = container.querySelector('button')!;
    expect(button.textContent).toBe('Switch theme');
  });

  it('toggles data-theme and aria-pressed on click, back and forth', () => {
    const container = mount(React.createElement(ThemeToggle));
    const button = container.querySelector('button')!;

    act(() => button.click());
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(button.getAttribute('aria-pressed')).toBe('true');

    act(() => button.click());
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('persists the choice to localStorage under THEME_STORAGE_KEY', () => {
    const container = mount(React.createElement(ThemeToggle));
    const button = container.querySelector('button')!;

    act(() => button.click());
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    act(() => button.click());
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('reads a stored "light" preference on mount', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const container = mount(React.createElement(ThemeToggle));
    const button = container.querySelector('button')!;
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('falls back to dark when a stored value is neither "dark" nor "light"', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'not-a-theme');
    const container = mount(React.createElement(ThemeToggle));
    const button = container.querySelector('button')!;
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('still renders and defaults to dark when localStorage.getItem throws', () => {
    const original = window.localStorage.getItem;
    window.localStorage.getItem = () => {
      throw new Error('storage disabled');
    };
    try {
      const container = mount(React.createElement(ThemeToggle));
      const button = container.querySelector('button')!;
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    } finally {
      window.localStorage.getItem = original;
    }
  });

  it('does not throw when localStorage.setItem throws on toggle', () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error('quota exceeded');
    };
    try {
      const container = mount(React.createElement(ThemeToggle));
      const button = container.querySelector('button')!;
      expect(() => act(() => button.click())).not.toThrow();
      // The DOM attribute (this session's live state) still flips even
      // though persistence silently failed.
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    } finally {
      window.localStorage.setItem = original;
    }
  });

  it('has no axe violations', async () => {
    const html = renderToStaticMarkup(React.createElement(ThemeToggle));
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });

  describe('themeInitScript', () => {
    it('is a self-invoking function expression with no import/export syntax', () => {
      expect(themeInitScript.trim().startsWith('(function ()')).toBe(true);
      expect(themeInitScript).not.toMatch(/\bimport\b|\bexport\b/);
    });

    it('references the same storage key the component reads/writes', () => {
      expect(themeInitScript).toContain(JSON.stringify(THEME_STORAGE_KEY));
    });

    it('sets data-theme="light" before paint when evaluated with a stored light preference', () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
      document.documentElement.removeAttribute('data-theme');

      // Exercises the exact runtime string a consumer would inline into
      // <head>, not a hand-written equivalent.
      new Function(themeInitScript)();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('leaves data-theme unset when there is no stored preference (dark default, no flash)', () => {
      document.documentElement.removeAttribute('data-theme');

      new Function(themeInitScript)();

      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    });

    it('does not throw when localStorage.getItem throws inside the init script', () => {
      const original = window.localStorage.getItem;
      window.localStorage.getItem = () => {
        throw new Error('storage disabled');
      };
      try {
        expect(() => new Function(themeInitScript)()).not.toThrow();
        expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
      } finally {
        window.localStorage.getItem = original;
      }
    });
  });
});
