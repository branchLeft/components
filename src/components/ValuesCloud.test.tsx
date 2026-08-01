import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ValuesCloud, type Value } from './ValuesCloud';

const values: readonly Value[] = [
  { title: 'Sustainability', accent: 'sustainability', body: 'We plan for the long term.' },
  { title: 'Openness', accent: 'openness', body: 'We work in the open.' },
];

describe('ValuesCloud', () => {
  it('renders a ring node and an accordion item per value, with the bl-values-cloud class hooks', () => {
    const html = renderToStaticMarkup(<ValuesCloud values={values} />);
    expect(html).toContain('bl-values-cloud');
    expect(html).toContain('bl-values-cloud__node');
    expect(html).toContain('bl-values-cloud__accordion-item');
    expect(html).toContain('Sustainability');
    expect(html).toContain('Openness');
  });

  it("exposes each value's accent as a data-accent attribute", () => {
    const html = renderToStaticMarkup(<ValuesCloud values={values} />);
    expect(html).toContain('data-accent="sustainability"');
    expect(html).toContain('data-accent="openness"');
  });

  it('accepts an arbitrary string as accent, not a fixed taxonomy', () => {
    const custom: readonly Value[] = [{ title: 'Custom', accent: 'anything-goes' }];
    const html = renderToStaticMarkup(<ValuesCloud values={custom} />);
    expect(html).toContain('data-accent="anything-goes"');
  });

  it('renders no value selected/expanded on initial render', () => {
    const html = renderToStaticMarkup(<ValuesCloud values={values} />);
    expect(html).not.toContain('bl-values-cloud--selected');
    expect(html).not.toContain('aria-expanded="true"');
  });

  it('defaults aria-label to "Values" on the node list', () => {
    const html = renderToStaticMarkup(<ValuesCloud values={values} />);
    expect(html).toContain('aria-label="Values"');
  });

  it('accepts a custom aria-label', () => {
    const html = renderToStaticMarkup(<ValuesCloud values={values} ariaLabel="Our values" />);
    expect(html).toContain('aria-label="Our values"');
  });
});
