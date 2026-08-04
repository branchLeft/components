import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from '../test/axe';
import { AccordionItem } from './AccordionItem';

describe('AccordionItem', () => {
  it('renders summary and panel content, with the bl-accordion-item class hooks', () => {
    const html = renderToStaticMarkup(
      <AccordionItem summary="Design" open={false} onOpenChange={vi.fn()}>
        Panel body
      </AccordionItem>
    );
    expect(html).toContain('bl-accordion-item');
    expect(html).toContain('bl-accordion-item__summary');
    expect(html).toContain('bl-accordion-item__panel');
    expect(html).toContain('Design');
    expect(html).toContain('Panel body');
  });

  it('renders no open attribute when open is false', () => {
    const html = renderToStaticMarkup(
      <AccordionItem summary="Design" open={false} onOpenChange={vi.fn()}>
        Panel body
      </AccordionItem>
    );
    expect(html).not.toContain(' open=');
  });

  it('renders the open attribute when open is true', () => {
    const html = renderToStaticMarkup(
      <AccordionItem summary="Design" open={true} onOpenChange={vi.fn()}>
        Panel body
      </AccordionItem>
    );
    expect(html).toContain(' open=""');
  });

  it('passes the name prop through to the native details element', () => {
    const html = renderToStaticMarkup(
      <AccordionItem summary="Design" open={false} onOpenChange={vi.fn()} name="feature-groups">
        Panel body
      </AccordionItem>
    );
    expect(html).toContain('name="feature-groups"');
  });

  it('passes through arbitrary rest props (e.g. data-accent) to the root element', () => {
    const html = renderToStaticMarkup(
      <AccordionItem summary="Design" open={false} onOpenChange={vi.fn()} data-accent="design">
        Panel body
      </AccordionItem>
    );
    expect(html).toContain('data-accent="design"');
  });

  it('merges a consumer className with the bl-accordion-item root class', () => {
    const html = renderToStaticMarkup(
      <AccordionItem summary="Design" open={false} onOpenChange={vi.fn()} className="feature-group">
        Panel body
      </AccordionItem>
    );
    expect(html).toContain('class="bl-accordion-item feature-group"');
  });

  it('has no axe violations when closed', async () => {
    const html = renderToStaticMarkup(
      <AccordionItem summary="Design" open={false} onOpenChange={vi.fn()}>
        Panel body
      </AccordionItem>
    );
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations when open', async () => {
    const html = renderToStaticMarkup(
      <AccordionItem summary="Design" open={true} onOpenChange={vi.fn()}>
        Panel body
      </AccordionItem>
    );
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });
});
