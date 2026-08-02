import { afterEach, expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';
import type { AxeMatchers } from 'vitest-axe';

// Registers `expect(results).toHaveNoViolations()` for use with `axe()` from
// `vitest-axe` in `*.test.tsx` files.
expect.extend(matchers);

// `vitest-axe` ships its own `extend-expect.d.ts`, but it augments the old
// `Vi.Assertion` namespace that vitest 0.x/1.x used for custom-matcher
// typing. Vitest 2's `@vitest/expect` dropped that namespace in favour of
// augmenting `Assertion` directly on the `vitest` module, so the shipped
// types are silently ignored and `toHaveNoViolations` fails to typecheck.
// Re-declare the augmentation against the module vitest 2 actually uses.
declare module 'vitest' {
  // `T` must stay to match the `Assertion<T = any>` signature declared
  // upstream in @vitest/expect — interface merging requires an identical
  // type-parameter list, even though `AxeMatchers` itself doesn't use `T`.
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

// `axe()` temporarily swaps `document.body.innerHTML` to inspect markup (see
// `vitest-axe`'s `mount()`) and restores it afterwards, but only within a
// single call — across tests in the same file, leftover nodes from a
// previous `document.body.appendChild` would still accumulate and risk
// duplicate-id false positives. Clear the body between tests defensively.
afterEach(() => {
  document.body.innerHTML = '';
});
