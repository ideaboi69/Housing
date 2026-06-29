"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useInView,
} from "framer-motion";
import { Footprints, Grid2X2, Home, LayoutList, Map as MapIcon, Pin, TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks";
import { useRouter } from "next/navigation";
import { PolaroidCard } from "@/components/browse/PolaroidCard";
import { BuildingCard } from "@/components/browse/BuildingCard";
import { groupBrowseItems } from "@/lib/buildings";
import { MapView } from "@/components/browse/MapView";
import { SearchAndFilters } from "@/components/browse/SearchAndFilters";
import { FilterModal } from "@/components/browse/FilterModal";
import { MyPicksTray } from "@/components/browse/MyPicksTray";
import { CompareModal } from "@/components/browse/CompareModal";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { BrowseGridSkeleton } from "@/components/ui/Skeletons";
import { OnboardingBanner } from "@/components/ui/OnboardingBanner";
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

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBrowseListing(listing: ListingDetailResponse): ListingDetailResponse {
  return {
    ...listing,
    id: Number(listing.id),
    property_id: Number(listing.property_id),
    landlord_id: Number(listing.landlord_id),
    rent_per_room: Number(listing.rent_per_room),
    rent_total: Number(listing.rent_total),
    total_rooms: Number(listing.total_rooms),
    bathrooms: Number(listing.bathrooms),
    view_count: Number(listing.view_count ?? 0),
    save_count: listing.save_count == null ? undefined : Number(listing.save_count),
    latitude: toNullableNumber(listing.latitude),
    longitude: toNullableNumber(listing.longitude),
    estimated_utility_cost: toNullableNumber(listing.estimated_utility_cost),
    distance_to_campus_km: toNullableNumber(listing.distance_to_campus_km),
    walk_time_minutes: toNullableNumber(listing.walk_time_minutes),
    bus_time_minutes: toNullableNumber(listing.bus_time_minutes),
  };
}

function mergeBrowseListings(liveListings: ListingDetailResponse[]): ListingDetailResponse[] {
  const seen = new Set<number>();
  const seenComposite = new Set<string>();
  const merged: ListingDetailResponse[] = [];

  const addListing = (listing: ListingDetailResponse) => {
    if (seen.has(listing.id)) return;
    const key = [
      listing.id,
      listing.address?.trim().toLowerCase(),
      listing.title?.trim().toLowerCase(),
    ].join("::");
    if (seenComposite.has(key)) return;
    seen.add(listing.id);
    seenComposite.add(key);
    merged.push(listing);
  };

  liveListings.forEach(addListing);

  return merged;
}

export default function BrowsePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [listings, setListings] = useState<ListingDetailResponse[]>([]);
  const [healthScores, setHealthScores] = useState<Record<number, number>>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        setListings([]);
        setHealthScores({});
        return;
      }
      const normalizedData = data.map(normalizeBrowseListing);
      setListings(normalizedData);
      const scoreResults = await Promise.allSettled(
        normalizedData.map((l) => api.healthScores.get(l.id))
      );
      const scores: Record<number, number> = {};
      scoreResults.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value?.overall_score != null) {
          scores[normalizedData[i].id] = result.value.overall_score;
        }
      });
      setHealthScores(scores);
    } catch {
      setListings([]);
      setHealthScores({});
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
      filters.rooms_min !== undefined,
      filters.bathrooms_min !== undefined,
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

  // Apartments collapse into one building card per property; everything else
  // stays an individual listing card.
  const browseItems = useMemo(() => groupBrowseItems(filteredListings), [filteredListings]);

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
  const avgWalk = useMemo(() => {
    const walks = filteredListings
      .map((l) => Number(l.walk_time_minutes))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (walks.length === 0) return 0;
    return Math.round(walks.reduce((a, b) => a + b, 0) / walks.length);
  }, [filteredListings]);
  const browseModeOptions: { mode: ViewMode; label: string; icon: typeof LayoutList }[] = [
    { mode: "board", label: "Board", icon: LayoutList },
    { mode: "grid", label: "Grid", icon: Grid2X2 },
    { mode: "map", label: "Map", icon: MapIcon },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F4] pb-[calc(env(safe-area-inset-bottom,0px)+24px)] md:pb-0">
      <OnboardingBanner />
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
              Find your Guelph{" "}
              <span className="inline-block" style={{ color: "#FF6B35" }} aria-label="cribb">
                {"cribb".split("").map((char, i) => (
                  <motion.span
                    key={i}
                    aria-hidden
                    className="inline-block"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {char}
                  </motion.span>
                ))}
              </span>
            </h1>
            <p className="mt-1 md:mt-1.5 text-[#1B2D45]/45" style={{ fontSize: isMobile ? "12px" : "14px", fontWeight: 400 }}>
              <span className="text-[#1B2D45]/70" style={{ fontWeight: 600 }}>{browseItems.length} listings</span>{" "}
              available in Guelph
            </p>
          </div>

          {/* View toggle with indicator */}
          <div className="grid w-full grid-cols-3 items-center rounded-lg border border-black/[0.06] bg-white p-0.5 sm:flex sm:w-auto" data-tour="view-switcher">
            {browseModeOptions.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2 py-2 transition-all duration-200 sm:flex-none sm:px-3 sm:py-1.5 ${viewMode === mode ? "bg-[#FF6B35] text-white" : "text-[#1B2D45]/45 hover:text-[#1B2D45]/65"}`}
                style={{ fontSize: "12px", fontWeight: 600, minWidth: 0 }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stat cards — slim, horizontal, fills the row */}
        <motion.div
          className="mt-4 md:mt-5 grid grid-cols-3 gap-2 md:gap-2.5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {[
            { emoji: "💰", label: "Avg rent", ticker: <Ticker value={avgRent} prefix="$" suffix="/rm" /> },
            { emoji: "🏠", label: "Homes live", ticker: <Ticker value={filteredListings.length} /> },
            { emoji: "🚶", label: "Avg walk to campus", ticker: <Ticker value={avgWalk} suffix=" min" /> },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-lg border border-[#1B2D45]/[0.06] px-2.5 md:px-3 py-2 md:py-2.5 flex items-center gap-2 md:gap-2.5 min-w-0"
              style={{ boxShadow: "0 1px 2px rgba(27,45,69,0.03)" }}
            >
              <span className="shrink-0" style={{ fontSize: isMobile ? "16px" : "18px", lineHeight: 1 }} aria-hidden>
                {s.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[#1B2D45] truncate"
                  style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.15 }}
                >
                  {s.ticker}
                </div>
                <div
                  className="text-[#1B2D45]/45 truncate mt-0.5"
                  style={{ fontSize: isMobile ? "10px" : "11px", fontWeight: 500 }}
                >
                  {s.label}
                </div>
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
                  {browseItems.map((item, i) => {
                    const row = Math.floor(i / 3);
                    const col = i % 3;
                    const rotation = isMobile
                      ? (rotations[row % 3] ?? rotations[0])[col] * 0.55
                      : (rotations[row % 3] ?? rotations[0])[col] ?? 0;
                    const key = item.kind === "building" ? `b-${item.building.propertyId}` : `l-${item.listing.id}`;
                    return (
                      <div
                        key={key}
                        className="min-w-0"
                        style={isMobile ? undefined : { marginTop: `${(staggers[row % 3] ?? staggers[0])[col] ?? 0}px` }}
                      >
                        {item.kind === "building" ? (
                          <BuildingCard
                            building={item.building}
                            rotation={rotation}
                            isMobile={isMobile}
                            variant="board"
                          />
                        ) : (
                          <PolaroidCard
                            listing={item.listing}
                            healthScore={healthScores[item.listing.id] ?? null}
                            rotation={rotation}
                            isPinned={pinnedIds.includes(item.listing.id)}
                            onTogglePin={togglePin}
                            isMobile={isMobile}
                            variant="board"
                          />
                        )}
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
              {browseItems.map((item) =>
                item.kind === "building" ? (
                  <BuildingCard
                    key={`b-${item.building.propertyId}`}
                    building={item.building}
                    rotation={0}
                    isMobile={isMobile}
                    variant="grid"
                  />
                ) : (
                  <PolaroidCard
                    key={`l-${item.listing.id}`}
                    listing={item.listing}
                    healthScore={healthScores[item.listing.id] ?? null}
                    rotation={0}
                    isPinned={pinnedIds.includes(item.listing.id)}
                    onTogglePin={togglePin}
                    isMobile={isMobile}
                    variant="grid"
                  />
                )
              )}
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
            className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+14px)] left-1/2 z-30 -translate-x-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <button
              onClick={() => setShowPicksSheet(true)}
              className="flex min-h-11 items-center gap-2 rounded-full border border-white/70 bg-[#1B2D45] px-4 py-2 text-white shadow-[0_8px_24px_rgba(27,45,69,0.22)] active:scale-95 transition-transform"
              style={{ fontSize: "13px", fontWeight: 750 }}
            >
              <Pin className="h-3.5 w-3.5" />
              {pinnedIds.length} pick{pinnedIds.length !== 1 ? "s" : ""}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
