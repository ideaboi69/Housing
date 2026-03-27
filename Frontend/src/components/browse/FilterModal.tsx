"use client";

import { useState, useCallback, useEffect } from "react";
import {
  SlidersHorizontal, X, RotateCcw, Check,
  Home, Building2, Building, DoorOpen,
  Car, Shirt, Droplets, Zap,
  ArrowUpDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ListingFilters } from "@/types";
import {
  PROXIMITY_FILTER_OPTIONS,
  type ProximityFilterKey,
  getDistanceMaxForProximityFilter,
  getProximityFilterFromDistanceMax,
} from "@/lib/proximity";

/* ── Types ────────────────────────────────────── */

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ListingFilters) => void;
  currentFilters: ListingFilters;
  /** Total results count to show in Apply button */
  resultCount?: number;
}

/* ── Range Slider (dual handle) ───────────────── */

function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  formatLabel,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  formatLabel: (v: number) => string;
}) {
  const pctLow = ((value[0] - min) / (max - min)) * 100;
  const pctHigh = ((value[1] - min) / (max - min)) * 100;

  return (
    <div className="pt-2 pb-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#FF6B35]" style={{ fontSize: "14px", fontWeight: 700 }}>
          {formatLabel(value[0])}
        </span>
        <span className="text-[#1B2D45]/20" style={{ fontSize: "12px" }}>—</span>
        <span className="text-[#FF6B35]" style={{ fontSize: "14px", fontWeight: 700 }}>
          {formatLabel(value[1])}{value[1] >= max ? "+" : ""}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        {/* Track */}
        <div className="absolute left-0 right-0 h-1.5 rounded-full bg-[#1B2D45]/[0.06]" />
        {/* Active range */}
        <div
          className="absolute h-1.5 rounded-full bg-[#FF6B35]"
          style={{ left: `${pctLow}%`, right: `${100 - pctHigh}%` }}
        />
        {/* Low handle */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v <= value[1]) onChange([v, value[1]]);
          }}
          className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#FF6B35] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#FF6B35] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab"
          style={{ zIndex: 3 }}
        />
        {/* High handle */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= value[0]) onChange([value[0], v]);
          }}
          className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#FF6B35] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#FF6B35] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab"
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}

/* ── Single Slider ────────────────────────────── */

function SingleSlider({
  min,
  max,
  step,
  value,
  onChange,
  formatLabel,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  formatLabel: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="pt-2 pb-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#FF6B35]" style={{ fontSize: "14px", fontWeight: 700 }}>
          {formatLabel(value)}{value >= max ? "+" : ""}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute left-0 right-0 h-1.5 rounded-full bg-[#1B2D45]/[0.06]" />
        <div
          className="absolute h-1.5 rounded-full bg-[#2EC4B6]"
          style={{ left: 0, width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#2EC4B6] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#2EC4B6] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab"
          style={{ zIndex: 3 }}
        />
      </div>
    </div>
  );
}

/* ── Chip Button ──────────────────────────────── */

function Chip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all ${
        active
          ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]"
          : "border-[#1B2D45]/[0.06] text-[#1B2D45]/50 hover:border-[#1B2D45]/15 hover:bg-[#1B2D45]/[0.02]"
      }`}
      style={{ fontSize: "12px", fontWeight: active ? 600 : 500 }}
    >
      {icon}
      {label}
      {active && <Check className="w-3 h-3 ml-0.5" />}
    </button>
  );
}

/* ── Amenity Toggle ───────────────────────────── */

function AmenityToggle({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
        active
          ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] text-[#FF6B35]"
          : "border-[#1B2D45]/[0.06] text-[#1B2D45]/50 hover:bg-[#1B2D45]/[0.02]"
      }`}
      style={{ fontSize: "12px", fontWeight: active ? 600 : 500 }}
    >
      <Icon className={`w-3.5 h-3.5 ${active ? "text-[#FF6B35]" : "text-[#1B2D45]/30"}`} />
      {label}
    </button>
  );
}

/* ── Section Label ────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#1B2D45] mb-2.5" style={{ fontSize: "13px", fontWeight: 700 }}>
      {children}
    </p>
  );
}

/* ── Default state ────────────────────────────── */

const PRICE_MIN = 300;
const PRICE_MAX = 1500;
const DIST_MAX = 5;

