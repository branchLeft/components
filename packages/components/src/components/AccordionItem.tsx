import * as React from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItemProps extends Omit<
  React.DetailsHTMLAttributes<HTMLDetailsElement>,
  'open' | 'onToggle' | 'children' | 'name'
> {
  readonly summary: React.ReactNode;
  readonly children: React.ReactNode;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /**
   * Passed straight through to the native `<details name>` attribute.
   *
   * Give a group of items the same `name` to additionally opt into the
   * browser's built-in mutual-exclusion behaviour (only one open at a
   * time), enforced by the browser itself with no JS required — a no-JS
   * fallback layered on top of whatever state management `open`/
   * `onOpenChange` are wired to. The browser fires a `toggle` event on any
   * sibling it auto-closes, so a controlled consumer stays in sync.
   */
  readonly name?: string;
  readonly className?: string;
}

/**
 * A single disclosure item built on native `<details>`/`<summary>` — no
 * `aria-expanded`/`aria-controls` needed, the browser conveys expanded
 * state and the trigger/panel relationship to assistive tech for free.
 *
 * Fully controlled (`open`/`onOpenChange`) and holds no state-management
 * opinion of its own: render several with independent `open` state for a
 * multi-open accordion, or drive them all from one shared value for
 * one-open-at-a-time.
 *
 * Works with zero JavaScript — clicking `<summary>` toggles the native
 * `open` attribute regardless of whether React ever hydrates, and the
 * reveal/collapse is a plain CSS transition, not JS-driven.
 *
 * Ships structural CSS via `@branchleft/components/css` (see
 * `AccordionItem.css`) — the reveal animation isn't reasonable to ask
 * every consumer to reimplement, and doing it correctly requires
 * overriding a newer browser default that's easy to miss (see the CSS
 * file's header comment). Colour comes from `--bl-accordion-accent`
 * (falls back to `--bl-color-fg`); class-name hooks
 * (`bl-accordion-item`, `bl-accordion-item__summary`,
 * `bl-accordion-item__chevron`, `bl-accordion-item__panel`,
 * `bl-accordion-item__panel-inner`) are available for anything further.
 */
export function AccordionItem({
  summary,
  children,
  open,
  onOpenChange,
  name,
  className,
  ...rest
}: Readonly<AccordionItemProps>): React.JSX.Element {
  function handleToggle(event: React.SyntheticEvent<HTMLDetailsElement>) {
    onOpenChange(event.currentTarget.open);
  }

  const rootClass = ['bl-accordion-item', className].filter(Boolean).join(' ');

  return (
    <details className={rootClass} open={open} onToggle={handleToggle} name={name} {...rest}>
      <summary className="bl-accordion-item__summary">
        {summary}
        <ChevronDown className="bl-accordion-item__chevron" aria-hidden="true" />
      </summary>
      <div className="bl-accordion-item__panel">
        <div className="bl-accordion-item__panel-inner">{children}</div>
      </div>
    </details>
  );
}
