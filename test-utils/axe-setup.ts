import { afterEach, expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';
import type { AxeMatchers } from 'vitest-axe';

// Registers `expect(results).toHaveNoViolations()` for use with `axe()` from
// `vitest-axe` in `*.test.tsx` files.
expect.extend(matchers);

// `vitest-axe`'s types augment the old `Vi.Assertion` namespace, which vitest 2 dropped for
// augmenting `Assertion` on the `vitest` module, so they are ignored and `toHaveNoViolations`
// fails to typecheck. Re-declared against the module vitest 2 uses.
declare module 'vitest' {
  // `T` must stay to match the `Assertion<T = any>` signature declared
  // upstream in @vitest/expect — interface merging requires an identical
  // type-parameter list, even though `AxeMatchers` itself doesn't use `T`.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

// `axe()` restores `document.body.innerHTML` only within one call; nodes left by an earlier `appendChild` would
// accumulate across tests and risk duplicate-id false positives, so clear the body between tests.
afterEach(() => {
  // A per-file `// @vitest-environment node` override (e.g. a test that builds CSS via vite/esbuild) has no
  // `document`, yet this workspace-wide setup file still runs for it, so this guard is required, not dead code.
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
  }
});
