/**
 * Resolves a candidate redirect target (a form field, a `Referer` header,
 * or any other attacker-influenced string) against `origin`, and returns a
 * same-origin `pathname + search + hash` — or `'/'` for anything missing,
 * unparseable, off-origin, not `http:`/`https:`, too long, or that fails
 * the output check below.
 */

/**
 * Checking the RESOLVED URL's origin is not enough on its own: the URL
 * parser normalises dot segments (`/../`, `/./`, `%2e` decoded as a dot)
 * and backslash-as-slash, and that normalisation can leave a same-origin
 * `pathname` that itself STARTS WITH `//` — which is protocol-relative
 * when the returned string is later used on its own (a `Location` value,
 * a client-side redirect target). `/.//evil.example` resolves on-origin
 * against any `origin`, yet its `pathname` is `//evil.example`.
 */

/**
 * The property this function guarantees is on the OUTPUT: collapse any
 * leading run of `/`/`\` to one `/`, reject anything still containing a
 * backslash or a control character, then require that RE-PARSING that
 * exact string against `origin` lands back on `origin` — not "the input
 * looked safe", "the first parse resolved on-origin".
 */
const MAX_LENGTH = 2048;

export function safeReturnPath(value: string | null | undefined, origin: string): string {
  if (!value) return '/';
  if (value.length > MAX_LENGTH) return '/';

  let ownOrigin: string;
  let target: URL;
  try {
    ownOrigin = new URL(origin).origin;
    target = new URL(value, origin);
  } catch {
    // Either `origin` itself or `value` failed to parse as a URL/base —
    // never a same-origin path, so the safe fallback.
    return '/';
  }

  if (target.origin !== ownOrigin) return '/';
  if (target.protocol !== 'http:' && target.protocol !== 'https:') return '/';

  const raw = `${target.pathname}${target.search}${target.hash}`;
  const collapsed = raw.replace(/^[/\\]+/, '/');

  if (!collapsed.startsWith('/') || collapsed.includes('\\')) return '/';
  // eslint-disable-next-line no-control-regex -- deliberately matching C0 controls and DEL.
  if (/[\x00-\x1f\x7f]/.test(collapsed)) return '/';
  if (collapsed.length > MAX_LENGTH) return '/';

  // The actual guarantee: a browser re-parsing THIS string, relative to
  // `origin`, must land back on `origin` — checked on the string this
  // function is about to return, not the value it was given.
  let recheck: URL;
  try {
    recheck = new URL(collapsed, ownOrigin);
  } catch {
    return '/';
  }
  if (recheck.origin !== ownOrigin) return '/';

  return collapsed;
}
