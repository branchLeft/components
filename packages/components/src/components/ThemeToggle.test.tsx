import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as React from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
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
    const container = mount(React.createElement(ThemeToggle, { action: ACTION, theme: 'dark' }));
    const form = container.querySelector('form')!;
    const button = container.querySelector('button')!;

    expect(form.getAttribute('method')).toBe('post');
    expect(form.getAttribute('action')).toBe(ACTION);
    expect(button.getAttribute('type')).toBe('submit');
    expect(button.getAttribute('name')).toBe('theme');
    // theme="dark" ⇒ next mode (this button's value) is light.
    expect(button.getAttribute('value')).toBe('light');
  });

  it('reflects theme="light" via the button value, without reading `document` at all', () => {
    // Deliberately does NOT set document.documentElement's data-theme here —
    // the whole point of the prop is that the component never needs to
    // read the DOM to know the starting mode.
    const container = mount(React.createElement(ThemeToggle, { action: ACTION, theme: 'light' }));
    const button = container.querySelector('button')!;
    expect(button.getAttribute('value')).toBe('dark');
  });

  it('has no aria-pressed attribute', () => {
    const container = mount(React.createElement(ThemeToggle, { action: ACTION, theme: 'dark' }));
    expect(container.querySelector('button')!.hasAttribute('aria-pressed')).toBe(false);
  });

  it('the accessible name flips between the two labels depending on the theme prop', () => {
    const darkContainer = document.createElement('div');
    document.body.appendChild(darkContainer);
    const darkRoot = createRoot(darkContainer);
    act(() => darkRoot.render(React.createElement(ThemeToggle, { action: ACTION, theme: 'dark' })));
    expect(darkContainer.querySelector('button')!.getAttribute('aria-label')).toBe(
      'Switch to light mode'
    );
    act(() => darkRoot.unmount());
    darkContainer.remove();

    const container = mount(React.createElement(ThemeToggle, { action: ACTION, theme: 'light' }));
    expect(container.querySelector('button')!.getAttribute('aria-label')).toBe(
      'Switch to dark mode'
    );
  });

  it('accepts custom labels for both directions', () => {
    const container = mount(
      React.createElement(ThemeToggle, {
        action: ACTION,
        theme: 'dark',
        switchToLightLabel: 'Go light',
        switchToDarkLabel: 'Go dark',
      })
    );
    expect(container.querySelector('button')!.getAttribute('aria-label')).toBe('Go light');

    const container2 = mount(
      React.createElement(ThemeToggle, {
        action: ACTION,
        theme: 'light',
        switchToLightLabel: 'Go light',
        switchToDarkLabel: 'Go dark',
      })
    );
    expect(container2.querySelector('button')!.getAttribute('aria-label')).toBe('Go dark');
  });

  it('renders no hidden return field when returnTo is omitted', () => {
    const container = mount(React.createElement(ThemeToggle, { action: ACTION, theme: 'dark' }));
    expect(container.querySelector('input[name="return"]')).toBeNull();
  });

  it('renders returnTo as a hidden "return" form field', () => {
    const container = mount(
      React.createElement(ThemeToggle, { action: ACTION, theme: 'dark', returnTo: '/settings?x=1' })
    );
    const input = container.querySelector('input[name="return"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    expect(input!.type).toBe('hidden');
    expect(input!.value).toBe('/settings?x=1');
  });

  it('keeps the toggle in sync when the theme prop changes after mount (name and icon follow)', () => {
    let root!: Root;
    const container = document.createElement('div');
    document.body.appendChild(container);
    try {
      root = createRoot(container);
      act(() => root.render(React.createElement(ThemeToggle, { action: ACTION, theme: 'dark' })));
      expect(container.querySelector('button')!.getAttribute('aria-label')).toBe(
        'Switch to light mode'
      );
      expect(container.querySelector('svg')?.getAttribute('class')).toContain('lucide-sun');

      // Re-render with a NEW theme prop — e.g. the app remounted this
      // component with fresh loader data after a client-side navigation.
      act(() => root.render(React.createElement(ThemeToggle, { action: ACTION, theme: 'light' })));
      expect(container.querySelector('button')!.getAttribute('aria-label')).toBe(
        'Switch to dark mode'
      );
      expect(container.querySelector('svg')?.getAttribute('class')).toContain('lucide-moon');
      // theme="light" ⇒ next mode (this button's value) is dark.
      expect(container.querySelector('button')!.getAttribute('value')).toBe('dark');
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  });

  it('after mount, switches data-theme and writes THEME_COOKIE_NAME when JS handles the submit — in both directions', () => {
    const container = mount(React.createElement(ThemeToggle, { action: ACTION, theme: 'dark' }));
    const form = container.querySelector('form')!;

    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(readThemeCookie()).toBe('light');
    expect(container.querySelector('button')!.getAttribute('value')).toBe('dark');

    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(readThemeCookie()).toBe('dark');
    expect(container.querySelector('button')!.getAttribute('value')).toBe('light');
  });

  it('also writes THEME_STORAGE_KEY on submit, for back-compat with the no-server localStorage path', () => {
    const container = mount(React.createElement(ThemeToggle, { action: ACTION, theme: 'dark' }));
    const form = container.querySelector('form')!;

    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('prevents the default form navigation once JS handles the submit', () => {
    const container = mount(React.createElement(ThemeToggle, { action: ACTION, theme: 'dark' }));
    const form = container.querySelector('form')!;
    const event = new Event('submit', { bubbles: true, cancelable: true });

    act(() => {
      form.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
  });

  it('has no axe violations', async () => {
    const html = renderToStaticMarkup(
      React.createElement(ThemeToggle, { action: ACTION, theme: 'dark' })
    );
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });

  describe('no-JS: what a server render alone must offer (no hydration involved)', () => {
    // Mirrors the README's server contract exactly: a light-mode visitor's
    // server render, with no client JS at all, must be a form that posts
    // the OPPOSITE mode — otherwise a no-JS visitor can switch one way and
    // never back (the cycle-2 review finding this guards).
    it.each([
      ['dark', 'light', 'Switch to light mode'],
      ['light', 'dark', 'Switch to dark mode'],
    ] as const)(
      'server-rendered with theme=%s posts theme=%s, labelled %j',
      (theme, postedValue, label) => {
        const html = renderToStaticMarkup(
          React.createElement(ThemeToggle, { action: ACTION, theme })
        );
        const container = document.createElement('div');
        container.innerHTML = html;
        const button = container.querySelector('button')!;
        const form = container.querySelector('form')!;

        expect(form.getAttribute('method')).toBe('post');
        expect(form.getAttribute('action')).toBe(ACTION);
        expect(button.getAttribute('name')).toBe('theme');
        expect(button.getAttribute('value')).toBe(postedValue);
        expect(button.getAttribute('aria-label')).toBe(label);
      }
    );
  });

  describe('hydration: server and client must agree via the theme prop', () => {
    // Reproduces the cycle-2 review's real round trip (renderToString →
    // served HTML → hydrateRoot), for both starting modes, with
    // onRecoverableError spied so any hydration mismatch shows up as a
    // real assertion failure rather than only a console warning.
    it.each(['dark', 'light'] as const)(
      'hydrates theme=%s with no recoverable error, correct name and icon',
      (theme) => {
        const html = renderToString(React.createElement(ThemeToggle, { action: ACTION, theme }));
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);

        const errors: string[] = [];
        let root: ReturnType<typeof hydrateRoot> | undefined;
        try {
          act(() => {
            root = hydrateRoot(
              container,
              React.createElement(ThemeToggle, { action: ACTION, theme }),
              {
                onRecoverableError: (error) => {
                  errors.push(String((error as { message?: unknown })?.message ?? error));
                },
              }
            );
          });

          expect(errors).toEqual([]);

          const button = container.querySelector('button')!;
          const expectedLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
          const expectedIconClass = theme === 'dark' ? 'lucide-sun' : 'lucide-moon';
          expect(button.getAttribute('aria-label')).toBe(expectedLabel);
          expect(button.querySelector('svg')?.getAttribute('class')).toContain(expectedIconClass);
        } finally {
          if (root) act(() => root!.unmount());
          container.remove();
        }
      }
    );
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

    it('accepts an RFC 6265 quoted value', () => {
      expect(parseThemeCookie(`${THEME_COOKIE_NAME}="light"`)).toBe('light');
      expect(parseThemeCookie(`${THEME_COOKIE_NAME}="dark"`)).toBe('dark');
    });
  });
});
