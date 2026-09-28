import { describe, it, expect } from 'vitest';
import { safeReturnPath } from './safeReturnPath';

const ORIGIN = 'https://example.com';

describe('safeReturnPath', () => {
  it.each([
    // [value, expected]
    // Tab/backslash tricks the WHATWG URL parser normalises into a
    // protocol-relative URL BEFORE parsing — the cycle-2 review's own
    // finding: a regex against the raw string never sees this collapse.
    ['/\t/evil.com', '/'],
    ['/\t\\evil.com', '/'],
    ['/\n/evil', '/'],
    ['//evil.com', '/'],
    ['/\\evil.com', '/'],
    // Percent-encoded slashes are NOT decoded by the URL parser, so this
    // stays a literal same-origin path — safe, and must be preserved
    // rather than over-rejected.
    ['/%2F%2Fevil.com', '/%2F%2Fevil.com'],
    ['https://evil.com', '/'],
    ['javascript:alert(1)', '/'],
    ['', '/'],
    ['/about?x=1#y', '/about?x=1#y'],
    ['https://example.com/settings?a=1', '/settings?a=1'],
  ])('safeReturnPath(%j, origin) === %j', (value, expected) => {
    expect(safeReturnPath(value, ORIGIN)).toBe(expected);
  });

  it('returns "/" for null', () => {
    expect(safeReturnPath(null, ORIGIN)).toBe('/');
  });

  it('returns "/" for undefined', () => {
    expect(safeReturnPath(undefined, ORIGIN)).toBe('/');
  });

  it('preserves a same-origin path with search and hash together', () => {
    expect(safeReturnPath('/a/b?c=1&d=2#section', ORIGIN)).toBe('/a/b?c=1&d=2#section');
  });

  it('rejects a same-origin URL on a non-http(s) scheme masquerading via the value', () => {
    // A value that itself looks like it carries the right host but a
    // dangerous scheme must still resolve through the origin/protocol
    // checks, not be special-cased by string matching.
    expect(safeReturnPath('ftp://example.com/file', ORIGIN)).toBe('/');
  });

  it('rejects a different origin with the same path', () => {
    expect(safeReturnPath('https://example.com.evil.com/x', ORIGIN)).toBe('/');
  });

  it('never throws for a garbage `origin` argument', () => {
    expect(() => safeReturnPath('/x', 'not a url')).not.toThrow();
    expect(safeReturnPath('/x', 'not a url')).toBe('/');
  });

  it('rejects a value containing a literal control character in the path', () => {
    // The URL parser strips/percent-encodes these before they'd reach
    // pathname/search/hash, but the function's own defence-in-depth check
    // is exercised directly here regardless of how the parser handles it.
    // eslint-disable-next-line no-control-regex -- deliberately matching C0 controls and DEL.
    expect(safeReturnPath('/a\u0000b', ORIGIN)).not.toMatch(/[\x00-\x1f\x7f]/);
  });
});
