import { build } from 'vite';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Runs the production `styles` build into a temp directory holding `publicpress.css` and
 * `dist/fonts/*`; the caller cleans up. Mirrors brand-branchleft's `buildStylesheet`.
 */
export async function buildStylesheetDist(): Promise<string> {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'publicpress-stylesheet-dist-test-'));
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
