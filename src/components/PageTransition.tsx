import * as React from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export interface PageTransitionProps {
  readonly children: React.ReactNode;
}

/**
 * Wraps page content with a minimal fade + slide-up entrance animation.
 * Use inside an `<AnimatePresence mode="wait">` keyed by route path so
 * each navigation triggers a fresh transition.
 *
 * Ships no CSS beyond the `bl-page-transition` class hook — consumers
 * supply layout (e.g. `display: flex; flex: 1`) themselves.
 */
export function PageTransition({ children }: Readonly<PageTransitionProps>): React.JSX.Element {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <motion.div
      className="bl-page-transition"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
