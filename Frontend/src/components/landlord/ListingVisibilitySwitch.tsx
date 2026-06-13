"use client";

import { Loader2 } from "lucide-react";
import type { MouseEvent } from "react";

interface ListingVisibilitySwitchProps {
  isActive: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  title?: string;
}

export function ListingVisibilitySwitch({
  isActive,
  disabled = false,
  loading = false,
  onClick,
  title,
}: ListingVisibilitySwitchProps) {
  const actionLabel = isActive ? "Unpublish listing" : "Publish listing";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={actionLabel}
      title={title ?? actionLabel}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-grid h-8 w-[78px] shrink-0 grid-cols-2 items-center rounded-full border p-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2D45]/25 disabled:cursor-not-allowed disabled:opacity-55 ${
        isActive
          ? "border-[#1B2D45] bg-[#1B2D45]"
          : "border-[#1B2D45]/12 bg-[#EEF2F7] hover:border-[#1B2D45]/22"
      }`}
    >
      {loading ? (
        <span className="col-span-2 flex items-center justify-center">
          <Loader2 className={`h-3.5 w-3.5 animate-spin ${isActive ? "text-white" : "text-[#1B2D45]"}`} />
        </span>
      ) : (
        <>
          <span
            className={`flex h-7 items-center justify-center rounded-full transition-all ${
              isActive
                ? "bg-white text-[#1B2D45] shadow-sm"
                : "text-[#1B2D45]/45"
            }`}
            style={{ fontSize: "10px", fontWeight: 900 }}
          >
            Live
          </span>
          <span
            className={`flex h-7 items-center justify-center rounded-full transition-all ${
              isActive
                ? "text-white/65"
                : "bg-white text-[#1B2D45] shadow-sm"
            }`}
            style={{ fontSize: "10px", fontWeight: 900 }}
          >
            Off
          </span>
        </>
      )}
    </button>
  );
}
