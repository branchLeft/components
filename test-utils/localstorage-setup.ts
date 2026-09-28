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

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
});
