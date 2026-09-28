import * as React from 'react';

export type Theme = 'dark' | 'light';

/**
 * `localStorage` key `ThemeToggle` and `themeInitScript` both read/write —
 * exported so a consumer wiring their own init script (rather than using
 * `themeInitScript`) or reading the stored value elsewhere uses the same
 * key, not a typo'd copy of it.
 */
export const THEME_STORAGE_KEY = 'bl-theme';

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : null;
  } catch {
    // Storage can throw (private browsing, quota, disabled by policy) —
    // treated the same as "nothing stored": fall back to the default.
    return null;
  }
}

function writeStoredTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Persistence is a nice-to-have, not a requirement for the toggle to
    // keep working for the rest of this session.
  }
}

/**
 * Inline `<head>` script, as a string, to embed in an SSR app's document
 * shell (before any stylesheet/hydration) so the stored theme applies
 * before first paint — without it, a light-mode visitor would flash dark
 * on every load. Sets `data-theme="light"` only: dark is the brand default
 * with no attribute needed, so a missing/invalid/inaccessible stored value
 * all fall through to it correctly with no `else` branch required.
 *
 * Deliberately plain, un-minified ES5-shaped JS with no template literals
 * or arrow functions — this string is meant to run unmodified in whatever
 * document head embeds it, including on the small chance a consumer's CSP
 * or a very old browser is involved; it should not depend on this
 * package's own build target.
 */
export const themeInitScript = `(function () {
  try {
    var t = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();`;

/**
 * `themeInitScript`'s SHA-256 hash, in the `'sha256-<base64>'` form a CSP
 * `script-src` directive expects for an inline `<script>` — e.g.:
 *
 *   Content-Security-Policy: script-src 'self' 'sha256-eaTM2OdrPnWt18EwafzafEMGqGT6XQixJje4JPQ2gUg='
 *
 * Inlining `themeInitScript` into a document `<head>` needs one of: a
 * `'nonce-…'` the server regenerates per response, `'unsafe-inline'` (a
 * real CSP weakening this package should not ask a consumer to accept), or
 * this hash. A hash-based `script-src` entry only matches the EXACT
 * script text — hence why `themeInitScript` is a literal, un-templated
 * string rather than something assembled per-render, and why this
 * constant is a literal too, not computed from `crypto` at runtime (this
 * package ships to browsers; `node:crypto` isn't there). It's computed
 * once, by `ThemeToggle.hash.test.ts`, which fails if it ever drifts from
 * `themeInitScript`'s actual content — recompute it there (the test's own
 * comment says how) and paste the result back here if `themeInitScript`
 * ever changes.
 */
export const themeInitScriptHash = 'sha256-eaTM2OdrPnWt18EwafzafEMGqGT6XQixJje4JPQ2gUg=';

export interface ThemeToggleProps {
  /**
   * Accessible label, read as the button's visible text and its accessible
   * name. Override for a consumer-specific phrasing (e.g. an icon-only
   * button passing a `sr-only`-styled label via `className` conventions of
   * its own) — this component has no opinion on wording beyond a sane
   * default.
   */
  readonly label?: string;
  readonly className?: string;
}

/**
 * Toggles `data-theme` on `<html>` between `"dark"` (the default — no
 * attribute needed) and `"light"`, and persists the choice to
 * `localStorage` under `THEME_STORAGE_KEY`.
 *
 * Brand-neutral: it knows nothing about any brand's colour tokens, only
 * the `data-theme` attribute contract a brand stylesheet (e.g.
 * `@branchleft/brand-branchleft/css`) keys its light-mode selector off.
 *
 * Pair with `themeInitScript` in an SSR app's document `<head>` so the
 * stored preference applies before first paint.
 */
export function ThemeToggle({
  label = 'Toggle colour theme',
  className,
}: Readonly<ThemeToggleProps>): React.JSX.Element {
  // Lazy initialiser only — reading localStorage during render (rather
  // than in an effect) keeps this in sync with whatever `themeInitScript`
  // already applied to the DOM before hydration, with no flash-of-wrong-
  // state re-render. On the server there's no localStorage to read, so
  // this always renders the dark default there, matching the no-script
  // page's own default of no `data-theme` attribute at all.
  const [theme, setTheme] = React.useState<Theme>(() => readStoredTheme() ?? 'dark');

  // Keeps the DOM attribute in sync with state, including the very first
  // client render — necessary when nothing set `data-theme` yet (e.g. no
  // `themeInitScript` in the document, or storage was empty/threw).
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function handleClick() {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      writeStoredTheme(next);
      return next;
    });
  }

  return (
    <button
      type="button"
      className={['bl-theme-toggle', className].filter(Boolean).join(' ')}
      aria-pressed={theme === 'light'}
      onClick={handleClick}
    >
      {label}
    </button>
  );
}
