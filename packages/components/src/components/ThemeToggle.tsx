import * as React from 'react';
import { Moon, Sun } from 'lucide-react';

export type Theme = 'dark' | 'light';

/**
 * `localStorage` key for the legacy no-server path (`themeInitScript` and its read/write helpers), kept only for a
 * static app with no server to set a cookie; the primary, server-backed path is `THEME_COOKIE_NAME`.
 */
export const THEME_STORAGE_KEY = 'bl-theme';

/**
 * Cookie name the server-backed toggle reads and writes: the consumer's server sets `data-theme` from it before first
 * paint (`parseThemeCookie`), and its `action` handler stores the no-JS form's value under this name and redirects back.
 */
export const THEME_COOKIE_NAME = 'bl-theme';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function isTheme(value: string): value is Theme {
  return value === 'dark' || value === 'light';
}

/**
 * Parses a `Theme` from a raw `Cookie` header; pure and framework-neutral. Never throws: a missing header or cookie,
 * a malformed pair, or anything but exactly `"light"`/`"dark"` falls back to `'dark'`, the brand default.
 */

/**
 * A `Cookie` header can legally repeat a name (seen with same-named cookies from an ancestor path): the LAST
 * occurrence wins, as a repeated `Set-Cookie` would have overwritten the earlier one.
 */
export function parseThemeCookie(cookieHeader: string | null): Theme {
  if (!cookieHeader) return 'dark';

  let result: Theme = 'dark';
  for (const pair of cookieHeader.split(';')) {
    const eq = pair.indexOf('=');
    if (eq === -1) continue; // malformed pair (no "name=value") — ignore, not a match
    const name = pair.slice(0, eq).trim();
    if (name !== THEME_COOKIE_NAME) continue;
    let value = pair.slice(eq + 1).trim();
    // RFC 6265 permits a quoted-string cookie-value; some cookie
    // libraries write one. Strip one matching pair of double quotes
    // before comparing, so `bl-theme="light"` parses the same as
    // `bl-theme=light`.
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (isTheme(value)) result = value;
    // else: this occurrence's value isn't a recognised theme (empty,
    // malformed, or injection-looking) — leave `result` at whatever the
    // last VALID occurrence set, or the 'dark' default if there was none.
  }
  return result;
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
 * Writes `THEME_COOKIE_NAME` client-side so the next load sees the choice before a server round trip completes.
 * `Secure` only on https: set unconditionally, a TLS-less `pnpm start`/e2e server would silently reject the cookie.
 */
function writeThemeCookie(theme: Theme): void {
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
  } catch {
    // Same best-effort posture as writeStoredTheme — the DOM attribute
    // this session already flipped is what matters if this throws.
  }
}

/**
 * Inline `<head>` script for a STATIC app with no server to set `data-theme` from a cookie (else `parseThemeCookie`).
 * Plain ES5-shaped JS (no template literals or arrows) so it runs unmodified in any head, before first paint; sets `light` only.
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
 * `themeInitScript`'s SHA-256 as a CSP `script-src` expects it (the alternatives: a `nonce` or `'unsafe-inline'`). A literal,
 * as it matches only the EXACT script text: `ThemeToggle.hash.test.ts` fails on drift; paste its result here.
 */
export const themeInitScriptHash = 'sha256-eaTM2OdrPnWt18EwafzafEMGqGT6XQixJje4JPQ2gUg=';

/**
 * WCAG 2.5.8 needs 24×24 px; `min-*` (not `width`/`height`) lets a consumer's `className` grow
 * the button but never shrink it. The only inline styling: colour and chrome stay theirs.
 */
