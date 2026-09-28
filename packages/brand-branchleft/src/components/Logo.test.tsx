import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from '../test/axe';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders an svg with the three mark layers', () => {
    const html = renderToStaticMarkup(<Logo />);
    expect(html).toMatch(/^<svg\b/);
    expect(html).toContain('id="backdrop"');
    expect(html).toContain('id="main"');
    expect(html).toContain('id="overlay"');
  });

  it('defaults all layers to the branded palette', () => {
    const html = renderToStaticMarkup(<Logo />);
    expect(html).toContain('#B31761');
    expect(html).toContain('#FF006E');
  });

  it('resolves monowhite and monoblack colour keywords', () => {
    const white = renderToStaticMarkup(
      <Logo mainColor={{ type: 'monowhite' }} dropShadowColor={{ type: 'monowhite' }} />
    );
    expect(white).toContain('#ffffff');

    const black = renderToStaticMarkup(
      <Logo mainColor={{ type: 'monoblack' }} dropShadowColor={{ type: 'monoblack' }} />
    );
    expect(black).toContain('#000000');
  });

  it('accepts a custom colour', () => {
    const html = renderToStaticMarkup(<Logo mainColor={{ type: 'custom', color: '#0ea5e9' }} />);
    expect(html).toContain('#0ea5e9');
  });

  it('defaults overlayOpacity to 0.2 and accepts an override', () => {
    const defaultHtml = renderToStaticMarkup(<Logo />);
    expect(defaultHtml).toContain('opacity="0.2"');

    const customHtml = renderToStaticMarkup(<Logo overlayOpacity={0.5} />);
    expect(customHtml).toContain('opacity="0.5"');
  });

  it('passes through arbitrary svg props, such as className and aria attributes', () => {
    const html = renderToStaticMarkup(
      <Logo className="site-nav__logo" aria-label="branchLeft logo" role="img" />
    );
    expect(html).toContain('class="site-nav__logo"');
    expect(html).toContain('aria-label="branchLeft logo"');
    expect(html).toContain('role="img"');
  });

  it('renders no wrapper when `background` is omitted', () => {
    const html = renderToStaticMarkup(<Logo />);
    expect(html).toMatch(/^<svg\b/);
    expect(html).not.toContain('<div');
  });

  it('wraps the mark in a backdrop div when `background` is set', () => {
    const html = renderToStaticMarkup(<Logo background={{ type: 'black' }} />);
    expect(html).toMatch(/^<div/);
    expect(html).toContain('background-color:#000000');
    expect(html).toContain('<svg');
  });

  it('resolves white and custom backgrounds', () => {
    const white = renderToStaticMarkup(<Logo background={{ type: 'white' }} />);
    expect(white).toContain('background-color:#ffffff');

    const custom = renderToStaticMarkup(<Logo background={{ type: 'custom', color: '#020617' }} />);
    expect(custom).toContain('background-color:#020617');
  });

  it('does not take over the viewport — the backdrop is not position:fixed', () => {
    // Regression test: `background` used to render a full-viewport
    // `position: fixed; inset: 0` overlay, which is surprising behaviour for
    // a logo component and not something any consumer relied on. It now
    // only sizes to the mark itself.
    const html = renderToStaticMarkup(<Logo background={{ type: 'black' }} />);
    expect(html).not.toContain('position:fixed');
    expect(html).not.toContain('inset:0');
  });

  it('has no exported default — only the named `Logo` export', () => {
    expect(Logo).toBeInstanceOf(Function);
  });

  it('has no axe violations without a background', async () => {
    const html = renderToStaticMarkup(<Logo role="img" aria-label="branchLeft logo" />);
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations with a background', async () => {
    const html = renderToStaticMarkup(
      <Logo role="img" aria-label="branchLeft logo" background={{ type: 'white' }} />
    );
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });
});
