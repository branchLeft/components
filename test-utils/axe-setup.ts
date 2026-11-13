import { afterEach, expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';
import type { AxeMatchers } from 'vitest-axe';

// Registers `expect(results).toHaveNoViolations()` for use with `axe()` from
// `vitest-axe` in `*.test.tsx` files.
expect.extend(matchers);

// `vitest-axe` augments the old `Vi.Assertion` namespace, which vitest no
// longer reads, so its shipped types are ignored. Vitest 5 exposes `Matchers`
// as the custom-matcher extension point: `Assertion`, `ExpectStatic` and
// `AsymmetricMatchersContaining` all extend it. Merging into it must repeat
// its type-parameter list exactly, though `AxeMatchers` uses neither.
declare module 'vitest' {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown,
  > extends AxeMatchers {}
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

// `axe()` temporarily swaps `document.body.innerHTML` to inspect markup (see
// `vitest-axe`'s `mount()`) and restores it afterwards, but only within a
// single call — across tests in the same file, leftover nodes from a
// previous `document.body.appendChild` would still accumulate and risk
// duplicate-id false positives. Clear the body between tests defensively.
afterEach(() => {
  // A per-file `// @vitest-environment node` override (e.g. a test that
  // builds CSS via vite/esbuild, which breaks under jsdom's globals) has
  // no `document` at all — this setup file still runs for it since
  // `setupFiles` applies workspace-wide, so this guard is required, not
  // defensive dead code.
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
  }
});
