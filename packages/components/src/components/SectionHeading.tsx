import * as React from 'react';
import { Link as LinkIcon } from 'lucide-react';

export type SectionHeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface SectionHeadingProps extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'id'> {
  /**
   * Heading tag to render.
   * @default "h2"
   */
  as?: SectionHeadingLevel;
  /**
   * Fragment identifier this heading anchors. When set, the heading gets `id={anchor}`, its text becomes a link with a
   * link icon, and the root gets `bl-section-heading--linked`; when omitted it is plain.
   */
  anchor?: string;
  children: React.ReactNode;
}

/**
 * Section heading with an optional anchor; CSS in `@branchleft/components/css`, colours via `.bl-section-heading*`.
 * @example <SectionHeading as="h2" anchor="values">Values</SectionHeading>
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
