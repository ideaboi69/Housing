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
import { useRouter } from "next/navigation";
import { PolaroidCard } from "@/components/browse/PolaroidCard";
import { MapView } from "@/components/browse/MapView";
import { SearchAndFilters } from "@/components/browse/SearchAndFilters";
import { FilterModal } from "@/components/browse/FilterModal";
import { MyPicksTray } from "@/components/browse/MyPicksTray";
import { CompareModal } from "@/components/browse/CompareModal";
import { MobileBottomTabs } from "@/components/browse/MobileBottomTabs";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { mockListings, mockHealthScores } from "@/lib/mock-data";
import { BrowseGridSkeleton } from "@/components/ui/Skeletons";
import type { ListingDetailResponse, ListingFilters } from "@/types";

type ViewMode = "board" | "grid" | "map";

const rotations = [
  [-1.2, 0.8, -0.4],
  [0.7, -1.0, 0.3],
  [0.9, -0.6, 0.35],
];

const staggers = [
  [0, 10, 4],
  [6, 0, 8],
  [3, 8, 0],
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

export default function BrowsePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [listings, setListings] = useState<ListingDetailResponse[]>(mockListings);
  const [healthScores, setHealthScores] = useState<Record<number, number>>(mockHealthScores);
  const [isLoading, setIsLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ListingFilters>({ status: "active", limit: 20 });
  const [searchQuery, setSearchQuery] = useState("");
  const [compareOpen, setCompareOpen] = useState(false);
  const isMobile = useIsMobile();

  const fetchListings = useCallback(async (filterParams: ListingFilters) => {
    setIsLoading(true);
    try {
      const data = await api.listings.browse(filterParams);
      if (!data || data.length === 0) {
        setListings(mockListings);
        setHealthScores(mockHealthScores);
        setUseMock(true);
        return;
      }

      setListings(data ?? []);
      setUseMock(false);
      const scoreResults = await Promise.allSettled(
        data.map((l) => api.healthScores.get(l.id))
      );
      const scores: Record<number, number> = {};
      scoreResults.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value?.overall_score != null) {
          scores[data[i].id] = result.value.overall_score;
        }
      });
      setHealthScores(Object.keys(scores).length > 0 ? scores : mockHealthScores);
    } catch {
      setListings(mockListings);
      setHealthScores(mockHealthScores);
      setUseMock(true);
      setIsLoading(false);
      return;
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
    if (!user) {
      router.push("/login");
      return;
    }
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  }, [user, router]);

  const removePin = useCallback((id: number) => {
    setPinnedIds((prev) => prev.filter((pid) => pid !== id));
  }, []);

  const [showPicksSheet, setShowPicksSheet] = useState(false);
  const pinnedListings = useMemo(
    () => listings.filter((l) => pinnedIds.includes(l.id)),
    [listings, pinnedIds]
  );

  const avgRent = filteredListings.length > 0
    ? Math.round(filteredListings.reduce((acc, l) => acc + Number(l.rent_per_room), 0) / filteredListings.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      {/* Hero + View toggle */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-5 md:pt-8 pb-1 md:pb-2">
        <motion.div
          className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
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
              available in Guelph
              {useMock && <span className="ml-2 text-[#FF6B35]/60" style={{ fontSize: "11px" }}>(demo data)</span>}
            </p>
          </div>

          {/* View toggle with indicator */}
          <div className="flex items-center bg-white rounded-lg border border-black/[0.06] p-0.5 shrink-0 w-full sm:w-auto" data-tour="view-switcher">
            {(["board", "grid", "map"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all duration-200 ${viewMode === mode ? "bg-[#FF6B35] text-white" : "text-[#1B2D45]/40 hover:text-[#1B2D45]/60"}`}
                style={{ fontSize: "12px", fontWeight: 600, minWidth: 0 }}
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
        healthScores={healthScores}
        onRemove={removePin}
        onCompare={() => setCompareOpen(true)}
        showBottomSheet={showPicksSheet}
        onCloseBottomSheet={() => setShowPicksSheet(false)}
      />

      {/* Content — AnimatePresence for view transitions */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            className="max-w-[1200px] mx-auto px-4 md:px-6 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <BrowseGridSkeleton count={6} />
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
            <motion.div
              className="board-surface overflow-hidden px-4 pb-6 pt-5 md:px-5 md:pb-8 md:pt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className={isMobile ? "relative z-[1] flex flex-col gap-5" : "relative z-[1] grid grid-cols-3 gap-5"}>
                {filteredListings.map((listing, i) => {
                  const row = Math.floor(i / 3);
                  const col = i % 3;
                  return (
                    <div
                      key={listing.id}
                      className="min-w-0"
                      style={isMobile ? undefined : { marginTop: `${(staggers[row % 3] ?? staggers[0])[col] ?? 0}px` }}
                    >
                      <PolaroidCard
                        listing={listing}
                        healthScore={healthScores[listing.id] ?? null}
                        rotation={isMobile ? (rotations[row % 3] ?? rotations[0])[col] * 0.55 : (rotations[row % 3] ?? rotations[0])[col] ?? 0}
                        isPinned={pinnedIds.includes(listing.id)}
                        onTogglePin={togglePin}
                        isMobile={isMobile}
                        variant="board"
                      />
                    </div>
                  );
                })}
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
              {filteredListings.map((listing) => (
                <PolaroidCard
                  key={listing.id}
                  listing={listing}
                  healthScore={healthScores[listing.id] ?? null}
                  rotation={0}
                  isPinned={pinnedIds.includes(listing.id)}
                  onTogglePin={togglePin}
                  isMobile={isMobile}
                  variant="grid"
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
            <MapView listings={filteredListings} healthScores={healthScores} pinnedIds={pinnedIds} onTogglePin={togglePin} />
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

      {/* Compare Modal */}
      <CompareModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        listings={pinnedListings}
        healthScores={healthScores}
      />
    </div>
  );
}
