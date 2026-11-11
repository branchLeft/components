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
 * Disclosure item on native `<details>`/`<summary>`: the browser supplies the
 * expanded state and trigger/panel link, with zero JavaScript. Fully controlled
 * via `open`/`onOpenChange`. Structural CSS ships in `@branchleft/components/css`
 * and overrides a newer browser default, see AccordionItem.css. Colour comes
 * from `--bl-accordion-accent`, falling back to `--bl-color-fg`.
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
