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
   * Passed to the native `<details name>`: items sharing a `name` get browser-enforced
   * exclusivity with no JS (a `toggle` event fires on any auto-closed sibling).
   */
  readonly name?: string;
  readonly className?: string;
}

/**
 * Disclosure item on native `<details>`/`<summary>` (no JS), fully controlled via `open`/`onOpenChange`. CSS ships
 * in `@branchleft/components/css` (see AccordionItem.css); colour from `--bl-accordion-accent`, else `--bl-color-fg`.
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
