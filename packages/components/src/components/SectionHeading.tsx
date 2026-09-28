import * as React from 'react';
import { Link as LinkIcon } from 'lucide-react';

export type SectionHeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface SectionHeadingProps extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'id'> {
  /**
   * Heading tag to render.
   *
   * @default "h2"
   */
  as?: SectionHeadingLevel;
  /**
   * Fragment identifier this heading anchors.
   *
   * When provided:
   *   - the heading receives `id={anchor}`
   *   - its text is wrapped in an `<a href="#${anchor}">`
   *   - a link icon is rendered after the text
   *   - the root gets a `bl-section-heading--linked` class hook
   *
   * When omitted the heading renders as a plain, non-interactive element.
   */
  anchor?: string;
  children: React.ReactNode;
}

/**
 * A section heading with an optional anchor link.
 *
 * Ships structural CSS via `@branchleft/components/css` — spacing between the
 * icon and text. Everything else (colours, fonts, hover/focus states) is left
 * to the consumer via class-name hooks: `.bl-section-heading`,
 * `.bl-section-heading--linked`, `.bl-section-heading__link`,
 * `.bl-section-heading__icon`, and `.bl-section-heading__text`.
 *
 * @example
 * ```tsx
 * <SectionHeading as="h2" anchor="values">Values</SectionHeading>
 * ```
 */
export function SectionHeading({
  as = 'h2',
  anchor,
  className,
  children,
  ...rest
}: Readonly<SectionHeadingProps>): React.JSX.Element {
  const Tag = as;
  const rootClass = ['bl-section-heading', anchor ? 'bl-section-heading--linked' : null, className]
    .filter(Boolean)
    .join(' ');

  if (!anchor) {
    return (
      <Tag className={rootClass} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag id={anchor} className={rootClass} {...rest}>
      <a className="bl-section-heading__link" href={`#${anchor}`}>
        <span className="bl-section-heading__text">{children}</span>
        <LinkIcon size="1em" className="bl-section-heading__icon" aria-hidden="true" />
      </a>
    </Tag>
  );
}
