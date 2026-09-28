/**
 * Resolves a candidate redirect target (a form field, a `Referer` header,
 * or any other attacker-influenced string) against `origin`, and returns a
 * same-origin `pathname + search + hash` — or `'/'` for anything missing,
 * unparseable, off-origin, or not `http:`/`https:`.
 *
 * Uses the platform's own `URL` parser to resolve `value`, rather than a
 * denylist regex against the raw string: the WHATWG URL algorithm strips
 * ASCII tab/newline from the input BEFORE parsing, so a value like
 * `"/\t/evil.example"` collapses to the protocol-relative `"//evil.example"`
 * — a regex written against the original string never sees that. Resolving
 * first and then comparing the RESULT's origin catches every such
 * normalisation, by construction, rather than one denylisted character at
 * a time.
 */
export function safeReturnPath(value: string | null | undefined, origin: string): string {
  if (!value) return '/';

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

  const result = `${target.pathname}${target.search}${target.hash}`;
  // Defence in depth: the URL parser already percent-encodes/strips control
  // characters into `pathname`/`search`/`hash`, so this should never fire —
  // but a `Location` header must never carry a raw CR/LF/other control
  // character (header/response splitting), so reject rather than assume.
  // eslint-disable-next-line no-control-regex -- deliberately matching C0 controls and DEL.
  if (/[\x00-\x1f\x7f]/.test(result)) return '/';

  return result;
}
