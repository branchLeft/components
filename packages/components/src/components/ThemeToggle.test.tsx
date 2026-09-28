import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from '../../../../test-utils/axe';
import {
  ThemeToggle,
  THEME_STORAGE_KEY,
  THEME_COOKIE_NAME,
  parseThemeCookie,
  themeInitScript,
} from './ThemeToggle';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ACTION = '/theme';

let mounted: { container: HTMLDivElement; root: Root } | undefined;

function mount(children: React.ReactNode): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(children));
  mounted = { container, root };
  return container;
}

function clearThemeCookie(): void {
  document.cookie = `${THEME_COOKIE_NAME}=; Path=/; Max-Age=0`;
}

function readThemeCookie(): string | undefined {
  return document.cookie
    .split(';')
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(`${THEME_COOKIE_NAME}=`))
    ?.slice(THEME_COOKIE_NAME.length + 1);
}

beforeEach(() => {
  window.localStorage.clear();
  clearThemeCookie();
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  if (mounted) {
    act(() => mounted!.root.unmount());
    mounted.container.remove();
    mounted = undefined;
  }
  window.localStorage.clear();
  clearThemeCookie();
  document.documentElement.removeAttribute('data-theme');
});

describe('ThemeToggle', () => {
  it('renders a real form posting to `action`, with a submit button named/valued for the mode to switch TO', () => {
    const container = mount(React.createElement(ThemeToggle, { action: ACTION }));
    const form = container.querySelector('form')!;
    const button = container.querySelector('button')!;

    expect(form.getAttribute('method')).toBe('post');
    expect(form.getAttribute('action')).toBe(ACTION);
    expect(button.getAttribute('type')).toBe('submit');
    expect(button.getAttribute('name')).toBe('theme');
    // No data-theme set yet ⇒ this render assumes dark ⇒ next mode is light.
    expect(button.getAttribute('value')).toBe('light');
  });

  it('reflects an initial data-theme="light" already on <html> at mount, rather than assuming dark', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    const container = mount(React.createElement(ThemeToggle, { action: ACTION }));

    const button = container.querySelector('button')!;
    // Currently light ⇒ next mode (this button's value/action) is dark.
    expect(button.getAttribute('value')).toBe('dark');
  });

  it('has no aria-pressed attribute', () => {
    const container = mount(React.createElement(ThemeToggle, { action: ACTION }));
    expect(container.querySelector('button')!.hasAttribute('aria-pressed')).toBe(false);
  });

  it('the accessible name flips between the two labels depending on the starting mode', () => {
    const darkContainer = document.createElement('div');
    document.body.appendChild(darkContainer);
    const darkRoot = createRoot(darkContainer);
    act(() => darkRoot.render(React.createElement(ThemeToggle, { action: ACTION })));
    // Assumed-dark render ⇒ offers to switch to light.
    expect(darkContainer.querySelector('button')!.getAttribute('aria-label')).toBe(
      'Switch to light mode'
    );
    act(() => darkRoot.unmount());
    darkContainer.remove();

    document.documentElement.setAttribute('data-theme', 'light');
    const container = mount(React.createElement(ThemeToggle, { action: ACTION }));
    expect(container.querySelector('button')!.getAttribute('aria-label')).toBe(
      'Switch to dark mode'
    );
  });

  it('reflects a light starting state via the label, read from <html> at mount', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    const container = mount(React.createElement(ThemeToggle, { action: ACTION }));
    expect(container.querySelector('button')!.getAttribute('aria-label')).toBe(
      'Switch to dark mode'
    );
  });

  it('accepts custom labels for both directions', () => {
    const container = mount(
      React.createElement(ThemeToggle, {
        action: ACTION,
        switchToLightLabel: 'Go light',
        switchToDarkLabel: 'Go dark',
      })
    );
    expect(container.querySelector('button')!.getAttribute('aria-label')).toBe('Go light');

    document.documentElement.setAttribute('data-theme', 'light');
    const container2 = mount(
      React.createElement(ThemeToggle, {
        action: ACTION,
        switchToLightLabel: 'Go light',
        switchToDarkLabel: 'Go dark',
      })
    );
    expect(container2.querySelector('button')!.getAttribute('aria-label')).toBe('Go dark');
  });

  it('switches data-theme and writes THEME_COOKIE_NAME when JS handles the submit', () => {
    const container = mount(React.createElement(ThemeToggle, { action: ACTION }));
    const form = container.querySelector('form')!;

    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(readThemeCookie()).toBe('light');

    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(readThemeCookie()).toBe('dark');
  });

  it('also writes THEME_STORAGE_KEY on submit, for back-compat with the no-server localStorage path', () => {
    const container = mount(React.createElement(ThemeToggle, { action: ACTION }));
    const form = container.querySelector('form')!;

    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('prevents the default form navigation once JS handles the submit', () => {
    const container = mount(React.createElement(ThemeToggle, { action: ACTION }));
    const form = container.querySelector('form')!;
    const event = new Event('submit', { bubbles: true, cancelable: true });

    act(() => {
      form.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
  });

  it('has no axe violations', async () => {
    const html = renderToStaticMarkup(React.createElement(ThemeToggle, { action: ACTION }));
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });

  describe('themeInitScript (legacy, no-server path)', () => {
    it('is a self-invoking function expression with no import/export syntax', () => {
      expect(themeInitScript.trim().startsWith('(function ()')).toBe(true);
      expect(themeInitScript).not.toMatch(/\bimport\b|\bexport\b/);
    });

    it('references the same storage key THEME_STORAGE_KEY names', () => {
      expect(themeInitScript).toContain(JSON.stringify(THEME_STORAGE_KEY));
    });

    it('sets data-theme="light" before paint when evaluated with a stored light preference', () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
      document.documentElement.removeAttribute('data-theme');

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

  describe('parseThemeCookie', () => {
    it('defaults to dark when the header is null (no cookies sent at all)', () => {
      expect(parseThemeCookie(null)).toBe('dark');
    });

    it('defaults to dark when the header is empty', () => {
      expect(parseThemeCookie('')).toBe('dark');
    });

    it('defaults to dark when the cookie of this name is absent among others', () => {
      expect(parseThemeCookie('other=1; another=2')).toBe('dark');
    });

    it('defaults to dark on a malformed header with no "name=value" pairs', () => {
      expect(parseThemeCookie('not-a-cookie-header;;;')).toBe('dark');
    });

    it('reads "light" from a single cookie', () => {
      expect(parseThemeCookie(`${THEME_COOKIE_NAME}=light`)).toBe('light');
    });

    it('reads "dark" from a single cookie', () => {
      expect(parseThemeCookie(`${THEME_COOKIE_NAME}=dark`)).toBe('dark');
    });

    it('finds the right cookie among several others', () => {
      expect(parseThemeCookie(`other=1; ${THEME_COOKIE_NAME}=light; another=2`)).toBe('light');
    });

    it('tolerates surrounding spaces around the name and value', () => {
      expect(parseThemeCookie(`  other=1 ;  ${THEME_COOKIE_NAME} = light  ; another=2`)).toBe(
        'light'
      );
    });

    it('takes the last occurrence when the cookie name repeats', () => {
      expect(parseThemeCookie(`${THEME_COOKIE_NAME}=light; ${THEME_COOKIE_NAME}=dark`)).toBe(
        'dark'
      );
    });

    it('treats an unknown value as dark', () => {
      expect(parseThemeCookie(`${THEME_COOKIE_NAME}=not-a-theme`)).toBe('dark');
    });

    it('treats an empty value as dark', () => {
      expect(parseThemeCookie(`${THEME_COOKIE_NAME}=`)).toBe('dark');
    });

    it('treats an injection-looking value as dark, and never executes/reflects it', () => {
      const malicious = `${THEME_COOKIE_NAME}=light"><script>window.__pwned=true</script>`;
      expect(parseThemeCookie(malicious)).toBe('dark');
      expect((globalThis as { __pwned?: boolean }).__pwned).toBeUndefined();
    });

    it('treats a value with embedded "=" as unknown, defaulting to dark', () => {
      expect(parseThemeCookie(`${THEME_COOKIE_NAME}=light=extra`)).toBe('dark');
    });
  });
});
