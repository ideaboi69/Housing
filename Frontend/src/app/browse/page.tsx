"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks";
import { PolaroidCard } from "@/components/browse/PolaroidCard";
import { MapView } from "@/components/browse/MapView";
import { SearchAndFilters } from "@/components/browse/SearchAndFilters";
import { api } from "@/lib/api";
import { mockListings, mockHealthScores } from "@/lib/mock-data";
import type { ListingDetailResponse } from "@/types";

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
  const [listings, setListings] = useState<ListingDetailResponse[]>(mockListings);
  const [isLoading, setIsLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchListings() {
      try {
        const data = await api.listings.browse({ status: "active", limit: 20 });
        if (data.length > 0) {
          setListings(data);
        } else {
          setListings(mockListings);
          setUseMock(true);
        }
      } catch {
        setListings(mockListings);
        setUseMock(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchListings();
  }, []);

  const togglePin = useCallback((id: number) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  }, []);

  const sections = useMemo(() => {
    const nearCampus = listings.filter((l) => (l.walk_time_minutes ?? 99) <= 10);
    const midDistance = listings.filter((l) => {
      const wt = l.walk_time_minutes ?? 99;
      return wt > 10 && wt <= 20;
    });
    const farther = listings.filter((l) => (l.walk_time_minutes ?? 0) > 20);

    return [
      { key: "near", title: "Near Campus", emoji: "🎓", subtitle: "Walking distance to classes", items: nearCampus },
      { key: "mid", title: "Stone Road Area", emoji: "🛍️", subtitle: "Close to shopping and transit", items: midDistance },
      { key: "far", title: "South End & Beyond", emoji: "🏘️", subtitle: "More space, great value", items: farther },
    ].filter((s) => s.items.length > 0);
  }, [listings]);

  const avgRent = listings.length > 0
    ? Math.round(listings.reduce((acc, l) => acc + Number(l.rent_per_room), 0) / listings.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      {/* Hero + View toggle */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-5 md:pt-8 pb-1 md:pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1
              className="text-[#1B2D45]"
              style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.2 }}
            >
              Find your Guelph cribb 🏠
            </h1>
            <p className="mt-1 md:mt-1.5 text-[#1B2D45]/45" style={{ fontSize: isMobile ? "12px" : "14px", fontWeight: 400 }}>
              <span className="text-[#1B2D45]/70" style={{ fontWeight: 600 }}>{listings.length} listings</span>{" "}
              available near University of Guelph
              {useMock && <span className="ml-2 text-[#FF6B35]/60" style={{ fontSize: "11px" }}>(demo data)</span>}
            </p>
          </div>

          <div className="flex items-center bg-white rounded-lg border border-black/[0.06] p-0.5 shrink-0">
            {(["board", "grid", "map"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md transition-all ${viewMode === mode ? "bg-[#FF6B35] text-white" : "text-[#1B2D45]/40 hover:text-[#1B2D45]/60"}`}
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {mode === "board" ? "📌 Board" : mode === "grid" ? "▦ Grid" : "🗺 Map"}
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="flex items-center gap-2 md:gap-3 mt-4 md:mt-5 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {[
            { icon: "📈", label: "Avg rent", value: `$${avgRent}/rm`, bg: "rgba(46,196,182,0.08)" },
            { icon: "✨", label: "New this week", value: "12", bg: "rgba(255,107,53,0.08)" },
            { icon: "📅", label: "8-mo leases", value: String(listings.filter(l => l.lease_type === "8_month").length), bg: "rgba(255,182,39,0.08)" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-black/5 shrink-0" style={{ backgroundColor: s.bg }}>
              <span style={{ fontSize: isMobile ? "14px" : "16px" }}>{s.icon}</span>
              <div>
                <div className="text-[#1B2D45]/40" style={{ fontSize: isMobile ? "9px" : "10px", fontWeight: 500, lineHeight: 1.2 }}>{s.label}</div>
                <div className="text-[#1B2D45]" style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: 800, lineHeight: 1.2 }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <SearchAndFilters />

      {/* Content */}
      {isLoading ? (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-20 text-center">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF6B35]/20" />
            <div className="text-[#1B2D45]/30" style={{ fontSize: "14px" }}>Loading listings...</div>
          </div>
        </div>
      ) : viewMode === "board" ? (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6 cork-bg">
          {sections.map((section, si) => (
            <div key={section.key} className="mb-8 md:mb-14">
              <div className="mb-4 md:mb-6">
                <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800 }}>
                  {section.title} <span style={{ fontSize: isMobile ? "16px" : "20px" }}>{section.emoji}</span>
                </h2>
                <p className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "12px", fontWeight: 400 }}>{section.subtitle}</p>
              </div>

              <div
                className={isMobile ? "flex flex-col gap-5" : "grid gap-6"}
                style={isMobile ? undefined : {
                  gridTemplateColumns: section.items.length <= 2 ? `repeat(${section.items.length}, minmax(0, 1fr))` : "repeat(3, minmax(0, 1fr))",
                  maxWidth: section.items.length <= 2 ? "680px" : undefined,
                }}
              >
                {section.items.map((listing, i) => (
                  <div key={listing.id} style={isMobile ? undefined : { marginTop: `${(staggers[si % 3] ?? staggers[0])[i % 3] ?? 0}px` }}>
                    <PolaroidCard
                      listing={listing}
                      healthScore={mockHealthScores[listing.id] ?? null}
                      rotation={isMobile ? (rotations[si % 3] ?? rotations[0])[i % 3] * 0.7 : (rotations[si % 3] ?? rotations[0])[i % 3] ?? 0}
                      isPinned={pinnedIds.includes(listing.id)}
                      onTogglePin={togglePin}
                      isMobile={isMobile}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* CTA */}
          <div className="text-center py-8 md:py-10 px-4 md:px-6 rounded-2xl border-2 border-dashed border-[#FF6B35]/20 bg-[#FF6B35]/[0.03] mb-4">
            <h3 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Can&apos;t find the right fit?</h3>
            <p className="text-[#1B2D45]/45 mt-2 max-w-[400px] mx-auto" style={{ fontSize: "13px", lineHeight: 1.6 }}>
              Tell us what you&apos;re looking for and let landlords come to you.
            </p>
            <button className="mt-5 px-7 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all" style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}>
              Post a Request →
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {listings.map((listing) => (
              <PolaroidCard
                key={listing.id}
                listing={listing}
                healthScore={mockHealthScores[listing.id] ?? null}
                rotation={0}
                isPinned={pinnedIds.includes(listing.id)}
                onTogglePin={togglePin}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      ) : (
        <MapView listings={listings} pinnedIds={pinnedIds} onTogglePin={togglePin} />
      )}

      {/* Mobile pinned badge */}
      {isMobile && pinnedIds.length > 0 && (
        <div className="fixed bottom-6 right-4 z-30">
          <button className="flex items-center gap-1.5 bg-[#FF6B35] text-white px-4 py-2 rounded-full shadow-[0_2px_12px_rgba(255,107,53,0.4)] active:scale-95 transition-transform" style={{ fontSize: "13px", fontWeight: 700 }}>
            📌 {pinnedIds.length} pick{pinnedIds.length !== 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}
