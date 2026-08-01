import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PageTransition } from './PageTransition';

describe('PageTransition', () => {
  it('renders its children inside the bl-page-transition class hook', () => {
    const html = renderToStaticMarkup(
      <PageTransition>
        <p>Page content</p>
      </PageTransition>
    );
    expect(html).toContain('bl-page-transition');
    expect(html).toContain('Page content');
  });
});
