import * as React from 'react';

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
 * The component ships **no CSS** — only stable class-name hooks. Consumers style
 * hover/focus states themselves (see `.bl-section-heading`,
 * `.bl-section-heading--linked`, `.bl-section-heading__link`, and
 * `.bl-section-heading__icon`).
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
        <LinkIcon />
      </a>
    </Tag>
  );
}

/**
 * Inline chain-link icon. Uses `currentColor` so the consumer's hover styles
 * cascade into the SVG.
 */
function LinkIcon(): React.JSX.Element {
  return (
    <svg
      className="bl-section-heading__icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="0.7em"
      height="0.7em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* Two interlocked ovals, GitHub-style anchor glyph. */}
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}
