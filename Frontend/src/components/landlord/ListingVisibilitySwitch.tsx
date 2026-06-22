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
      className={`relative inline-flex h-6 w-[42px] shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2D45]/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        isActive ? "bg-[#1B2D45]" : "bg-[#D7DCE3] hover:bg-[#CBD2DB]"
      }`}
    >
      <span
        className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(27,45,69,0.3)] transition-all duration-200 ${
          isActive ? "left-[20px]" : "left-0.5"
        }`}
      >
        {loading && (
          <Loader2 className={`h-3 w-3 animate-spin ${isActive ? "text-[#1B2D45]" : "text-[#1B2D45]/55"}`} />
        )}
      </span>
    </button>
  );
}