const PROPERTY_TYPES = [
  { value: "house", label: "House", icon: <Home className="w-3.5 h-3.5" /> },
  { value: "apartment", label: "Apartment", icon: <Building2 className="w-3.5 h-3.5" /> },
  { value: "townhouse", label: "Townhouse", icon: <Building className="w-3.5 h-3.5" /> },
  { value: "room", label: "Room", icon: <DoorOpen className="w-3.5 h-3.5" /> },
];

const LEASE_TYPES = [
  { value: "8_month", label: "8-Month" },
  { value: "12_month", label: "12-Month" },
  { value: "flexible", label: "Flexible" },
];

const SORT_OPTIONS = [
  { value: "created_at", label: "Newest First", order: "desc" as const },
  { value: "rent_per_room", label: "Price: Low → High", order: "asc" as const },
  { value: "rent_per_room", label: "Price: High → Low", order: "desc" as const },
  { value: "distance_to_campus_km", label: "Closest to Campus", order: "asc" as const },
];

const AMENITY_FILTERS = [
  { key: "is_furnished", label: "Furnished", icon: Shirt },
  { key: "has_parking", label: "Parking", icon: Car },
  { key: "has_laundry", label: "Laundry", icon: Droplets },
  { key: "utilities_included", label: "Utilities Incl.", icon: Zap },
] as const;

/* ════════════════════════════════════════════════
   FILTER MODAL
   ════════════════════════════════════════════════ */

