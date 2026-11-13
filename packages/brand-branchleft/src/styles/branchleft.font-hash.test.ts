// @vitest-environment node
// Plain Node, not the jsdom default: vite's esbuild breaks under jsdom's TextEncoder
// polyfill (see README.md).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStylesheetDist } from './testUtils/buildStylesheet';

const FONTS_SOURCE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fonts');

// Same list, same order as `vite.config.ts`'s `extractFontsPlugin`, which matches
// inlined fonts to files by POSITION. A sha256 comparison is the content-level check:
// a mismatched pair is caught even if the plugin's own replaced-count check passes.
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

// Same family directories as FONT_FILES, one licence file each: every font here is SIL OFL 1.1 (see
// fonts.css), and the package's `license: "MIT"` covers only its code. A tarball with the woff2 files but
// no OFL.txt would redistribute the fonts under no stated licence; this closes that gap.
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
