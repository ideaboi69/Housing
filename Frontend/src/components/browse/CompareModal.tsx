"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X, Sparkles, ExternalLink, Check, Minus,
  MapPin, DollarSign, Ruler, Clock, Car, Shirt, Droplets, Zap,
  Dog, Snowflake, Wifi, Star, TrendingUp, ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { formatPrice, getScoreColor } from "@/lib/utils";
import { getListingImages } from "@/lib/mock-data";
import type { ListingDetailResponse } from "@/types";

/* ── Types ────────────────────────────────── */

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: ListingDetailResponse[];
  healthScores: Record<number, number>;
}

/* ── Row helpers ──────────────────────────── */

type CellValue = string | number | boolean | null | undefined;

interface CompareRow {
  label: string;
  icon?: React.ReactNode;
  values: CellValue[];
  type: "text" | "price" | "boolean" | "score" | "distance" | "time";
  bestFn?: "lowest" | "highest";
}

function getBestIndex(values: CellValue[], fn: "lowest" | "highest"): number[] {
  const nums = values.map((v) => (typeof v === "number" ? v : null));
  const validNums = nums.filter((n): n is number => n !== null);
  if (validNums.length === 0) return [];
  const target = fn === "lowest" ? Math.min(...validNums) : Math.max(...validNums);
  return nums.reduce<number[]>((acc, n, i) => (n === target ? [...acc, i] : acc), []);
}

/* ── Cell Renderer ────────────────────────── */

function CompareCell({ value, type, isBest }: { value: CellValue; type: CompareRow["type"]; isBest: boolean }) {
  const bestClass = isBest ? "text-[#4ADE80] font-bold" : "text-[#1B2D45]";

  if (value === null || value === undefined) {
    return <span className="text-[#1B2D45]/20" style={{ fontSize: "13px" }}>—</span>;
  }

  if (type === "boolean") {
    return value ? (
      <Check className={`w-4 h-4 ${isBest ? "text-[#4ADE80]" : "text-[#2EC4B6]"}`} />
    ) : (
      <Minus className="w-4 h-4 text-[#1B2D45]/15" />
    );
  }

  if (type === "price") {
    return <span className={bestClass} style={{ fontSize: "14px", fontWeight: 700 }}>{formatPrice(value as number)}</span>;
  }

  if (type === "score") {
    const score = value as number;
    return (
      <span style={{ fontSize: "14px", fontWeight: 700, color: getScoreColor(score) }}>
        {score}
      </span>
    );
  }

  if (type === "distance") {
    return <span className={bestClass} style={{ fontSize: "13px", fontWeight: 600 }}>{value} km</span>;
  }

  if (type === "time") {
    return <span className={bestClass} style={{ fontSize: "13px", fontWeight: 600 }}>{value} min</span>;
  }

  return <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>{String(value)}</span>;
}

/* ── AI Summary (mock for now) ────────────── */

function generateMockSummary(listings: ListingDetailResponse[], scores: Record<number, number>): string {
  if (listings.length < 2) return "";

  const withScores = listings.map((l) => ({
    ...l,
    score: scores[l.id] ?? 0,
    rent: Number(l.rent_per_room),
    dist: Number(l.distance_to_campus_km ?? 99),
  }));

  const cheapest = [...withScores].sort((a, b) => a.rent - b.rent)[0];
  const closest = [...withScores].sort((a, b) => a.dist - b.dist)[0];
  const bestScore = [...withScores].sort((a, b) => b.score - a.score)[0];

  const parts: string[] = [];

  if (cheapest.id === closest.id && cheapest.id === bestScore.id) {
    parts.push(`${cheapest.title} stands out across the board — it's the most affordable at ${formatPrice(cheapest.rent)}/room, closest to campus at ${cheapest.dist} km, and has the highest Cribb Score of ${cheapest.score}.`);
    parts.push(`It's the clear winner in this comparison.`);
  } else {
    if (bestScore.score > 0) {
      parts.push(`${bestScore.title} has the strongest Cribb Score (${bestScore.score}), suggesting better overall quality and landlord reputation.`);
    }
    parts.push(`${cheapest.title} is the most budget-friendly at ${formatPrice(cheapest.rent)}/room.`);
    if (closest.id !== cheapest.id) {
      parts.push(`If proximity to campus matters most, ${closest.title} is your best bet at just ${closest.dist} km away.`);
    }

    // Amenity callouts
    const furnished = withScores.filter((l) => l.is_furnished);
    const parking = withScores.filter((l) => l.has_parking);
    if (furnished.length > 0 && furnished.length < withScores.length) {
      parts.push(`Only ${furnished.map((l) => l.title).join(" and ")} come${furnished.length === 1 ? "s" : ""} furnished — factor in furniture costs for the others.`);
    }
    if (parking.length > 0 && parking.length < withScores.length) {
      parts.push(`Parking is available at ${parking.map((l) => l.title).join(" and ")} but not the others.`);
    }
  }

  return parts.join(" ");
}

