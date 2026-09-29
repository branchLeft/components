import { build } from 'vite';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Runs the real `styles` entry via the package's own `vite.config.ts` — the
 * exact production build `pnpm build` runs, only redirected to a throwaway
 * temp directory — and returns the resulting output directory, still on
 * disk, holding both `publicpress.css` and the extracted `dist/fonts/*`
 * files. The caller owns cleanup (`fs.rmSync(outDir, { recursive: true,
 * force: true })`). Mirrors @branchleft/brand-branchleft's own
 * `testUtils/buildStylesheet.ts`.
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
