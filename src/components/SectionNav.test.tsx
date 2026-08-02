import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from '../test/axe';
import { SectionNav } from './SectionNav';

const sections = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
];

describe('SectionNav', () => {
  it('renders a link per section with the bl-section-nav class hooks', () => {
    const html = renderToStaticMarkup(<SectionNav sections={sections} />);
    expect(html).toContain('bl-section-nav');
    expect(html).toContain('bl-section-nav__inner');
    expect(html).toContain('href="#one"');
    expect(html).toContain('href="#two"');
    expect(html).toContain('One');
    expect(html).toContain('Two');
  });

  it('marks the first section active and current on initial render', () => {
    const html = renderToStaticMarkup(<SectionNav sections={sections} />);
    expect(html).toContain('bl-section-nav__link--active');
    expect(html).toContain('aria-current="location"');
  });

  it('defaults aria-label to "Section navigation"', () => {
    const html = renderToStaticMarkup(<SectionNav sections={sections} />);
    expect(html).toContain('aria-label="Section navigation"');
  });

  it('accepts a custom aria-label', () => {
    const html = renderToStaticMarkup(
      <SectionNav sections={sections} ariaLabel="About sections" />
    );
    expect(html).toContain('aria-label="About sections"');
  });

  it('renders nothing marked active when there are no sections', () => {
    const html = renderToStaticMarkup(<SectionNav sections={[]} />);
    expect(html).not.toContain('bl-section-nav__link--active');
  });

  it('has no axe violations', async () => {
    const html = renderToStaticMarkup(<SectionNav sections={sections} />);
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });
});
