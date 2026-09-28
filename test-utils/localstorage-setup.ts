// Node's own experimental `globalThis.localStorage` (SQLite-backed, only
// live with a `--localstorage-file` flag this repo's test run doesn't pass)
// shadows jsdom's working implementation on the Node version pinned by
// `.nvmrc` — jsdom's environment setup skips installing its own once it
// sees the name already exists on `globalThis`, so `window.localStorage` in
// a test is Node's inert placeholder, not a real Storage. A minimal
// in-memory polyfill, forced on regardless of what's already there, is a
// smaller and more portable fix than asking every future dev/CI run to pass
// that flag.
class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  get length(): number {
    return this.store.size;
  }
}

/**
 * Installs the polyfill on `globalThis`. Exported (not just run as a
 * side effect below) so a test that installs jsdom's globals itself, at a
 * point in time this module's own top-level side effect can't reach — see
 * `branchleft.a11y.test.tsx`, which needs jsdom installed AFTER an esbuild
 * step that jsdom's globals would otherwise break — can call it again once
 * jsdom is in place.
 */
export function installLocalStorage(target: typeof globalThis = globalThis): void {
  Object.defineProperty(target, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

// Side-effect entry point for vitest's `setupFiles` (runs once per test
// file, before jsdom's own environment setup has a chance to skip
// installing its own — see the header comment above).
installLocalStorage();
