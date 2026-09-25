import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from '../test/axe';
import { PublicPressWordmark } from './PublicPressWordmark';
import { PUBLIC_PRESS_GLYPHS } from './publicPressMark.generated';

// The wordmark's block: 260-unit side insets + the sequence advances
// (pilcrowP, u, b, l, i, c, the 60-unit gap, pilcrowP, r, e, s, s) + 260,
// against a fixed 1340-unit block height. Hardcoded independently of the
// generated module so a geometry regression there still fails this test.
const EXPECTED_VIEW_BOX = '0 0 6637 1340';

const PILCROW_P_D = PUBLIC_PRESS_GLYPHS.pilcrowP.d;

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe('PublicPressWordmark', () => {
  it('defaults to the blue ink', () => {
    const html = renderToStaticMarkup(<PublicPressWordmark />);
    expect(html).toContain('fill="#3255A4"');
    expect(html).toContain('fill="#FAFAF7"');
  });

  it('renders the blue ink (block #3255A4, letters #FAFAF7)', () => {
    const html = renderToStaticMarkup(<PublicPressWordmark color="blue" />);
    expect(html).toContain('fill="#3255A4"');
    expect(html).toContain('fill="#FAFAF7"');
    expect(html).not.toContain('fill="#000000"');
  });

  it('renders the black ink (block #000000, letters #FAFAF7)', () => {
    const html = renderToStaticMarkup(<PublicPressWordmark color="black" />);
    expect(html).toContain('fill="#000000"');
    expect(html).toContain('fill="#FAFAF7"');
    expect(html).not.toContain('fill="#3255A4"');
  });

  it('renders the pink ink with white (#FAFAF7) letters, not black-on-pink', () => {
    const html = renderToStaticMarkup(<PublicPressWordmark color="pink" />);
    expect(html).toContain('fill="#FF48B0"');
    expect(html).toContain('fill="#FAFAF7"');
    expect(html).not.toContain('fill="#000000"');
  });

  it('renders the yellow ink (block #FFE800, letters #000000)', () => {
    const html = renderToStaticMarkup(<PublicPressWordmark color="yellow" />);
    expect(html).toContain('fill="#FFE800"');
    expect(html).toContain('fill="#000000"');
    expect(html).not.toContain('fill="#FAFAF7"');
  });

  it('renders exactly two pilcrow-P glyphs and nine other letters', () => {
    const html = renderToStaticMarkup(<PublicPressWordmark />);
    expect(countOccurrences(html, '<path')).toBe(11);
    expect(countOccurrences(html, `d="${PILCROW_P_D}"`)).toBe(2);
  });

  it('sizes the block and viewBox to the full wordmark, including the gap after the c', () => {
    const html = renderToStaticMarkup(<PublicPressWordmark />);
    expect(html).toContain(`viewBox="${EXPECTED_VIEW_BOX}"`);
    expect(html).toContain('width="6637"');
    expect(html).toContain('height="1340"');
  });

  it('accepts height as a number (px)', () => {
    const html = renderToStaticMarkup(<PublicPressWordmark height={64} />);
    expect(html).toContain('style="height:64px;width:auto"');
  });

  it('accepts height as a CSS length string', () => {
    const html = renderToStaticMarkup(<PublicPressWordmark height="3rem" />);
    expect(html).toContain('style="height:3rem;width:auto"');
  });

  it('preserves the aspect ratio (viewBox) regardless of height', () => {
    const small = renderToStaticMarkup(<PublicPressWordmark height={20} />);
    const large = renderToStaticMarkup(<PublicPressWordmark height={400} />);
    expect(small).toContain(`viewBox="${EXPECTED_VIEW_BOX}"`);
    expect(large).toContain(`viewBox="${EXPECTED_VIEW_BOX}"`);
  });

  it('has an accessible name of "PublicPress" by default', () => {
    const html = renderToStaticMarkup(<PublicPressWordmark />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="PublicPress"');
  });

  it('accepts a title override for the accessible name', () => {
    const html = renderToStaticMarkup(<PublicPressWordmark title="PublicPress, blue" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="PublicPress, blue"');
  });

  it('renders decoratively with aria-hidden and no accessible name', () => {
    const html = renderToStaticMarkup(<PublicPressWordmark decorative />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain('aria-label');
  });

  it('has no exported default — only the named `PublicPressWordmark` export', () => {
    expect(PublicPressWordmark).toBeInstanceOf(Function);
  });

  it('has no axe violations with the default accessible name', async () => {
    const html = renderToStaticMarkup(<PublicPressWordmark />);
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations when decorative', async () => {
    const html = renderToStaticMarkup(<PublicPressWordmark decorative />);
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });
});
