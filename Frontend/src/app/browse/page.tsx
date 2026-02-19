"use client";

import { useState, useCallback } from "react";
import { useListings, useIsMobile } from "@/hooks";
import { PolaroidCard } from "@/components/browse/PolaroidCard";
import type { ListingFilters } from "@/types";

type ViewMode = "board" | "grid" | "map";

const rotations = [
  [-1.8, 1.2, -0.6],
  [0.9, -1.5, 0.4],
  [1.3, -0.8, 0.5],
];

const staggers = [
  [0, 16, 6],
  [10, 0, 8],
  [4, 18, 0],
];

export default function BrowsePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [filters, setFilters] = useState<ListingFilters>({ status: "active", limit: 20 });
  const isMobile = useIsMobile();

  const { data: listings, isLoading, error } = useListings(filters);

  const togglePin = useCallback((id: number) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  }, []);

  // Group listings by distance for board view
  const nearCampus = listings.filter((l) => (l.walk_time_minutes ?? 99) <= 10);
  const midDistance = listings.filter((l) => {
    const wt = l.walk_time_minutes ?? 99;
    return wt > 10 && wt <= 20;
  });
  const farther = listings.filter((l) => (l.walk_time_minutes ?? 0) > 20);

  const sections = [
    { key: "near", title: "Near Campus", emoji: "🎓", subtitle: "Walking distance to classes", items: nearCampus },
    { key: "mid", title: "Stone Road Area", emoji: "🛍️", subtitle: "Close to shopping and transit", items: midDistance },
    { key: "far", title: "South End & Beyond", emoji: "🏘️", subtitle: "More space, great value", items: farther },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      {/* Hero + View toggle */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-5 md:pt-8 pb-1 md:pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1
              className="text-[#1B2D45]"
              style={{
                fontSize: isMobile ? "24px" : "32px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Find your Guelph cribb 🏠
            </h1>
            <p
              className="mt-1 md:mt-1.5 text-[#1B2D45]/45"
              style={{ fontSize: isMobile ? "12px" : "14px", fontWeight: 400 }}
            >
              <span className="text-[#1B2D45]/70" style={{ fontWeight: 600 }}>
                {listings.length} listings
              </span>{" "}
              available near University of Guelph
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-white rounded-lg border border-black/[0.06] p-0.5 shrink-0">
            {(["board", "grid", "map"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  viewMode === mode
                    ? "bg-[#FF6B35] text-white"
                    : "text-[#1B2D45]/40 hover:text-[#1B2D45]/60"
                }`}
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {mode === "board" ? "📌 Board" : mode === "grid" ? "▦ Grid" : "🗺 Map"}
              </button>
            ))}
          </div>
        </div>

        {/* Stat insight cards */}
        <div className="flex items-center gap-2 md:gap-3 mt-4 md:mt-5 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {[
            { icon: "📈", label: "Avg rent", value: listings.length > 0 ? `$${Math.round(listings.reduce((acc, l) => acc + Number(l.rent_per_room), 0) / listings.length)}/rm` : "—", bg: "rgba(46,196,182,0.08)" },
            { icon: "✨", label: "Active listings", value: String(listings.length), bg: "rgba(255,107,53,0.08)" },
            { icon: "📅", label: "Sublets", value: String(listings.filter((l) => l.is_sublet).length), bg: "rgba(255,182,39,0.08)" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-black/5 shrink-0"
              style={{ backgroundColor: s.bg }}
            >
              <span style={{ fontSize: isMobile ? "14px" : "16px" }}>{s.icon}</span>
              <div>
                <div className="text-[#1B2D45]/40" style={{ fontSize: isMobile ? "9px" : "10px", fontWeight: 500, lineHeight: 1.2 }}>
                  {s.label}
                </div>
                <div className="text-[#1B2D45]" style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: 800, lineHeight: 1.2 }}>
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-20 text-center">
          <div className="text-[#1B2D45]/30" style={{ fontSize: "16px" }}>Loading listings...</div>
        </div>
      ) : error ? (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-20 text-center">
          <div className="text-[#E71D36]" style={{ fontSize: "14px" }}>
            Failed to load listings. Make sure the backend is running.
          </div>
          <p className="mt-2 text-[#1B2D45]/40" style={{ fontSize: "12px" }}>{error}</p>
        </div>
      ) : viewMode === "board" ? (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6 cork-bg">
          {sections.map((section, si) => (
            <div key={section.key} className="mb-8 md:mb-14">
              <div className="mb-4 md:mb-6">
                <h2
                  className="text-[#1B2D45] flex items-center gap-2"
                  style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800 }}
                >
                  {section.title}{" "}
                  <span style={{ fontSize: isMobile ? "16px" : "20px" }}>{section.emoji}</span>
                </h2>
                <p className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "12px", fontWeight: 400 }}>
                  {section.subtitle}
                </p>
              </div>

              <div
                className={isMobile ? "flex flex-col gap-5" : "grid gap-6"}
                style={
                  isMobile
                    ? undefined
                    : {
                        gridTemplateColumns:
                          section.items.length === 2
                            ? "repeat(2, minmax(0, 1fr))"
                            : "repeat(3, minmax(0, 1fr))",
                        maxWidth: section.items.length === 2 ? "680px" : undefined,
                      }
                }
              >
                {section.items.map((listing, i) => (
                  <div
                    key={listing.id}
                    style={
                      isMobile
                        ? undefined
                        : { marginTop: `${(staggers[si % 3] ?? staggers[0])[i % 3] ?? 0}px` }
                    }
                  >
                    <PolaroidCard
                      listing={listing}
                      rotation={
                        isMobile
                          ? (rotations[si % 3] ?? rotations[0])[i % 3] * 0.7
                          : (rotations[si % 3] ?? rotations[0])[i % 3] ?? 0
                      }
                      isPinned={pinnedIds.includes(listing.id)}
                      onTogglePin={togglePin}
                      isMobile={isMobile}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {sections.length === 0 && (
            <div className="text-center py-20">
              <div style={{ fontSize: "48px" }}>🏠</div>
              <h3 className="mt-4 text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 700 }}>
                No listings yet
              </h3>
              <p className="mt-2 text-[#1B2D45]/40" style={{ fontSize: "14px" }}>
                Listings will appear here once landlords start posting.
              </p>
            </div>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {listings.map((listing) => (
              <PolaroidCard
                key={listing.id}
                listing={listing}
                rotation={0}
                isPinned={pinnedIds.includes(listing.id)}
                onTogglePin={togglePin}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="bg-white rounded-xl border border-black/[0.06] h-[500px] flex items-center justify-center text-[#1B2D45]/30">
            <div className="text-center">
              <div style={{ fontSize: "48px" }}>🗺</div>
              <p className="mt-3" style={{ fontSize: "14px", fontWeight: 500 }}>
                Map view — coming soon
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
