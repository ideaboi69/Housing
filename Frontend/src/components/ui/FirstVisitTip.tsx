"use client";

import { useState } from "react";
import { Lightbulb, X } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";

/**
 * A small dismissible tip shown once per `tipKey` (tracked in onboarding state).
 * Drop it at the top of a page/section to explain it on first visit.
 */
export function FirstVisitTip({
  tipKey,
  title,
  children,
}: {
  tipKey: string;
  title: string;
  children: React.ReactNode;
}) {
  const { hydrated, isTipSeen, markTipSeen } = useOnboarding();
  const [dismissed, setDismissed] = useState(false);

  if (!hydrated || dismissed || isTipSeen(tipKey)) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-[#FF6B35]/20 bg-[#FF6B35]/[0.05] px-4 py-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF6B35]/12 text-[#FF6B35]">
        <Lightbulb className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{title}</p>
        <p className="mt-0.5 text-[#1B2D45]/60" style={{ fontSize: "12.5px", lineHeight: 1.55 }}>{children}</p>
      </div>
      <button
        onClick={() => { setDismissed(true); markTipSeen(tipKey); }}
        aria-label="Dismiss tip"
        className="shrink-0 rounded-lg p-1 text-[#1B2D45]/30 transition-colors hover:bg-[#1B2D45]/5 hover:text-[#1B2D45]/60"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
