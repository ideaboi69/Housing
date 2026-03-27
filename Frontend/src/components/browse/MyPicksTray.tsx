"use client";

import { X, ArrowRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks";
import { getScoreColor, formatPrice } from "@/lib/utils";
import { getListingImages } from "@/lib/mock-data";
import type { ListingDetailResponse } from "@/types";
import Link from "next/link";

interface MyPicksTrayProps {
  picks: ListingDetailResponse[];
  healthScores: Record<number, number>;
  onRemove: (id: number) => void;
  onCompare: () => void;
  showBottomSheet?: boolean;
  onCloseBottomSheet?: () => void;
}

function PickCard({
  listing,
  healthScore,
  onRemove,
}: {
  listing: ListingDetailResponse;
  healthScore: number | null;
  onRemove: () => void;
}) {
  const thumbnail = getListingImages(listing.id)[0];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      className="flex items-center gap-3 bg-[#FAF8F4] rounded-xl px-3 py-2 shrink-0 border border-black/[0.04]"
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] flex items-center justify-center shrink-0">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <span style={{ fontSize: "14px" }}>🏠</span>
        )}
      </div>
      <div className="min-w-0">
        <Link
          href={`/browse/${listing.id}`}
          className="text-[#1B2D45] truncate block max-w-[140px] hover:underline"
          style={{ fontSize: "12px", fontWeight: 600 }}
        >
          {listing.title}
        </Link>
        <div className="flex items-center gap-2">
          <span
            className="text-[#FF6B35]"
            style={{ fontSize: "12px", fontWeight: 800 }}
          >
            {formatPrice(Number(listing.rent_per_room))}
          </span>
          {(healthScore ?? 0) > 0 && (
            <>
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: getScoreColor(healthScore ?? 0) }}
              />
              <span
                className="text-[#1B2D45]/40"
                style={{ fontSize: "10px", fontWeight: 600 }}
              >
                {healthScore}
              </span>
            </>
          )}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="w-5 h-5 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors ml-1 shrink-0"
      >
        <X className="w-3 h-3 text-[#1B2D45]/40" />
      </button>
    </motion.div>
  );
}

export function MyPicksTray({
  picks,
  healthScores,
  onRemove,
  onCompare,
  showBottomSheet = false,
  onCloseBottomSheet,
}: MyPicksTrayProps) {
  const isMobile = useIsMobile();

  /* ── Mobile: bottom sheet drawer ─────────────── */
  if (isMobile) {
    return (
      <AnimatePresence>
        {showBottomSheet && (
          <motion.div
            className="fixed inset-0 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseBottomSheet}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

            {/* Drawer */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.15)] max-h-[60vh] overflow-hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-black/10" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-black/5">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "15px" }}>📌</span>
                  <span
                    className="text-[#1B2D45]"
                    style={{ fontSize: "15px", fontWeight: 700 }}
                  >
                    My Picks
                  </span>
                  {picks.length > 0 && (
                    <span
                      className="bg-[#FF6B35] text-white px-2 py-0.5 rounded-full"
                      style={{ fontSize: "10px", fontWeight: 700 }}
                    >
                      {picks.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {picks.length > 0 && (
                    <button
                      onClick={onCompare}
                      className="flex items-center gap-1.5 text-[#FF6B35]"
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      Compare
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={onCloseBottomSheet}
                    className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center ml-1"
                  >
                    <ChevronDown className="w-4 h-4 text-[#1B2D45]/40" />
                  </button>
                </div>
              </div>

              {/* Cards or Empty */}
              {picks.length === 0 ? (
                <div className="py-10 text-center">
                  <span style={{ fontSize: "32px" }}>📌</span>
                  <p
                    className="text-[#1B2D45]/40 mt-2"
                    style={{ fontSize: "13px", fontWeight: 500 }}
                  >
                    No picks yet
                  </p>
                  <p
                    className="text-[#1B2D45]/25 mt-1 max-w-[240px] mx-auto"
                    style={{ fontSize: "12px", lineHeight: 1.5 }}
                  >
                    Pin listings from the board to compare them here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto no-scrollbar p-4">
                  <div className="flex gap-3">
                    <AnimatePresence>
                      {picks.map((p) => (
                        <PickCard
                          key={p.id}
                          listing={p}
                          healthScore={healthScores[p.id] ?? null}
                          onRemove={() => onRemove(p.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  /* ── Desktop: horizontal tray ────────────────── */
  return (
    <AnimatePresence>
      {picks.length > 0 && (
        <motion.div
          className="max-w-[1200px] mx-auto px-6 pb-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          <div className="bg-white rounded-2xl border border-[#FF6B35]/15 p-4 shadow-[0_2px_12px_rgba(255,107,53,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "15px" }}>📌</span>
                <span
                  className="text-[#1B2D45]"
                  style={{ fontSize: "14px", fontWeight: 700 }}
                >
                  My Picks
                </span>
                <motion.span
                  key={picks.length}
                  className="bg-[#FF6B35] text-white px-2 py-0.5 rounded-full"
                  style={{ fontSize: "10px", fontWeight: 700 }}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {picks.length}
                </motion.span>
              </div>
              <button
                onClick={onCompare}
                className="flex items-center gap-1.5 text-[#FF6B35] hover:underline"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                Compare all
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              <AnimatePresence>
                {picks.map((p) => (
                  <PickCard
                    key={p.id}
                    listing={p}
                    healthScore={healthScores[p.id] ?? null}
                    onRemove={() => onRemove(p.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
