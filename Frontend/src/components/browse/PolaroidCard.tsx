"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Pin } from "lucide-react";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Pushpin, TapeStrip } from "@/components/ui/BoardDecorations";
import { formatPrice, formatPropertyType, formatLeaseType } from "@/lib/utils";
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
  const [saved, setSaved] = useState(false);
  const score = healthScore ?? 0;

  // Build tags from property features
  const tags: string[] = [];
  if (listing.is_furnished) tags.push("Furnished");
  if (listing.has_parking) tags.push("Parking");
  if (listing.has_laundry) tags.push("Laundry");
  if (listing.utilities_included) tags.push("Utilities Incl.");

  return (
    <div
      className="relative group"
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: "transform 0.3s ease",
      }}
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
        className="bg-white rounded-sm overflow-hidden cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow block"
        style={{
          padding: "8px 8px 14px 8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {/* Image area */}
        <div
          className="relative rounded-sm overflow-hidden bg-[#f0ece6]"
          style={{ height: isMobile ? "140px" : "180px" }}
        >
          {/* Placeholder — replace with listing images from API */}
          <div className="w-full h-full bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] flex items-center justify-center text-[#1B2D45]/20">
            <span style={{ fontSize: "32px" }}>🏠</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Health score */}
          {score > 0 && (
            <div className="absolute top-2 left-2">
              <ScoreRing score={score} size={isMobile ? 34 : 38} />
            </div>
          )}

          {/* Save button */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            {listing.view_count > 100 && (
              <div
                className="bg-[#FF6B35] text-white px-2 py-0.5 rounded-full"
                style={{ fontSize: "9px", fontWeight: 700 }}
              >
                🔥 Popular
              </div>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSaved(!saved);
              }}
              className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  saved ? "fill-[#E71D36] text-[#E71D36]" : "text-[#1B2D45]/40"
                }`}
              />
            </button>
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
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="bg-[#FF6B35]/[0.06] text-[#FF6B35]/70 px-2 py-0.5 rounded border border-[#FF6B35]/10"
                style={{ fontSize: "9px", fontWeight: 500 }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Pin button */}
          {onTogglePin && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTogglePin(listing.id);
              }}
              className={`mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border transition-all ${
                isPinned
                  ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.08] text-[#FF6B35]"
                  : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/20 hover:text-[#FF6B35]/60"
              }`}
              style={{ fontSize: "10px", fontWeight: 600 }}
            >
              <Pin className="w-3 h-3" />
              {isPinned ? "Pinned" : "Pin to board"}
            </button>
          )}
        </div>
      </Link>
    </div>
  );
}
