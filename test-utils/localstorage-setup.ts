// Node's experimental `globalThis.localStorage` (live only with `--localstorage-file`, which this
// repo's tests don't pass) shadows jsdom's on the `.nvmrc` Node: jsdom skips installing its own when the
// name exists, leaving an inert placeholder. A minimal in-memory polyfill, forced on, is more portable than a flag.
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
 * Installs the polyfill on `globalThis`. Exported so a test that installs jsdom's globals itself, after an esbuild
 * step jsdom would break (`branchleft.a11y.test.tsx`), can call it again once jsdom is in place.
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
