// The library source is deliberately typed against `vite/client`, not
// `node` (see tsconfig.node.json's header comment), so this test — which
// genuinely needs the filesystem to read the spec independently of the
// generated module — pulls in Node's ambient types for itself only, rather
// than widening that boundary for every file under src/.
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

// Read the spec independently of publicPressMark.generated.ts (the module
// under test), via the filesystem rather than an import of it — a test that
// imported its own expected values from the generated module would only
// prove internal self-consistency, never that generation preserved the
// spec's actual content. This is the control for that gap.
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

// Computed once, offline, from the approved pilcrow P outline as it stands
// in scripts/publicpress-mark-spec.json at the time this test was written
// (`shasum -a 256`). Deliberately not derived at runtime — the point of this
// test is to force a human to notice and re-approve any change to the
// glyph, not to always agree with whatever the spec currently says. If this
// assertion ever needs to change, that change to the mark itself must be
// deliberate and reviewed, not incidental.
const APPROVED_PILCROW_P_SHA256 =
  '6090500bf604ec7ef9f259c939be4f7642f2ec4997ed6acbf922d8b0b1d4e20f';

describe('pilcrow P glyph (pinned by hash)', () => {
  it("matches the approved outline's SHA-256, read directly from the spec", () => {
    const hash = createHash('sha256').update(spec.glyphs.pilcrowP.d, 'utf8').digest('hex');
    expect(hash).toBe(APPROVED_PILCROW_P_SHA256);
  });
});
