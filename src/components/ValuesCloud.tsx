import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { AccordionItem } from './AccordionItem';

/**
 * Consumer-defined accent key, exposed on each node as `data-accent` so the
 * consumer's CSS can map it to a colour (e.g. `[data-accent='foo'] { --value-accent: ... }`).
 * Any string works — this package has no opinion on the taxonomy.
 */
export type ValueAccent = string;

export type Value = {
  readonly title: string;
  readonly icon?: React.ComponentType<{ className?: string }>;
  readonly body?: React.ReactNode;
  readonly accent: ValueAccent;
};

export interface ValuesCloudProps {
  readonly values: readonly Value[];
  readonly ariaLabel?: string;
  /**
   * Disable the idle floating ("wiggle") animation on ring nodes.
   *
   * Off by default. `prefers-reduced-motion: reduce` already disables the
   * wiggle regardless of this prop — use this when you want it off
   * unconditionally, e.g. for a calmer presentation.
   */
  readonly disableWiggle?: boolean;
}

const SPEECH_ID = 'bl-values-cloud-speech';
const SPEECH_TITLE_ID = 'bl-values-cloud-speech-title';
const SPEECH_BODY_ID = 'bl-values-cloud-speech-body';
// Shared across every accordion item so the browser enforces one-open-at-a-
// time natively (via <details name>) even with JavaScript disabled — a
// no-JS defense-in-depth layered on top of the `openValueId` state below.
const ACCORDION_NAME = 'bl-values-cloud-accordion';

/**
 * Cloud of orbiting value icons around a central hint (desktop, above
 * ~425px), falling back to a collapsed accordion (`AccordionItem`) on
 * small mobile. Both views share a single `openValueId` state — selecting
 * a value is a plain disclosure toggle, not a modal:
 *   - Desktop: the selected bubble animates to a fixed spot at the centre
 *     of the ring (replacing the hint text), the rest of the cloud dims,
 *     and a boxy speech-bubble panel grows out of it with the full text.
 *     Above 768px the whole cloud additionally slides to sit alongside the
 *     speech bubble rather than on top of it. Toggled via
 *     `aria-expanded`/`aria-controls` on a plain button.
 *   - Small mobile: the same state expands an `AccordionItem` panel in
 *     place — native `<details>`/`<summary>` semantics, no explicit ARIA
 *     needed, and works with JavaScript disabled.
 * Nothing is inert and there's no focus trap — background bubbles stay
 * clickable so switching the selection is a direct, one-click action.
 *
 * Ships structural CSS via `@branchleft/components/css` (see
 * `ValuesCloud.css`) — the layout/positioning isn't reasonable to ask every
 * consumer to reimplement. Colour comes from a `data-accent` attribute on
 * each node/panel, keyed off `Value.accent` (an opaque string — this
 * package assigns it no meaning of its own) so the consumer's CSS can map
 * it to a `--value-accent` colour.
 */