/* ════════════════════════════════════════════
   COMPARE MODAL
   ════════════════════════════════════════════ */

export function CompareModal({ isOpen, onClose, listings, healthScores }: CompareModalProps) {
  const [showAI, setShowAI] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Generate AI summary on open
  useEffect(() => {
    if (isOpen && listings.length >= 2) {
      setAiLoading(true);
      setShowAI(true);
      // Simulate API delay for now — replace with real Claude call later
      const summary = generateMockSummary(listings, healthScores);
      const timer = setTimeout(() => {
        setAiText(summary);
        setAiLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setShowAI(false);
      setAiText("");
    }
  }, [isOpen, listings, healthScores]);

  const rows: CompareRow[] = useMemo(() => {
    const vals = (fn: (l: ListingDetailResponse) => CellValue) => listings.map(fn);
    return [
      { label: "Price / Room", icon: <DollarSign className="w-3.5 h-3.5" />, values: vals((l) => Number(l.rent_per_room)), type: "price", bestFn: "lowest" },
      { label: "Total Rent", icon: <DollarSign className="w-3.5 h-3.5" />, values: vals((l) => Number(l.rent_total)), type: "price", bestFn: "lowest" },
      { label: "Cribb Score", icon: <TrendingUp className="w-3.5 h-3.5" />, values: vals((l) => healthScores[l.id] ?? null), type: "score", bestFn: "highest" },
      { label: "Distance", icon: <MapPin className="w-3.5 h-3.5" />, values: vals((l) => l.distance_to_campus_km), type: "distance", bestFn: "lowest" },
      { label: "Walk Time", icon: <Clock className="w-3.5 h-3.5" />, values: vals((l) => l.walk_time_minutes), type: "time", bestFn: "lowest" },
      { label: "Type", values: vals((l) => l.property_type), type: "text" },
      { label: "Rooms", values: vals((l) => `${l.total_rooms} bed · ${l.bathrooms} bath`), type: "text" },
      { label: "Lease", values: vals((l) => l.lease_type === "8_month" ? "8-month" : l.lease_type === "12_month" ? "12-month" : "Flexible"), type: "text" },
      { label: "Move-in", values: vals((l) => new Date(l.move_in_date).toLocaleDateString("en-CA", { month: "short", year: "numeric" })), type: "text" },
      { label: "Furnished", icon: <Shirt className="w-3.5 h-3.5" />, values: vals((l) => l.is_furnished), type: "boolean" },
      { label: "Parking", icon: <Car className="w-3.5 h-3.5" />, values: vals((l) => l.has_parking), type: "boolean" },
      { label: "Laundry", icon: <Droplets className="w-3.5 h-3.5" />, values: vals((l) => l.has_laundry), type: "boolean" },
      { label: "Utilities Incl.", icon: <Zap className="w-3.5 h-3.5" />, values: vals((l) => l.utilities_included), type: "boolean" },
      { label: "Pet Friendly", icon: <Dog className="w-3.5 h-3.5" />, values: vals((l) => l.pet_friendly), type: "boolean" },
      { label: "A/C", icon: <Snowflake className="w-3.5 h-3.5" />, values: vals((l) => l.has_air_conditioning), type: "boolean" },
      { label: "WiFi", icon: <Wifi className="w-3.5 h-3.5" />, values: vals((l) => l.has_wifi), type: "boolean" },
      { label: "Landlord", icon: <ShieldCheck className="w-3.5 h-3.5" />, values: vals((l) => l.landlord_name), type: "text" },
      { label: "Verified", values: vals((l) => l.landlord_verified), type: "boolean" },
      { label: "Utility Cost", values: vals((l) => l.estimated_utility_cost ? `$${l.estimated_utility_cost}/mo` : null), type: "text" },
      { label: "Views", values: vals((l) => l.view_count), type: "text" },
    ];
  }, [listings, healthScores]);

  if (!isOpen || listings.length === 0) return null;

  const colWidth = listings.length <= 2 ? "min-w-[220px]" : listings.length === 3 ? "min-w-[180px]" : "min-w-[160px]";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white border-b border-black/[0.06] px-5 py-4 flex items-center justify-between shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center">
                <span style={{ fontSize: "16px" }}>📊</span>
              </div>
              <div>
                <h2 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>
                  Compare Listings
                </h2>
                <p className="text-[#1B2D45]/40" style={{ fontSize: "11px" }}>
                  {listings.length} listings · Best values highlighted in green
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-[#1B2D45]/50" />
            </button>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="flex-1 overflow-auto bg-[#FAF8F4]"
          >
            <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-5">
              {/* AI Summary */}
              <AnimatePresence>
                {showAI && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 bg-gradient-to-br from-[#FF6B35]/[0.04] to-[#FFB627]/[0.04] rounded-xl border border-[#FF6B35]/10 p-5"
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <Sparkles className="w-4 h-4 text-[#FF6B35]" />
                      <span className="text-[#FF6B35]" style={{ fontSize: "12px", fontWeight: 700 }}>AI Analysis</span>
                    </div>
                    {aiLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]/40"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                        <span className="text-[#1B2D45]/40" style={{ fontSize: "12px" }}>Analyzing your picks...</span>
                      </div>
                    ) : (
                      <p className="text-[#1B2D45]/70" style={{ fontSize: "13px", lineHeight: 1.7 }}>
                        {aiText}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Comparison Table */}
              <div className="bg-white rounded-xl border border-black/[0.04] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ minWidth: `${140 + listings.length * 180}px` }}>
                    {/* Listing Headers */}
                    <thead>
                      <tr className="border-b border-black/[0.04]">
                        <th className="w-[140px] min-w-[140px] p-4 text-left sticky left-0 bg-white z-10" />
                        {listings.map((l) => (
                          <th key={l.id} className={`${colWidth} p-4 text-center`}>
                            <Link href={`/browse/${l.id}`} className="group block">
                              {/* Thumbnail */}
                              <div className="w-full h-[100px] rounded-lg bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] mb-2.5 overflow-hidden relative">
                                {getListingImages(l.id)[0] ? (
                                  <img src={getListingImages(l.id)[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span style={{ fontSize: "24px" }}>🏠</span>
                                  </div>
                                )}
                                {/* Health score badge */}
                                {healthScores[l.id] && (
                                  <div
                                    className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full flex items-center justify-center text-white"
                                    style={{ fontSize: "10px", fontWeight: 800, backgroundColor: getScoreColor(healthScores[l.id]) }}
                                  >
                                    {healthScores[l.id]}
                                  </div>
                                )}
                              </div>
                              <p className="text-[#1B2D45] truncate group-hover:text-[#FF6B35] transition-colors" style={{ fontSize: "13px", fontWeight: 700 }}>
                                {l.title}
                              </p>
                              <p className="text-[#1B2D45]/30 truncate mt-0.5" style={{ fontSize: "10px" }}>
                                {l.address}
                              </p>
                              <div className="flex items-center justify-center gap-1 mt-1.5 text-[#FF6B35] opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: "10px", fontWeight: 600 }}>
                                View listing <ExternalLink className="w-2.5 h-2.5" />
                              </div>
                            </Link>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    {/* Data Rows */}
                    <tbody>
                      {rows.map((row, ri) => {
                        const bestIndices = row.bestFn ? getBestIndex(row.values, row.bestFn) : [];

                        return (
                          <tr
                            key={row.label}
                            className={`border-b border-black/[0.02] ${ri % 2 === 0 ? "bg-white" : "bg-[#FAF8F4]/50"}`}
                          >
                            {/* Label */}
                            <td className="px-4 py-3 sticky left-0 z-10" style={{ backgroundColor: ri % 2 === 0 ? "white" : "#FDFCFA" }}>
                              <div className="flex items-center gap-2">
                                {row.icon && <span className="text-[#1B2D45]/25">{row.icon}</span>}
                                <span className="text-[#1B2D45]/60" style={{ fontSize: "12px", fontWeight: 600 }}>
                                  {row.label}
                                </span>
                              </div>
                            </td>
                            {/* Values */}
                            {row.values.map((val, ci) => (
                              <td key={ci} className="px-4 py-3 text-center">
                                <CompareCell
                                  value={val}
                                  type={row.type}
                                  isBest={bestIndices.includes(ci)}
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom note */}
              <p className="text-center text-[#1B2D45]/25 mt-4" style={{ fontSize: "11px" }}>
                Tap any listing header to view full details · Green highlights indicate best value in each row
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
