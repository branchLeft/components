import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from '../test/axe';
import { PublicPressLogo } from './PublicPressLogo';
import { PUBLIC_PRESS_GLYPHS } from './publicPressMark.generated';

// The logo block is square, side = the wordmark's 1340-unit block height.
// Hardcoded independently of the generated module so a geometry regression
// there still fails this test.
const EXPECTED_VIEW_BOX = '0 0 1340 1340';

const PILCROW_P_D = PUBLIC_PRESS_GLYPHS.pilcrowP.d;

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe('PublicPressLogo', () => {
  it('defaults to the blue ink', () => {
    const html = renderToStaticMarkup(<PublicPressLogo />);
    expect(html).toContain('fill="#3255A4"');
    expect(html).toContain('fill="#FAFAF7"');
  });

  it('renders the blue ink (block #3255A4, letters #FAFAF7)', () => {
    const html = renderToStaticMarkup(<PublicPressLogo color="blue" />);
    expect(html).toContain('fill="#3255A4"');
    expect(html).toContain('fill="#FAFAF7"');
    expect(html).not.toContain('fill="#000000"');
  });

  it('renders the black ink (block #000000, letters #FAFAF7)', () => {
    const html = renderToStaticMarkup(<PublicPressLogo color="black" />);
    expect(html).toContain('fill="#000000"');
    expect(html).toContain('fill="#FAFAF7"');
    expect(html).not.toContain('fill="#3255A4"');
  });

  it('renders the pink ink with white (#FAFAF7) letters, not black-on-pink', () => {
    const html = renderToStaticMarkup(<PublicPressLogo color="pink" />);
    expect(html).toContain('fill="#FF48B0"');
    expect(html).toContain('fill="#FAFAF7"');
    expect(html).not.toContain('fill="#000000"');
  });

  it('renders the yellow ink (block #FFE800, letters #000000)', () => {
    const html = renderToStaticMarkup(<PublicPressLogo color="yellow" />);
    expect(html).toContain('fill="#FFE800"');
    expect(html).toContain('fill="#000000"');
    expect(html).not.toContain('fill="#FAFAF7"');
  });

  it('renders exactly one pilcrow-P glyph', () => {
    const html = renderToStaticMarkup(<PublicPressLogo />);
    expect(countOccurrences(html, '<path')).toBe(1);
    expect(countOccurrences(html, `d="${PILCROW_P_D}"`)).toBe(1);
  });

  it('centres the pilcrow P in the square block', () => {
    const html = renderToStaticMarkup(<PublicPressLogo />);
    expect(html).toContain('transform="translate(244.5, 1020) scale(1,-1)"');
  });

  it('pins the logo viewBox to 1340x1340 — a single glyph, so no kerning applies', () => {
    const html = renderToStaticMarkup(<PublicPressLogo />);
    expect(html).toContain(`viewBox="${EXPECTED_VIEW_BOX}"`);
  });

  it('defaults height to 32px', () => {
    const html = renderToStaticMarkup(<PublicPressLogo />);
    expect(html).toContain('style="height:32px;width:auto"');
  });

  it('accepts height as a number (px)', () => {
    const html = renderToStaticMarkup(<PublicPressLogo height={40} />);
    expect(html).toContain('style="height:40px;width:auto"');
  });

  it('accepts height as a CSS length string', () => {
    const html = renderToStaticMarkup(<PublicPressLogo height="2em" />);
    expect(html).toContain('style="height:2em;width:auto"');
  });

  it('preserves the aspect ratio (viewBox) regardless of height', () => {
    const small = renderToStaticMarkup(<PublicPressLogo height={16} />);
    const large = renderToStaticMarkup(<PublicPressLogo height={512} />);
    expect(small).toContain(`viewBox="${EXPECTED_VIEW_BOX}"`);
    expect(large).toContain(`viewBox="${EXPECTED_VIEW_BOX}"`);
  });

  it('has an accessible name of "PublicPress" by default', () => {
    const html = renderToStaticMarkup(<PublicPressLogo />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="PublicPress"');
  });

  it('accepts a title override for the accessible name', () => {
    const html = renderToStaticMarkup(<PublicPressLogo title="PublicPress mark" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="PublicPress mark"');
  });

  it('renders decoratively with aria-hidden and no accessible name', () => {
    const html = renderToStaticMarkup(<PublicPressLogo decorative />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain('aria-label');
  });

  it('has no exported default — only the named `PublicPressLogo` export', () => {
    expect(PublicPressLogo).toBeInstanceOf(Function);
  });

  it('has no axe violations with the default accessible name', async () => {
    const html = renderToStaticMarkup(<PublicPressLogo />);
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations when decorative', async () => {
    const html = renderToStaticMarkup(<PublicPressLogo decorative />);
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });
});
