import { build } from 'vite';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Builds the real `styles` entry via the package's own `vite.config.ts` —
 * the exact production build `pnpm build` runs, only redirected to a
 * throwaway temp directory — and returns the resulting `branchleft.css`
 * text.
 *
 * Deliberately does NOT read a pre-existing `packages/brand-branchleft/
 * dist/branchleft.css`: this package's `test:unit` can run before its own
 * `build` step (see the repo's CI job order), and the whole point of this
 * suite is to check what actually ships, not a hand-copied set of values
 * that could drift from `tokens.css` unnoticed.
 */
export async function buildStylesheet(): Promise<string> {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'branchleft-stylesheet-test-'));
  try {
    await build({
      root: PACKAGE_ROOT,
      configFile: path.join(PACKAGE_ROOT, 'vite.config.ts'),
      logLevel: 'silent',
      build: {
        outDir,
        emptyOutDir: true,
      },
    });
    return fs.readFileSync(path.join(outDir, 'branchleft.css'), 'utf8');
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

/**
 * Same production build as `buildStylesheet`, but returns the temp output
 * directory itself (not cleaned up) instead of just the CSS text — for a
 * test that also needs the extracted `dist/fonts/*.woff2` files on disk,
 * e.g. to hash them against their source. The caller owns cleanup
 * (`fs.rmSync(outDir, { recursive: true, force: true })`).
 */
export async function buildStylesheetDist(): Promise<string> {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'branchleft-stylesheet-dist-test-'));
  await build({
    root: PACKAGE_ROOT,
    configFile: path.join(PACKAGE_ROOT, 'vite.config.ts'),
    logLevel: 'silent',
    build: {
      outDir,
      emptyOutDir: true,
    },
  });
  return outDir;
}

export type CustomProperties = ReadonlyMap<string, string>;

/**
 * Extracts every `--name: value` declaration from one CSS rule's body,
 * given the block's opening selector text exactly as it appears in the
 * built (minified, single-line) stylesheet — e.g. `:root{` or
 * `:root[data-theme=light]{`.
 *
 * Deliberately simple (split on top-level `;`, no property nesting/at-rule
 * awareness): `tokens.css` only ever declares flat custom properties in
 * these two blocks, never a nested rule, so a full CSS parser would be
 * more machinery than the input needs.
 */
export function extractCustomProperties(css: string, blockOpener: string): CustomProperties {
  const start = css.indexOf(blockOpener);
  if (start === -1) {
    throw new Error(`Block opener not found in built CSS: ${blockOpener}`);
  }
  const bodyStart = start + blockOpener.length;
  const bodyEnd = css.indexOf('}', bodyStart);
  if (bodyEnd === -1) {
    throw new Error(`Unterminated rule for block opener: ${blockOpener}`);
  }
  const body = css.slice(bodyStart, bodyEnd);

  const props = new Map<string, string>();
  for (const decl of body.split(';')) {
    const colon = decl.indexOf(':');
    if (colon === -1) continue; // e.g. a bare `color-scheme:dark` sits before the `--` props too
    const name = decl.slice(0, colon).trim();
    const value = decl.slice(colon + 1).trim();
    if (name.startsWith('--')) {
      props.set(name, value);
    }
  }
  return props;
}

/**
 * Resolves a custom property's value to a literal `#rrggbb` hex colour,
 * following a single level of `var(--other-name)` indirection if present
 * (this stylesheet never nests `var()` more than one level deep — e.g.
 * `--bl-color-invalid: var(--bl-value-redlines)`).
 */
export function resolveColour(props: CustomProperties, name: string): string {
  const raw = props.get(name);
  if (raw === undefined) {
    throw new Error(`Custom property not found: ${name}`);
  }
  const varMatch = /^var\(\s*(--[\w-]+)\s*\)$/.exec(raw);
  if (varMatch) {
    const resolved = props.get(varMatch[1]);
    if (resolved === undefined) {
      throw new Error(`Custom property not found: ${varMatch[1]} (referenced by ${name})`);
    }
    return resolved;
  }
  return raw;
}
