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
    // Cycle-3 review's own finding: the URL parser normalises dot segments
    // (and `%2e` decoded as a dot) down to a same-origin `pathname` that
    // itself STARTS WITH `//` — protocol-relative once returned on its
    // own, even though the resolved URL really was on-origin. Each of
    // these collapses to the safe `/evil.com`, not the dangerous
    // `//evil.com` the origin-only check let through.
    ['/.//evil.com', '/evil.com'],
    ['/..//evil.com', '/evil.com'],
    ['/a/..//evil.com', '/evil.com'],
    ['/%2e//evil.com', '/evil.com'],
    ['/./\\evil.com', '/evil.com'],
    ['https://example.com//evil.com', '/evil.com'],
    ['//example.com//evil.com', '/evil.com'],
  ])('safeReturnPath(%j, origin) === %j', (value, expected) => {
    expect(safeReturnPath(value, ORIGIN)).toBe(expected);
  });

  it('the output never starts with "//" for any of the dot-segment inputs above', () => {
    for (const value of [
      '/.//evil.com',
      '/..//evil.com',
      '/a/..//evil.com',
      '/%2e//evil.com',
      '/./\\evil.com',
      'https://example.com//evil.com',
      '//example.com//evil.com',
    ]) {
      expect(safeReturnPath(value, ORIGIN)).not.toMatch(/^\/\//);
    }
  });

  it('rejects a value longer than the 2048-character cap', () => {
    const long = '/' + 'a'.repeat(3000);
    expect(safeReturnPath(long, ORIGIN)).toBe('/');
  });

  it('keeps a value at exactly the cap', () => {
    const atCap = '/' + 'a'.repeat(2047);
    expect(atCap.length).toBe(2048);
    expect(safeReturnPath(atCap, ORIGIN)).toBe(atCap);
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

describe('safeReturnPath — property fuzz', () => {
  // A tiny, dependency-free deterministic PRNG (mulberry32) — no `Math.
  // random()`, so a failure is reproducible from SEED alone, and adding a
  // fuzzing library isn't warranted for one function.
  function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const SEED = 20260929;
  const ITERATIONS = 5000;
  const MAX_LENGTH = 2048;

  // Every trick the reviews found, as composable fragments — the fuzz
  // input is built by concatenating a random handful of these, in random
  // order, not by picking one whole known-bad string: the point is to
  // cover COMBINATIONS review didn't think to write by hand.
  const FRAGMENTS = [
    '/',
    '//',
    '\\',
    '.',
    '..',
    '%2e',
    '%2f',
    '%5c',
    '\t',
    '\n',
    '\r',
    '@',
    ':',
    'https://',
    '//example.com',
    'example.com',
    'evil.com',
    'a',
    'b',
    '?x=1',
    '#y',
    '',
  ];

  function randomInput(rand: () => number): string {
    const fragmentCount = 1 + Math.floor(rand() * 8); // 1..8 fragments
    let out = '';
    for (let i = 0; i < fragmentCount; i++) {
      out += FRAGMENTS[Math.floor(rand() * FRAGMENTS.length)];
    }
    return out;
  }

  it(`holds the output invariant across ${ITERATIONS} generated inputs (seed ${SEED})`, () => {
    const rand = mulberry32(SEED);
    for (let i = 0; i < ITERATIONS; i++) {
      const input = randomInput(rand);
      const output = safeReturnPath(input, ORIGIN);

      // 1. Starts with exactly one `/`, never `//` or `/\`.
      expect(output, `input=${JSON.stringify(input)} output=${JSON.stringify(output)}`).toMatch(
        /^\/(?!\/|\\)/
      );
      // 2. No control characters.
      // eslint-disable-next-line no-control-regex -- deliberately matching C0 controls and DEL.
      expect(output, `input=${JSON.stringify(input)}`).not.toMatch(/[\x00-\x1f\x7f]/);
      // 3. Never exceeds the cap.
      expect(output.length, `input=${JSON.stringify(input)}`).toBeLessThanOrEqual(MAX_LENGTH);
      // 4. Re-parsing the output against `origin` stays on `origin`.
      expect(new URL(output, ORIGIN).origin, `input=${JSON.stringify(input)}`).toBe(ORIGIN);
      // 5. The property that actually matters: a browser resolving this
      // exact string against a DIFFERENT site stays on THAT site — proof
      // the string is a plain relative reference, never protocol-relative
      // or absolute, regardless of which origin happens to be asking.
      expect(new URL(output, 'https://other.example').host, `input=${JSON.stringify(input)}`).toBe(
        'other.example'
      );
    }
  });
});
