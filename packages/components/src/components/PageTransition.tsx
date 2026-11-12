import * as React from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export interface PageTransitionProps {
  readonly children: React.ReactNode;
}

/**
 * Fade + slide-up entrance for page content; use inside an `<AnimatePresence
 * mode="wait">` keyed by route. Ships only the `bl-page-transition` class hook.
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
