"use client";

import { getScoreColor } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 38 }: ScoreRingProps) {
  const sw = 3;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const progress = (score / 100) * c;
  const color = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="rgba(255,255,255,0.85)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={sw}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={c}
          strokeDashoffset={c - progress}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[#1B2D45]"
        style={{ fontSize: "10px", fontWeight: 800 }}
      >
        {score}
      </span>
    </div>
  );
}
