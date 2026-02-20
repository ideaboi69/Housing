"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useInView,
  useTransform,
} from "framer-motion";
import { getScoreColor } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: number;
  /** If true, skips the scroll-trigger and animates immediately on mount */
  immediate?: boolean;
}

/**
 * Animated circular health-score ring.
 * – Draws its coloured arc from 0→score when scrolled into view.
 * – The number inside counts up with a spring.
 * – Colour is derived from the existing getScoreColor util.
 */
export function ScoreRing({
  score,
  size = 38,
  immediate = false,
}: ScoreRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const shouldAnimate = immediate || isInView;

  const sw = size <= 40 ? 3 : size <= 60 ? 4 : 8;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;

  const color = getScoreColor(score);

  /* ── stroke-dashoffset spring ─────────────────── */
  const dashOffset = useMotionValue(c); // start fully hidden
  const springOffset = useSpring(dashOffset, {
    stiffness: 60,
    damping: 20,
    mass: 0.8,
  });

  /* ── number ticker ────────────────────────────── */
  const displayScore = useMotionValue(0);
  const springScore = useSpring(displayScore, {
    stiffness: 80,
    damping: 22,
  });
  const [rendered, setRendered] = useState(0);

  useEffect(() => {
    const unsub = springScore.on("change", (v) => setRendered(Math.round(v)));
    return unsub;
  }, [springScore]);

  /* ── trigger ──────────────────────────────────── */
  useEffect(() => {
    if (shouldAnimate) {
      const target = c - (score / 100) * c;
      dashOffset.set(target);
      displayScore.set(score);
    }
  }, [shouldAnimate, score, c, dashOffset, displayScore]);

  return (
    <div
      ref={ref}
      className="relative"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="rgba(255,255,255,0.85)"
          stroke="rgba(27,45,69,0.08)"
          strokeWidth={sw}
        />
        {/* animated arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={c}
          strokeLinecap="round"
          style={{ strokeDashoffset: springOffset }}
        />
      </svg>

      {/* number */}
      <span
        className="absolute inset-0 flex items-center justify-center text-[#1B2D45]"
        style={{
          fontSize: size <= 40 ? "10px" : size <= 60 ? "16px" : "36px",
          fontWeight: 800,
        }}
      >
        {rendered}
      </span>
    </div>
  );
}
