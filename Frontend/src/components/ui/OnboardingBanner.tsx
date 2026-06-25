"use client";

import { Sparkles } from "lucide-react";

/**
 * Onboarding announcement shown on public feeds ahead of the September launch.
 * Reusable — drop into browse / sublets / marketplace as needed.
 */
export function OnboardingBanner() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-4 md:pt-6">
      <div className="flex items-start gap-3 rounded-2xl border border-[#FF6B35]/20 bg-[#FF6B35]/[0.06] px-4 py-3 md:px-5 md:py-3.5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF6B35]/15 text-[#FF6B35]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Cribb
          </p>
          <p className="text-[#1B2D45]/75 mt-0.5" style={{ fontSize: "13px", lineHeight: 1.55, fontWeight: 500 }}>
            We are currently onboarding founding landlords and early student listings ahead of our launch. New listings are being added daily.
          </p>
        </div>
      </div>
    </div>
  );
}
