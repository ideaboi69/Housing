"use client";

import { MotionConfig } from "framer-motion";

/**
 * Makes every Framer Motion animation respect the OS "reduce motion" setting.
 * `reducedMotion="user"` disables motion-sickness-triggering transforms while
 * keeping essential opacity changes. Pairs with the CSS reduced-motion reset
 * in globals.css for non-Framer animations/transitions.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
