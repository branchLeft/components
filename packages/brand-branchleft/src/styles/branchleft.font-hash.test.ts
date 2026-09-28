// @vitest-environment node
//
// Runs `vite build()` (esbuild under the hood) to get the real built CSS —
// esbuild's native bridge relies on a `TextEncoder`/`Uint8Array` invariant
// that jsdom's polyfills break, so this file needs the plain Node
// environment rather than the package's jsdom default.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStylesheetDist } from './testUtils/buildStylesheet';

const FONTS_SOURCE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fonts');

// Same list, same order as `vite.config.ts`'s `extractFontsPlugin` —
// `FONT_FILES` there matches each inlined base64 data URI to a source file
// by POSITION, not by content (cycle-2 review's one non-blocking
// observation). A sha256 comparison here is the content-level guarantee
// that observation asked for: if the plugin ever matched the wrong file to
// the wrong position, this test catches it even though the plugin's own
// "did every font get replaced" count check would still pass.
const FONT_FILES = [
  'Syne/Syne-VariableFont_wght.woff2',
  'SpaceGrotesk/SpaceGrotesk-VariableFont_wght.woff2',
  'RobotoMono/RobotoMono-VariableFont_wght.woff2',
  'RobotoMono/RobotoMono-Italic-VariableFont_wght.woff2',
  'IBMPlexSans/IBMPlexSans-Regular.woff2',
  'IBMPlexSans/IBMPlexSans-Italic.woff2',
  'IBMPlexSans/IBMPlexSans-Medium.woff2',
  'IBMPlexSans/IBMPlexSans-SemiBold.woff2',
];

function sha256(filePath: string): string {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

let outDir: string;

beforeAll(async () => {
  outDir = await buildStylesheetDist();
}, 30_000);

afterAll(() => {
  fs.rmSync(outDir, { recursive: true, force: true });
});

describe('dist/fonts/*.woff2 content matches src/styles/fonts/*.woff2', () => {
  it.each(FONT_FILES)('%s is byte-identical to its source file', (relativePath) => {
    const sourcePath = path.join(FONTS_SOURCE_DIR, relativePath);
    const extractedPath = path.join(outDir, 'fonts', relativePath);

    expect(fs.existsSync(extractedPath)).toBe(true);
    expect(sha256(extractedPath)).toBe(sha256(sourcePath));
  });
});

// Same family directories as FONT_FILES, one licence file each — every font
// this package ships is SIL OFL 1.1 (see fonts.css's header comment), and
// the package's own `license: "MIT"` in package.json covers only its code,
// never the font bytes. A published tarball with the woff2 files but no
// OFL.txt beside them would redistribute those fonts under no stated
// licence at all — this is what closes that gap (see also `pnpm pack`'s
// tarball contents, checked in the PR body).
const FONT_FAMILY_DIRS = Array.from(
  new Set(FONT_FILES.map((relativePath) => path.dirname(relativePath)))
);

describe('dist/fonts/<Family>/OFL.txt is shipped alongside each family', () => {
  it.each(FONT_FAMILY_DIRS)('%s/OFL.txt matches its source licence text', (familyDir) => {
    const sourcePath = path.join(FONTS_SOURCE_DIR, familyDir, 'OFL.txt');
    const extractedPath = path.join(outDir, 'fonts', familyDir, 'OFL.txt');

    expect(fs.existsSync(extractedPath)).toBe(true);
    expect(fs.readFileSync(extractedPath, 'utf8')).toBe(fs.readFileSync(sourcePath, 'utf8'));
  });
});
