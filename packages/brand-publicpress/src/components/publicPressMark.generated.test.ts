// The library source is typed against `vite/client`, not `node` (see tsconfig.node.json), so this test,
// which needs the filesystem to read the spec independently of the generated module, pulls in Node's
// types for itself only.
/// <reference types="node" />

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  UNITS_PER_EM,
  CAP_HEIGHT,
  PUBLIC_PRESS_BLOCK,
  PUBLIC_PRESS_GLYPHS,
  PUBLIC_PRESS_WORDMARK_SEQUENCE,
  PUBLIC_PRESS_KERNING,
  PUBLIC_PRESS_INKS,
} from './publicPressMark.generated';

// Read the spec from the filesystem, not by importing publicPressMark.generated.ts (the module under test): a test
// importing its own expected values would only prove self-consistency, never that generation preserved the spec.
const specPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'scripts',
  'publicpress-mark-spec.json'
);
const spec = JSON.parse(readFileSync(specPath, 'utf8'));

describe('publicPressMark.generated (parity with scripts/publicpress-mark-spec.json)', () => {
  it('matches the spec units-per-em and cap height', () => {
    expect(UNITS_PER_EM).toBe(spec.unitsPerEm);
    expect(CAP_HEIGHT).toBe(spec.capHeight);
  });

  it('matches the spec block geometry', () => {
    expect(PUBLIC_PRESS_BLOCK).toEqual({
      top: spec.block.top,
      bottom: spec.block.bottom,
      sides: spec.block.sides,
      gapAfterC: spec.block.gapAfterC,
      height: spec.block.height,
    });
  });

  it('has exactly the spec glyph set, with no missing or extra names', () => {
    expect(Object.keys(PUBLIC_PRESS_GLYPHS).sort()).toEqual(Object.keys(spec.glyphs).sort());
  });

  it.each(Object.keys(spec.glyphs))(
    'matches the spec outline and advance for glyph "%s"',
    (name) => {
      expect(PUBLIC_PRESS_GLYPHS[name]).toEqual({
        d: spec.glyphs[name].d,
        adv: spec.glyphs[name].adv,
      });
    }
  );

  it('matches the spec wordmark sequence', () => {
    expect(PUBLIC_PRESS_WORDMARK_SEQUENCE).toEqual(spec.sequence);
  });

  it('matches the spec kerning table', () => {
    expect(PUBLIC_PRESS_KERNING).toEqual(spec.kerning ?? {});
  });

  it('matches the spec inks', () => {
    expect(PUBLIC_PRESS_INKS).toEqual(spec.inks);
  });
});

// Computed once, offline, from the approved pilcrow P outline in
// scripts/publicpress-mark-spec.json (`shasum -a 256`). Deliberately not derived at
// runtime: any change to the glyph must be noticed, deliberate and re-approved.
const APPROVED_PILCROW_P_SHA256 =
  '6090500bf604ec7ef9f259c939be4f7642f2ec4997ed6acbf922d8b0b1d4e20f';

describe('pilcrow P glyph (pinned by hash)', () => {
  it("matches the approved outline's SHA-256, read directly from the spec", () => {
    const hash = createHash('sha256').update(spec.glyphs.pilcrowP.d, 'utf8').digest('hex');
    expect(hash).toBe(APPROVED_PILCROW_P_SHA256);
  });
});
