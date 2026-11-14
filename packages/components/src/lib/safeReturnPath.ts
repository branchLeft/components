/**
 * Resolves a candidate redirect target (any attacker-influenced string) against `origin` to a same-origin
 * `pathname + search + hash`, or `'/'` if missing, unparseable, off-origin, not http(s), too long, or failing the output check.
 */

/**
 * An on-origin check is not enough: dot-segment, `%2e` and backslash normalisation can leave a
 * `pathname` STARTING WITH `//`, protocol-relative on its own (`/.//evil.example`).
 */

/**
 * What this function guarantees is on the OUTPUT: collapse any leading run of slashes or backslashes to one `/`,
 * reject any backslash or control character, then require that RE-PARSING that string against `origin` lands on `origin`.
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

  // Backstop: the checks above already reject off-origin input, so this
  // re-check should never fail. It runs on the string this function is about
  // to return, not the value it was given, so a future change to the
  // normalisation above cannot return a protocol-relative path unnoticed.
  let recheck: URL;
  try {
    recheck = new URL(collapsed, ownOrigin);
  } catch {
    return '/';
  }
  if (recheck.origin !== ownOrigin) return '/';

  return collapsed;
}
