"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Pin, Eye } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Pushpin, TapeStrip } from "@/components/ui/BoardDecorations";
import { formatPrice, formatPropertyType, formatLeaseType } from "@/lib/utils";
import { useSavedStore } from "@/lib/saved-store";
import type { ListingDetailResponse } from "@/types";

interface PolaroidCardProps {
  listing: ListingDetailResponse;
  healthScore?: number | null;
  rotation?: number;
  isPinned?: boolean;
  onTogglePin?: (id: number) => void;
  isMobile?: boolean;
}

export function PolaroidCard({
  listing,
  healthScore,
  rotation = 0,
  isPinned = false,
  onTogglePin,
  isMobile = false,
}: PolaroidCardProps) {
  const router = useRouter();
  const saved = useSavedStore((s) => s.savedIds.has(listing.id));
  const toggling = useSavedStore((s) => s.togglingIds.has(listing.id));
  const toggleSave = useSavedStore((s) => s.toggleSave);
  const [isHovered, setIsHovered] = useState(false);

  const handleSaveClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleSave(listing.id);
    } catch (err) {
      if (err instanceof Error && err.message === "auth_required") {
        router.push("/login");
      }
    }
  }, [listing.id, toggleSave, router]);
  const score = healthScore ?? 0;

  /* ── Spring-driven hover state ────────────────── */
  const hoverProgress = useMotionValue(0);
  const springProgress = useSpring(hoverProgress, { stiffness: 300, damping: 24 });

  const y = useTransform(springProgress, [0, 1], [0, -12]);
  const rotate = useTransform(springProgress, [0, 1], [rotation, 0]);
  const scale = useTransform(springProgress, [0, 1], [1, 1.02]);
  const shadow = useTransform(
    springProgress,
    [0, 1],
    [
      "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
      "0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)",
    ]
  );

  const tags: string[] = [];
  if (listing.is_furnished) tags.push("Furnished");
  if (listing.has_parking) tags.push("Parking");
  if (listing.has_laundry) tags.push("Laundry");
  if (listing.utilities_included) tags.push("Utilities Incl.");

  /* ── Format move-in date for display ────────────── */
  const moveInLabel = listing.move_in_date
    ? new Date(listing.move_in_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  /* ── Lease type short label ─────────────────────── */
  const leaseLabel = listing.lease_type ? formatLeaseType(listing.lease_type) : null;

  /* ── Social proof counts ────────────────────────── */
  const viewCount = listing.view_count ?? 0;
  const saveCount = listing.save_count ?? 0;

  return (
    <motion.div
      className="relative group"
      style={{ y, rotate, scale }}
      onHoverStart={() => {
        hoverProgress.set(1);
        setIsHovered(true);
      }}
      onHoverEnd={() => {
        hoverProgress.set(0);
        setIsHovered(false);
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      {/* Pushpin */}
      <div
        className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10"
        style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.15))" }}
      >
        <Pushpin />
      </div>

      {/* Tape strips */}
      <TapeStrip side="left" rotation={-8} />
      <TapeStrip side="right" rotation={6} />

      {/* Card body */}
      <Link
        href={`/browse/${listing.id}`}
        className="bg-white rounded-sm cursor-pointer block"
        style={{ padding: "8px 8px 14px 8px" }}
      >
        <motion.div style={{ boxShadow: shadow }} className="rounded-sm">
          {/* Image area */}
          <div
            className="relative rounded-sm overflow-hidden bg-[#f0ece6]"
            style={{ height: isMobile ? "140px" : "180px" }}
          >
            {/* Placeholder image */}
            <div className="w-full h-full bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] flex items-center justify-center text-[#1B2D45]/20">
              <motion.span
                style={{ fontSize: "32px" }}
                animate={isHovered ? { scale: 1.15 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
              >
                🏠
              </motion.span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

            {/* Hover shimmer overlay */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
                backgroundSize: "250% 100%",
              }}
              animate={isHovered ? { backgroundPosition: ["200% 0", "-50% 0"] } : {}}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />

            {/* Health score */}
            {score > 0 && (
              <div className="absolute top-2 left-2" data-tour="health-score">
                <ScoreRing score={score} size={isMobile ? 34 : 38} />
              </div>
            )}

            {/* Save button + Popular badge */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              {listing.view_count > 100 && (
                <motion.div
                  className="bg-[#FF6B35] text-white px-2 py-0.5 rounded-full"
                  style={{ fontSize: "9px", fontWeight: 700 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                >
                  🔥 Popular
                </motion.div>
              )}
              <motion.button
                onClick={handleSaveClick}
                disabled={toggling}
                className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm disabled:opacity-50"
                whileTap={{ scale: 0.85 }}
              >
                <motion.div
                  animate={saved ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      saved
                        ? "fill-[#E71D36] text-[#E71D36]"
                        : "text-[#1B2D45]/40"
                    }`}
                  />
                </motion.div>
              </motion.button>
            </div>

            {/* Walk time pill */}
            {listing.walk_time_minutes && (
              <div
                className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full"
                style={{ fontSize: "10px", fontWeight: 600, color: "#1B2D45" }}
              >
                🚶 {listing.walk_time_minutes} min
              </div>
            )}
          </div>
        </motion.div>

        {/* Card info */}
        <div className="pt-3 px-0.5">
          <h3
            className="text-[#1B2D45] truncate"
            style={{ fontSize: "13px", fontWeight: 700 }}
          >
            {listing.title}
          </h3>
          <p
            className="text-[#1B2D45]/40 truncate mt-0.5"
            style={{ fontSize: "10px", fontWeight: 400 }}
          >
            {listing.address}
          </p>

          <div className="flex items-baseline gap-1 mt-1.5">
            <span
              className="text-[#FF6B35]"
              style={{ fontSize: "18px", fontWeight: 800 }}
            >
              {formatPrice(Number(listing.rent_per_room))}
            </span>
            <span
              className="text-[#1B2D45]/30"
              style={{ fontSize: "10px", fontWeight: 400 }}
            >
              /room/mo
            </span>
          </div>

          {/* Tags row 1 — property info + lease + move-in */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span
              className="bg-[#1B2D45]/5 text-[#1B2D45]/55 px-2 py-0.5 rounded"
              style={{ fontSize: "9px", fontWeight: 500 }}
            >
              {formatPropertyType(listing.property_type)}
            </span>
            <span
              className="bg-[#1B2D45]/5 text-[#1B2D45]/55 px-2 py-0.5 rounded"
              style={{ fontSize: "9px", fontWeight: 500 }}
            >
              {listing.total_rooms} bed
            </span>
            {leaseLabel && (
              <span
                className="bg-[#2EC4B6]/[0.08] text-[#2EC4B6] px-2 py-0.5 rounded"
                style={{ fontSize: "9px", fontWeight: 600 }}
              >
                {leaseLabel}
              </span>
            )}
            {moveInLabel && (
              <span
                className="bg-[#1B2D45]/[0.04] text-[#1B2D45]/40 px-2 py-0.5 rounded"
                style={{ fontSize: "9px", fontWeight: 500 }}
              >
                📅 {moveInLabel}
              </span>
            )}
          </div>

          {/* Tags row 2 — amenities */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="bg-[#FF6B35]/[0.06] text-[#FF6B35]/70 px-2 py-0.5 rounded border border-[#FF6B35]/10"
                  style={{ fontSize: "9px", fontWeight: 500 }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Social proof — viewed / saved */}
          {(viewCount > 0 || saveCount > 0) && (
            <div className="flex items-center gap-2.5 mt-2 text-[#1B2D45]/25" style={{ fontSize: "9px", fontWeight: 500 }}>
              {viewCount > 0 && (
                <span className="flex items-center gap-0.5">
                  <Eye className="w-3 h-3" /> {viewCount} viewed
                </span>
              )}
              {saveCount > 0 && (
                <span className="flex items-center gap-0.5">
                  <Heart className="w-3 h-3" /> {saveCount} saved
                </span>
              )}
            </div>
          )}

          {/* Pin to compare board */}
          {onTogglePin && (
            <motion.button
              data-tour="pin-to-board"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTogglePin(listing.id);
              }}
              className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border transition-colors ${
                isPinned
                  ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.08] text-[#FF6B35]"
                  : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/20 hover:text-[#FF6B35]/60"
              }`}
              style={{ fontSize: "10px", fontWeight: 600 }}
              whileTap={{ scale: 0.97 }}
            >
              <Pin className="w-3 h-3" />
              {isPinned ? "Pinned" : "Pin to board"}
            </motion.button>
          )}
        </div>
      </Link>
    </motion.div>
  );
}