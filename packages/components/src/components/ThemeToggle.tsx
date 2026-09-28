import * as React from 'react';
import { Moon, Sun } from 'lucide-react';

export type Theme = 'dark' | 'light';

/**
 * `localStorage` key the legacy, no-server init path (`themeInitScript`) and
 * its matching read/write helpers use — kept only for a static app with no
 * server to set a cookie (see `THEME_COOKIE_NAME` and this module's own doc
 * comment below for the primary, server-backed path).
 */
export const THEME_STORAGE_KEY = 'bl-theme';

/**
 * Cookie name the server-backed toggle reads and writes. A consumer's
 * server sets `data-theme` on `<html>` (before first paint) from this
 * cookie's value, parsed with `parseThemeCookie` — that is what makes the
 * switch work with JavaScript disabled: the `<form>` below posts to the
 * consumer's own `action` URL, whose handler stores the submitted value
 * under this cookie name and redirects back.
 */
export const THEME_COOKIE_NAME = 'bl-theme';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function isTheme(value: string): value is Theme {
  return value === 'dark' || value === 'light';
}

/**
 * Parses a `Theme` out of a raw `Cookie` request header — pure and
 * framework-neutral, so a consumer's server (whatever it's built on) can
 * call it directly on the header string it already has, with no dependency
 * on this package's own cookie-writing code. Defaults to `'dark'`, and
 * folds every failure mode into that same default rather than throwing:
 * a missing header, no cookie of this name, a malformed pair, or a value
 * that isn't exactly `"light"`/`"dark"` (including one with trailing
 * `=`-separated junk, e.g. a naive concatenation/injection attempt) all
 * fall through to dark, matching the brand default `@branchleft/brand-
 * branchleft/css` itself falls back to when no `data-theme` attribute is
 * present at all.
 *
 * A `Cookie` header can legally repeat a name (rare, but seen with
 * differently-scoped cookies of the same name from an ancestor path) — the
 * LAST occurrence wins here, mirroring how a repeated `Set-Cookie` would
 * have overwritten the earlier one when it was set.
 */
export function parseThemeCookie(cookieHeader: string | null): Theme {
  if (!cookieHeader) return 'dark';

  let result: Theme = 'dark';
  for (const pair of cookieHeader.split(';')) {
    const eq = pair.indexOf('=');
    if (eq === -1) continue; // malformed pair (no "name=value") — ignore, not a match
    const name = pair.slice(0, eq).trim();
    if (name !== THEME_COOKIE_NAME) continue;
    const value = pair.slice(eq + 1).trim();
    if (isTheme(value)) result = value;
    // else: this occurrence's value isn't a recognised theme (empty,
    // malformed, or injection-looking) — leave `result` at whatever the
    // last VALID occurrence set, or the 'dark' default if there was none.
  }
  return result;
}

/**
 * Reads the mode already rendered on `<html>` — set by the consumer's
 * server from the theme cookie, well before this component exists — never
 * a stored preference of this component's own. On the server (no
 * `document`) there is nothing to read, so this returns the same `'dark'`
 * assumption a fresh client render would compute anyway, meaning server
 * and initial-client output always agree.
 */
function readRenderedTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
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
 * Writes `THEME_COOKIE_NAME` client-side, so the next full page load (or a
 * `parseThemeCookie` call on the next request) sees the choice without a
 * server round trip having completed first. `Secure` is added only when the
 * page itself is https — set unconditionally, a `pnpm start`/e2e server
 * without TLS would silently reject the cookie.
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
 * Inline `<head>` script, as a string, for a STATIC app with no server to
 * set `data-theme` from a cookie (see `THEME_COOKIE_NAME`/
 * `parseThemeCookie` for the primary, server-backed path — this is the
 * fallback for a consumer that has neither). Embedded before any
 * stylesheet/hydration so a `localStorage`-stored theme applies before
 * first paint — without it, a light-mode visitor would flash dark on every
 * load. Sets `data-theme="light"` only: dark is the brand default with no
 * attribute needed, so a missing/invalid/inaccessible stored value all
 * fall through to it correctly with no `else` branch required.
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

/**
 * The button's box must clear WCAG 2.5.8's 24×24 CSS px minimum target
 * size — an icon-only button with no visible label text can't be relied on
 * to reach that from its own content/padding the way the old text-pill
 * version did. `min-width`/`min-height` (not `width`/`height`) so a
 * consumer's own sizing (via `className`) can still grow it, never shrink
 * it below the floor. Deliberately the only inline styling this component
 * applies — no colour, border or background, which stay the consumer's to
 * theme (or the browser's own UA default button chrome, unstyled).
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
   * The URL the no-JS `<form>` posts to. The consumer's server reads the
   * submitted `theme` field, stores it under `THEME_COOKIE_NAME`, and
   * redirects back to the page the toggle was on — this component renders
   * the form and reads the resulting state, but never performs that
   * redirect itself (there is no server here to do it from).
   */
  readonly action: string;
  /** Accessible name when the button's action is "switch to light mode" (i.e. dark is currently active). Overridable for a consumer-specific phrasing. */
  readonly switchToLightLabel?: string;
  /** Accessible name when the button's action is "switch to dark mode" (i.e. light is currently active). Overridable for a consumer-specific phrasing. */
  readonly switchToDarkLabel?: string;
  readonly className?: string;
}

/**
 * An icon button, wrapped in a real `<form>`, that switches the page
 * between `"dark"` (the default — no `<html data-theme>` attribute needed)
 * and `"light"`.
 *
 * **Without JavaScript**, submitting the form is the entire mechanism: it
 * posts `theme=<the mode to switch TO>` to `action`, and the consumer's
 * server is responsible for storing that under `THEME_COOKIE_NAME` and
 * redirecting back with `<html data-theme>` (via `parseThemeCookie`
 * against the incoming request) already set to match — the switch works
 * end to end with scripting disabled.
 *
 * **With JavaScript**, this component intercepts that same submit,
 * `preventDefault`s the navigation, flips `data-theme` on `<html>`
 * immediately, and writes the same cookie itself via `document.cookie` —
 * so the switch feels instant instead of waiting on a round trip, while
 * still landing on the exact same cookie/attribute state either way.
 *
 * Brand-neutral: it knows nothing about any brand's colour tokens, only
 * the `data-theme` attribute contract a brand stylesheet (e.g.
 * `@branchleft/brand-branchleft/css`) keys its light-mode selector off.
 */
export function ThemeToggle({
  action,
  switchToLightLabel = 'Switch to light mode',
  switchToDarkLabel = 'Switch to dark mode',
  className,
}: Readonly<ThemeToggleProps>): React.JSX.Element {
  // Lazy initialiser, not an effect: `readRenderedTheme` returns the exact
  // same 'dark' assumption on both the server and the client's FIRST render
  // pass (no `document` exists yet server-side to read), so there's no
  // server/client markup mismatch to correct after the fact — by the time
  // this runs on a real page, `document.documentElement.dataset.theme` is
  // already whatever the consumer's server rendered from the cookie, so a
  // returning light-mode visitor's very first client render already shows
  // the right icon/label, with no delayed correction and no flash (the
  // defect this replaces: see the PR body's cycle-1 finding on the old
  // `localStorage`-read initialiser, which read a value the server could
  // never have agreed with, and then never corrected itself before the
  // next click).
  const [theme, setTheme] = React.useState<Theme>(readRenderedTheme);

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
