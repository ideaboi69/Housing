"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useInView,
} from "framer-motion";
import { useIsMobile } from "@/hooks";
import { PolaroidCard } from "@/components/browse/PolaroidCard";
import { MapView } from "@/components/browse/MapView";
import { SearchAndFilters } from "@/components/browse/SearchAndFilters";
import { FilterModal } from "@/components/browse/FilterModal";
import { MyPicksTray } from "@/components/browse/MyPicksTray";
import { MobileBottomTabs } from "@/components/browse/MobileBottomTabs";
import { api } from "@/lib/api";
import { mockListings, mockHealthScores } from "@/lib/mock-data";
import type { ListingDetailResponse, ListingFilters } from "@/types";

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

/* ── Animated number ticker ─────────────────────── */
function Ticker({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 20 });
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsub = spring.on("change", (v) => setDisplay(Math.round(v)));
    return unsub;
  }, [spring]);

  useEffect(() => {
    if (isInView) mv.set(value);
  }, [isInView, value, mv]);

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  );
}

/* ── View transition variants ───────────────────── */
const viewVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const sectionHeaderVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

export default function BrowsePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [listings, setListings] = useState<ListingDetailResponse[]>(mockListings);
  const [healthScores, setHealthScores] = useState<Record<number, number>>(mockHealthScores);
  const [isLoading, setIsLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ListingFilters>({ status: "active", limit: 20 });
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const fetchListings = useCallback(async (filterParams: ListingFilters) => {
    setIsLoading(true);
    try {
      const data = await api.listings.browse(filterParams);
      if (data && data.length > 0) {
        setListings(data);
        setUseMock(false);
        // Fetch health scores
        const scores: Record<number, number> = {};
        await Promise.allSettled(
          data.map(async (l) => {
            try {
              const hs = await api.healthScores.get(l.id);
              if (hs?.overall_score) scores[l.id] = hs.overall_score;
            } catch { /* not computed */ }
          })
        );
        setHealthScores(scores);
      } else {
        setListings(mockListings);
        setHealthScores(mockHealthScores);
        setUseMock(true);
      }
    } catch (err) {
      console.error("[cribb] Browse fetch failed, using demo data:", err);
      setListings(mockListings);
      setHealthScores(mockHealthScores);
      setUseMock(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings(filters);
  }, [filters, fetchListings]);

  // Count active filters (non-default)
  const activeFilterCount = useMemo(() => {
    return [
      filters.price_min !== undefined,
      filters.price_max !== undefined,
      !!filters.property_type,
      !!filters.lease_type,
      filters.is_furnished === true,
      filters.has_parking === true,
      filters.has_laundry === true,
      filters.utilities_included === true,
      filters.distance_max !== undefined,
      filters.sort_by && filters.sort_by !== "created_at",
    ].filter(Boolean).length;
  }, [filters]);

  const handleApplyFilters = useCallback((newFilters: ListingFilters) => {
    setFilters(newFilters);
  }, []);

  const handleQuickFilter = useCallback((quickFilters: Partial<ListingFilters>) => {
    // Quick filters reset to base + the quick filter
    setFilters({ status: "active", limit: 20, ...quickFilters });
  }, []);

  // Client-side search filtering (address/title)
  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const q = searchQuery.toLowerCase();
    return listings.filter(
      (l) =>
        l.title?.toLowerCase().includes(q) ||
        l.address?.toLowerCase().includes(q)
    );
  }, [listings, searchQuery]);

  const togglePin = useCallback((id: number) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  }, []);

  const removePin = useCallback((id: number) => {
    setPinnedIds((prev) => prev.filter((pid) => pid !== id));
  }, []);

  const [showPicksSheet, setShowPicksSheet] = useState(false);
  const pinnedListings = useMemo(
    () => listings.filter((l) => pinnedIds.includes(l.id)),
    [listings, pinnedIds]
  );

  const sections = useMemo(() => {
    const nearCampus = filteredListings.filter((l) => (l.walk_time_minutes ?? 99) <= 10);
    const midDistance = filteredListings.filter((l) => {
      const wt = l.walk_time_minutes ?? 99;
      return wt > 10 && wt <= 20;
    });
    const farther = filteredListings.filter((l) => (l.walk_time_minutes ?? 0) > 20);

    return [
      { key: "near", title: "Near Campus", emoji: "🎓", subtitle: "Walking distance to classes", items: nearCampus },
      { key: "mid", title: "Stone Road Area", emoji: "🛍️", subtitle: "Close to shopping and transit", items: midDistance },
      { key: "far", title: "South End & Beyond", emoji: "🏘️", subtitle: "More space, great value", items: farther },
    ].filter((s) => s.items.length > 0);
  }, [filteredListings]);

  const avgRent = filteredListings.length > 0
    ? Math.round(filteredListings.reduce((acc, l) => acc + Number(l.rent_per_room), 0) / filteredListings.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      {/* Hero + View toggle */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-5 md:pt-8 pb-1 md:pb-2">
        <motion.div
          className="flex items-start justify-between gap-3"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="min-w-0">
            <h1
              className="text-[#1B2D45]"
              style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.2 }}
            >
              Find your Guelph cribb 🏠
            </h1>
            <p className="mt-1 md:mt-1.5 text-[#1B2D45]/45" style={{ fontSize: isMobile ? "12px" : "14px", fontWeight: 400 }}>
              <span className="text-[#1B2D45]/70" style={{ fontWeight: 600 }}>{filteredListings.length} listings</span>{" "}
              available near University of Guelph
              {useMock && <span className="ml-2 text-[#FF6B35]/60" style={{ fontSize: "11px" }}>(demo data)</span>}
            </p>
          </div>

          {/* View toggle with indicator */}
          <div className="flex items-center bg-white rounded-lg border border-black/[0.06] p-0.5 shrink-0">
            {(["board", "grid", "map"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md transition-all duration-200 ${viewMode === mode ? "bg-[#FF6B35] text-white" : "text-[#1B2D45]/40 hover:text-[#1B2D45]/60"}`}
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {mode === "board" ? "📌 Board" : mode === "grid" ? "▦ Grid" : "🗺 Map"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stat cards with number tickers */}
        <motion.div
          className="flex items-center gap-2 md:gap-3 mt-4 md:mt-5 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {[
            { icon: "📈", label: "Avg rent", ticker: <Ticker value={avgRent} prefix="$" suffix="/rm" />, bg: "rgba(46,196,182,0.08)" },
            { icon: "✨", label: "New this week", ticker: <Ticker value={12} />, bg: "rgba(255,107,53,0.08)" },
            { icon: "📅", label: "8-mo leases", ticker: <Ticker value={filteredListings.filter(l => l.lease_type === "8_month").length} />, bg: "rgba(255,182,39,0.08)" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-black/5 shrink-0" style={{ backgroundColor: s.bg }}>
              <span style={{ fontSize: isMobile ? "14px" : "16px" }}>{s.icon}</span>
              <div>
                <div className="text-[#1B2D45]/40" style={{ fontSize: isMobile ? "9px" : "10px", fontWeight: 500, lineHeight: 1.2 }}>{s.label}</div>
                <div className="text-[#1B2D45]" style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: 800, lineHeight: 1.2 }}>{s.ticker}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Search & Filters (now sticky/glass in component) */}
      <SearchAndFilters
        onSearchChange={setSearchQuery}
        onQuickFilter={handleQuickFilter}
        onOpenFilters={() => setFilterOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
        resultCount={filteredListings.length}
      />

      {/* My Picks Tray */}
      <MyPicksTray
        picks={pinnedListings}
        onRemove={removePin}
        showBottomSheet={showPicksSheet}
        onCloseBottomSheet={() => setShowPicksSheet(false)}
      />

      {/* Content — AnimatePresence for view transitions */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            className="max-w-[1200px] mx-auto px-4 md:px-6 py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF6B35]/20" />
              <div className="text-[#1B2D45]/30" style={{ fontSize: "14px" }}>Loading listings...</div>
            </div>
          </motion.div>
        ) : viewMode === "board" ? (
          <motion.div
            key="board"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
            className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6 cork-bg"
          >
            {sections.map((section, si) => (
              <motion.div
                key={section.key}
                className="mb-8 md:mb-14"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="mb-4 md:mb-6" variants={sectionHeaderVariants}>
                  <h2 className="text-[#1B2D45] flex items-center gap-2" style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800 }}>
                    {section.title} <span style={{ fontSize: isMobile ? "16px" : "20px" }}>{section.emoji}</span>
                  </h2>
                  <p className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "12px", fontWeight: 400 }}>{section.subtitle}</p>
                </motion.div>

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
                        healthScore={healthScores[listing.id] ?? null}
                        rotation={isMobile ? (rotations[si % 3] ?? rotations[0])[i % 3] * 0.7 : (rotations[si % 3] ?? rotations[0])[i % 3] ?? 0}
                        isPinned={pinnedIds.includes(listing.id)}
                        onTogglePin={togglePin}
                        isMobile={isMobile}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* CTA */}
            <motion.div
              className="text-center py-8 md:py-10 px-4 md:px-6 rounded-2xl border-2 border-dashed border-[#FF6B35]/20 bg-[#FF6B35]/[0.03] mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Can&apos;t find the right fit?</h3>
              <p className="text-[#1B2D45]/45 mt-2 max-w-[400px] mx-auto" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                Tell us what you&apos;re looking for and let landlords come to you.
              </p>
              <motion.button
                className="mt-5 px-7 py-3 rounded-xl bg-[#FF6B35] text-white transition-colors"
                style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
                whileHover={{ scale: 1.03, boxShadow: "0 8px 30px rgba(255,107,53,0.4)" }}
                whileTap={{ scale: 0.97 }}
              >
                Post a Request →
              </motion.button>
            </motion.div>
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div
            key="grid"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
            className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {filteredListings.map((listing) => (
                <PolaroidCard
                  key={listing.id}
                  listing={listing}
                  healthScore={healthScores[listing.id] ?? null}
                  rotation={0}
                  isPinned={pinnedIds.includes(listing.id)}
                  onTogglePin={togglePin}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="map"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
          >
            <MapView listings={filteredListings} pinnedIds={pinnedIds} onTogglePin={togglePin} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile floating picks badge — opens bottom sheet */}
      <AnimatePresence>
        {isMobile && pinnedIds.length > 0 && !showPicksSheet && (
          <motion.div
            className="fixed bottom-[72px] right-4 z-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <button
              onClick={() => setShowPicksSheet(true)}
              className="flex items-center gap-1.5 bg-[#FF6B35] text-white px-4 py-2 rounded-full shadow-[0_2px_12px_rgba(255,107,53,0.4)] active:scale-95 transition-transform"
              style={{ fontSize: "13px", fontWeight: 700 }}
            >
              📌 {pinnedIds.length} pick{pinnedIds.length !== 1 ? "s" : ""}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom tabs */}
      {isMobile && (
        <MobileBottomTabs
          onMapTab={() => setViewMode("map")}
          onSavedTab={() => setShowPicksSheet(true)}
          picksCount={pinnedListings.length}
        />
      )}

      {/* Bottom padding on mobile for the fixed tab bar */}
      {isMobile && <div className="h-[56px]" />}
    </div>
  );
}