export function ValuesCloud({
  values,
  ariaLabel = 'Values',
  disableWiggle = false,
}: Readonly<ValuesCloudProps>): React.JSX.Element {
  const [openValueId, setOpenValueId] = React.useState<ValueAccent | null>(null);
  const selectedTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const prefersReduced = usePrefersReducedMotion();

  const activeValue = values.find((v) => v.accent === openValueId) ?? null;

  const deselect = React.useCallback(() => {
    setOpenValueId(null);
    selectedTriggerRef.current?.focus();
  }, []);

  function selectRingValue(value: Value, trigger: HTMLButtonElement) {
    if (openValueId === value.accent) {
      setOpenValueId(null);
      return;
    }
    selectedTriggerRef.current = trigger;
    setOpenValueId(value.accent);
  }

  // Escape closes the speech bubble — a plain keydown listener is enough
  // since this isn't a modal (nothing is inert, no focus trap to release).
  React.useEffect(() => {
    if (openValueId === null) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') deselect();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openValueId, deselect]);

  const speechTransition = { duration: prefersReduced ? 0 : 0.25, ease: 'easeOut' as const };

  const rootClass = [
    'bl-values-cloud',
    activeValue ? 'bl-values-cloud--selected' : null,
    disableWiggle ? 'bl-values-cloud--no-wiggle' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      <motion.div
        className="bl-values-cloud__stage"
        layout
        transition={{ duration: prefersReduced ? 0 : 0.4, ease: 'easeOut' }}
      >
        <div className="bl-values-cloud__hub">
          <p className="bl-values-cloud__hub-text">select one of the values to learn more</p>
        </div>
        <div className="bl-values-cloud__ring">
          <ul className="bl-values-cloud__nodes" aria-label={ariaLabel}>
            {values.map((value, index) => {
              const isSelected = openValueId === value.accent;
              return (
                <li
                  key={value.accent}
                  className={
                    isSelected
                      ? 'bl-values-cloud__node bl-values-cloud__node--selected'
                      : 'bl-values-cloud__node'
                  }
                  style={{ '--i': index, '--n': values.length } as React.CSSProperties}
                >
                  <div className="bl-values-cloud__node-inner" data-accent={value.accent}>
                    <button
                      type="button"
                      className="bl-values-cloud__trigger"
                      aria-expanded={isSelected}
                      aria-controls={SPEECH_ID}
                      aria-label={value.title}
                      onClick={(event) => selectRingValue(value, event.currentTarget)}
                    >
                      {value.icon && (
                        <value.icon className="bl-values-cloud__icon" aria-hidden="true" />
                      )}
                    </button>
                    <span className="bl-values-cloud__label" aria-hidden="true">
                      {value.title}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </motion.div>

      <div className="bl-values-cloud__speech-area">
        <div id={SPEECH_ID} className="bl-values-cloud__speech" aria-hidden={!activeValue}>
          <AnimatePresence mode="popLayout">
            {activeValue && (
              <motion.div
                key={activeValue.accent}
                className="bl-values-cloud__speech-box"
                data-accent={activeValue.accent}
                initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: prefersReduced ? 1 : 0.9 }}
                transition={speechTransition}
              >
                <button
                  type="button"
                  className="bl-values-cloud__speech-close"
                  onClick={deselect}
                  aria-label={`Close ${activeValue.title}`}
                >
                  <X aria-hidden="true" />
                </button>
                <h3 id={SPEECH_TITLE_ID} className="bl-values-cloud__speech-title">
                  {activeValue.icon && (
                    <activeValue.icon className="bl-values-cloud__icon" aria-hidden="true" />
                  )}
                  {activeValue.title}
                </h3>
                {activeValue.body && (
                  <p id={SPEECH_BODY_ID} className="bl-values-cloud__speech-body">
                    {activeValue.body}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bl-values-cloud__accordion">
        {values.map((value) => (
          <AccordionItem
            key={value.accent}
            className="bl-values-cloud__accordion-item"
            data-accent={value.accent}
            name={ACCORDION_NAME}
            open={openValueId === value.accent}
            onOpenChange={(open) =>
              setOpenValueId((current) => {
                if (open) return value.accent;
                // A `false` event can come from two different causes: the
                // user explicitly closing *this* item, or the browser's
                // native `name`-based exclusivity auto-closing it because a
                // *different* item just opened (both fire as separate
                // `toggle` events from the same click, and React batches
                // them). Only clear the selection if this item was actually
                // the one selected — otherwise this stale close event would
                // stomp on the other item's selection that just landed.
                return current === value.accent ? null : current;
              })
            }
            summary={
              <>
                {value.icon && <value.icon className="bl-values-cloud__icon" aria-hidden="true" />}
                <span className="bl-values-cloud__accordion-title">{value.title}</span>
              </>
            }
          >
            {value.body && <p className="bl-values-cloud__accordion-body">{value.body}</p>}
          </AccordionItem>
        ))}
      </div>
    </div>
  );
}
