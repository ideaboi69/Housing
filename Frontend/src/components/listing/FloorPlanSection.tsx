"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Ruler, X, Maximize2 } from "lucide-react";

/**
 * Dedicated "Floor Plan" section for listing/sublet detail pages.
 *
 * Compact full-width strip preview (object-cover) — click to open a fullscreen
 * popup where the entire diagram is visible and scrollable between plans.
 * Renders nothing when there are no floor plans.
 */
export function FloorPlanSection({ images }: { images: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const step = useCallback(
    (dir: number) => {
      setOpenIndex((cur) => {
        if (cur === null || images.length === 0) return cur;
        return (cur + dir + images.length) % images.length;
      });
    },
    [images.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, step]);

  if (images.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        <Ruler className="h-4 w-4 text-[#FF6B35]" />
        <h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Floor Plan</h3>
        {images.length > 1 && (
          <span className="text-[#1B2D45]/40" style={{ fontSize: "11px", fontWeight: 600 }}>
            · {images.length} plans
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpenIndex(0)}
        className="group relative mt-2 block h-[88px] w-full overflow-hidden rounded-xl border border-black/[0.06] bg-[#FAF8F4]"
        aria-label="Open floor plan"
      >
        <img
          src={images[0]}
          alt="Floor plan preview"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/35" />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[#1B2D45] shadow-sm">
          <Maximize2 className="h-3 w-3" />
          <span style={{ fontSize: "11px", fontWeight: 700 }}>
            {images.length > 1 ? "View plans" : "View plan"}
          </span>
        </div>
      </button>

      {openIndex !== null && images[openIndex] && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(-1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Previous floor plan"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Next floor plan"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <img
            src={images[openIndex]}
            alt={`Floor plan ${openIndex + 1}`}
            className="max-h-[88vh] max-w-[92vw] rounded-lg bg-white object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-white" style={{ fontSize: "12px", fontWeight: 600 }}>
              {openIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