const HIT_TARGET_STYLE: React.CSSProperties = {
  minWidth: '24px',
  minHeight: '24px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export interface ThemeToggleProps {
  /**
   * The theme in effect for this render: computed by the consumer's server with `parseThemeCookie`; the client must pass
   * the SAME value on first render (hydration data or `parseThemeCookie(document.cookie)`), never derive it itself.
   */

  // Passing the same value both times is what makes server and client
  // output agree, so there is nothing for React to reconcile and no
  // hydration mismatch. After mount, the component tracks its own state
  // from here on, independent of this prop.
  readonly theme: Theme;
  /**
   * The URL the no-JS `<form>` posts to. The consumer's server reads the submitted `theme` field, stores it under
   * `THEME_COOKIE_NAME` and redirects back; this component never redirects itself (there is no server here).
   */
  readonly action: string;
  /**
   * The current page's path (+ optional search/hash), supplied by the app (e.g. from its router) and rendered as a hidden
   * `return` field so the no-JS `POST` handler knows where to redirect back. Omit it and the handler's own default (or `Referer`) applies.
   */
  readonly returnTo?: string;
  /** Accessible name when the button's action is "switch to light mode" (i.e. dark is currently active). Overridable for a consumer-specific phrasing. */
  readonly switchToLightLabel?: string;
  /** Accessible name when the button's action is "switch to dark mode" (i.e. light is currently active). Overridable for a consumer-specific phrasing. */
  readonly switchToDarkLabel?: string;
  readonly className?: string;
}

/**
 * An icon button, wrapped in a real `<form>`, that switches the page between `"dark"` (the default: no `<html data-theme>`
 * attribute needed) and `"light"`.
 */

/**
 * Without JavaScript the form submit is the whole mechanism: it posts `theme=<the mode to switch TO>` to `action`, and
 * the consumer's server stores it under `THEME_COOKIE_NAME` and redirects back with `<html data-theme>` already set.
 */

/**
 * With JavaScript, intercepts the submit, flips `data-theme` on `<html>` at once and writes the same cookie via
 * `document.cookie`: same end state, no round trip. Brand-neutral: it knows only the `data-theme` attribute contract.
 */
export function ThemeToggle({
  theme: initialTheme,
  action,
  returnTo,
  switchToLightLabel = 'Switch to light mode',
  switchToDarkLabel = 'Switch to dark mode',
  className,
}: Readonly<ThemeToggleProps>): React.JSX.Element {
  // Seeded from the prop, which the consumer computed identically on the
  // server (from the cookie) and the client (from the same cookie, or the
  // framework's own hydration data) — so this initial value is never a
  // guess, and server/client output always agree.
  const [theme, setTheme] = React.useState<Theme>(initialTheme);
  // Tracks the LAST `initialTheme` this component rendered with, purely to
  // detect a change — never read for anything else.
  const [lastSeenTheme, setLastSeenTheme] = React.useState<Theme>(initialTheme);

  // Adjusts state during render (React's documented pattern for adjusting state when a prop changes), not in an effect:
  // a `setState` while rendering re-renders before paint, so a changed `initialTheme` (the app remounts this with fresh
  // loader data after a client-side navigation) shows without painting a stale frame first.
  if (initialTheme !== lastSeenTheme) {
    setLastSeenTheme(initialTheme);
    setTheme(initialTheme);
  }

  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  const label = theme === 'dark' ? switchToLightLabel : switchToDarkLabel;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    // No-JS behaviour is a real form submission to `action` — this handler
    // only runs once hydrated, replacing that navigation with an instant,
    // client-side equivalent that lands on the same end state.
    event.preventDefault();
    document.documentElement.setAttribute('data-theme', next);
    writeThemeCookie(next);
    // Back-compat only: the legacy `themeInitScript`/`THEME_STORAGE_KEY`
    // path (for a static app with no server) reads this same key, so it
    // keeps working for a consumer still using that path instead of the
    // cookie one, without this component needing to know which is in use.
    writeStoredTheme(next);
    setTheme(next);
  }

  return (
    <form method="post" action={action} onSubmit={handleSubmit} className={className}>
      {returnTo !== undefined && <input type="hidden" name="return" value={returnTo} />}
      <button type="submit" name="theme" value={next} aria-label={label} style={HIT_TARGET_STYLE}>
        {theme === 'dark' ? (
          <Sun aria-hidden="true" size={18} />
        ) : (
          <Moon aria-hidden="true" size={18} />
        )}
      </button>
    </form>
  );
}