export function FilterModal({ isOpen, onClose, onApply, currentFilters, resultCount }: FilterModalProps) {
  // Local filter state (doesn't apply until user hits Apply)
  const [priceRange, setPriceRange] = useState<[number, number]>([
    currentFilters.price_min ?? PRICE_MIN,
    currentFilters.price_max ?? PRICE_MAX,
  ]);
  const [propertyType, setPropertyType] = useState<string | undefined>(currentFilters.property_type);
  const [leaseType, setLeaseType] = useState<string | undefined>(currentFilters.lease_type);
  const [amenities, setAmenities] = useState({
    is_furnished: currentFilters.is_furnished ?? false,
    has_parking: currentFilters.has_parking ?? false,
    has_laundry: currentFilters.has_laundry ?? false,
    utilities_included: currentFilters.utilities_included ?? false,
  });
  const [proximityFilter, setProximityFilter] = useState<ProximityFilterKey | null>(
    getProximityFilterFromDistanceMax(currentFilters.distance_max)
  );
  const [sortIndex, setSortIndex] = useState(() => {
    const idx = SORT_OPTIONS.findIndex(
      (o) => o.value === currentFilters.sort_by && o.order === currentFilters.sort_order
    );
    return idx >= 0 ? idx : 0;
  });

  // Sync local state when currentFilters change externally
  useEffect(() => {
    if (isOpen) {
      setPriceRange([currentFilters.price_min ?? PRICE_MIN, currentFilters.price_max ?? PRICE_MAX]);
      setPropertyType(currentFilters.property_type);
      setLeaseType(currentFilters.lease_type);
      setAmenities({
        is_furnished: currentFilters.is_furnished ?? false,
        has_parking: currentFilters.has_parking ?? false,
        has_laundry: currentFilters.has_laundry ?? false,
        utilities_included: currentFilters.utilities_included ?? false,
      });
      setProximityFilter(getProximityFilterFromDistanceMax(currentFilters.distance_max));
      const idx = SORT_OPTIONS.findIndex(
        (o) => o.value === currentFilters.sort_by && o.order === currentFilters.sort_order
      );
      setSortIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, currentFilters]);

  const toggleAmenity = useCallback((key: keyof typeof amenities) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const activeFilterCount = [
    priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX,
    !!propertyType,
    !!leaseType,
    amenities.is_furnished,
    amenities.has_parking,
    amenities.has_laundry,
    amenities.utilities_included,
    proximityFilter !== null,
    sortIndex !== 0,
  ].filter(Boolean).length;

  const handleReset = () => {
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    setPropertyType(undefined);
    setLeaseType(undefined);
    setAmenities({ is_furnished: false, has_parking: false, has_laundry: false, utilities_included: false });
    setProximityFilter(null);
    setSortIndex(0);
  };

  const handleApply = () => {
    const filters: ListingFilters = {
      status: "active",
      limit: 20,
    };

    // Only include non-default values
    if (priceRange[0] > PRICE_MIN) filters.price_min = priceRange[0];
    if (priceRange[1] < PRICE_MAX) filters.price_max = priceRange[1];
    if (propertyType) filters.property_type = propertyType;
    if (leaseType) filters.lease_type = leaseType;
    if (amenities.is_furnished) filters.is_furnished = true;
    if (amenities.has_parking) filters.has_parking = true;
    if (amenities.has_laundry) filters.has_laundry = true;
    if (amenities.utilities_included) filters.utilities_included = true;
    const distanceMax = getDistanceMaxForProximityFilter(proximityFilter);
    if (distanceMax !== undefined) filters.distance_max = distanceMax;

    const sort = SORT_OPTIONS[sortIndex];
    if (sort) {
      filters.sort_by = sort.value as ListingFilters["sort_by"];
      filters.sort_order = sort.order;
    }

    onApply(filters);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white w-full md:w-auto md:rounded-2xl rounded-t-2xl md:max-w-[480px] max-h-[85vh] overflow-hidden flex flex-col"
            style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4 text-[#FF6B35]" />
                </div>
                <div>
                  <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>Filters</h3>
                  {activeFilterCount > 0 && (
                    <p className="text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 600 }}>
                      {activeFilterCount} active
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#1B2D45]/40 hover:text-[#1B2D45]/60 hover:bg-[#1B2D45]/[0.04] transition-colors"
                    style={{ fontSize: "11px", fontWeight: 600 }}
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-[#1B2D45]/40" />
                </button>
              </div>
            </div>

            {/* ── Scrollable Content ── */}
            <div className="overflow-y-auto flex-1 px-5 pb-3 space-y-6">
              {/* Price Range */}
              <div>
                <SectionLabel>Price Range (per room/month)</SectionLabel>
                <RangeSlider
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={25}
                  value={priceRange}
                  onChange={setPriceRange}
                  formatLabel={(v) => `$${v}`}
                />
              </div>

              {/* Property Type */}
              <div>
                <SectionLabel>Property Type</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((pt) => (
                    <Chip
                      key={pt.value}
                      label={pt.label}
                      icon={pt.icon}
                      active={propertyType === pt.value}
                      onClick={() => setPropertyType(propertyType === pt.value ? undefined : pt.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Lease Type */}
              <div>
                <SectionLabel>Lease Type</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {LEASE_TYPES.map((lt) => (
                    <Chip
                      key={lt.value}
                      label={lt.label}
                      active={leaseType === lt.value}
                      onClick={() => setLeaseType(leaseType === lt.value ? undefined : lt.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <SectionLabel>Must-Have Amenities</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITY_FILTERS.map((a) => (
                    <AmenityToggle
                      key={a.key}
                      label={a.label}
                      icon={a.icon}
                      active={amenities[a.key]}
                      onClick={() => toggleAmenity(a.key)}
                    />
                  ))}
                </div>
              </div>

              {/* Proximity */}
              <div>
                <SectionLabel>Campus Proximity</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {PROXIMITY_FILTER_OPTIONS.map((option) => {
                    const isActive = option.key === "any_distance"
                      ? proximityFilter === null
                      : proximityFilter === option.key;
                    return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        if (option.key === "any_distance") {
                          setProximityFilter(null);
                          return;
                        }
                        setProximityFilter(proximityFilter === option.key ? null : option.key);
                      }}
                      className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                        isActive
                          ? "border-[#2EC4B6]/30 bg-[#2EC4B6]/[0.08] text-[#2EC4B6]"
                          : "border-[#1B2D45]/[0.06] text-[#1B2D45]/55 hover:border-[#2EC4B6]/20 hover:bg-[#2EC4B6]/[0.03]"
                      }`}
                    >
                      <div style={{ fontSize: "12px", fontWeight: 700 }}>{option.label}</div>
                      <div className="mt-0.5 text-current/70" style={{ fontSize: "10px", fontWeight: 500 }}>
                        {option.description}
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort */}
              <div>
                <SectionLabel>Sort By</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((opt, i) => (
                    <Chip
                      key={`${opt.value}-${opt.order}`}
                      label={opt.label}
                      icon={i === sortIndex ? undefined : <ArrowUpDown className="w-3 h-3" />}
                      active={sortIndex === i}
                      onClick={() => setSortIndex(i)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex gap-2 px-5 py-4 border-t border-[#1B2D45]/[0.04] shrink-0 bg-white">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[#E8E4DC] text-[#5C6B7A] hover:bg-[#1B2D45]/[0.02] transition-colors"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-all"
                style={{ fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 20px rgba(255,107,53,0.3)" }}
              >
                Apply Filters
                {resultCount !== undefined && (
                  <span className="ml-1 opacity-70">({resultCount})</span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
