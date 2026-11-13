import { build } from 'vite';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Builds the real `styles` entry through the package's own vite.config.ts (the production build, into a
 * temp directory) and returns the CSS. Never reads a pre-built dist: a stale copy could drift unnoticed.
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
 * As `buildStylesheet`, but returns the un-cleaned temp output directory, for tests
 * that need `dist/fonts/*.woff2` on disk. The caller owns cleanup.
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
 * Extracts every `--name: value` declaration from one flat rule body, given the opener as the minified CSS has it
 * (e.g. `:root{`). Splits on top-level `;` with no nesting: tokens.css declares only flat custom properties.
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
 * Resolves a custom property to a literal `#rrggbb`, following one level of `var(--other-name)` (the stylesheet
 * never nests deeper, e.g. `--bl-color-invalid: var(--bl-value-redlines)`).
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
