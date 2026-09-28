import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from '../test/axe';
import { SectionHeading } from './SectionHeading';

describe('SectionHeading', () => {
  it('renders the given heading level via the `as` prop', () => {
    const html = renderToStaticMarkup(<SectionHeading as="h3">Solutions</SectionHeading>);
    expect(html).toMatch(/^<h3\b/);
    expect(html).toContain('Solutions');
    expect(html).toContain('</h3>');
  });

  it('defaults to h2 when `as` is omitted', () => {
    const html = renderToStaticMarkup(<SectionHeading>Default level</SectionHeading>);
    expect(html).toMatch(/^<h2\b/);
  });

  it('renders no id, no anchor link, and no icon when `anchor` is omitted', () => {
    const html = renderToStaticMarkup(<SectionHeading as="h2">People</SectionHeading>);
    expect(html).not.toContain(' id=');
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('<svg');
    expect(html).not.toContain('bl-section-heading--linked');
    expect(html).toContain('bl-section-heading');
  });

  it('sets id, wraps text in an anchor, and renders the link icon when `anchor` is set', () => {
    const html = renderToStaticMarkup(
      <SectionHeading as="h2" anchor="values">
        Values
      </SectionHeading>
    );
    expect(html).toContain('id="values"');
    expect(html).toContain('href="#values"');
    expect(html).toContain('bl-section-heading--linked');
    expect(html).toContain('bl-section-heading__link');
    expect(html).toContain('bl-section-heading__icon');
    expect(html).toContain('<svg');
    expect(html).toContain('Values'); // The anchor must NOT set aria-label — it would override the heading's
    // accessible name (which should come from the visible text).
    expect(html).not.toContain('aria-label=');
  });

  it('appends consumer `className` to the root heading', () => {
    const html = renderToStaticMarkup(
      <SectionHeading as="h2" className="custom-class">
        Title
      </SectionHeading>
    );
    expect(html).toContain('bl-section-heading');
    expect(html).toContain('custom-class');
  });

  it('marks the link icon as decorative with aria-hidden', () => {
    const html = renderToStaticMarkup(
      <SectionHeading as="h2" anchor="x">
        X
      </SectionHeading>
    );
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it('has no axe violations without an anchor', async () => {
    const html = renderToStaticMarkup(<SectionHeading as="h2">Plain</SectionHeading>);
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations with an anchor', async () => {
    const html = renderToStaticMarkup(
      <SectionHeading as="h2" anchor="values">
        Values
      </SectionHeading>
    );
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });
});
