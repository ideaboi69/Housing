"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, Layers } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { formatPrice } from "@/lib/utils";
import { getProximityLabel } from "@/lib/proximity";
import { Pushpin, TapeStrip } from "@/components/ui/BoardDecorations";
import { BedBath } from "@/components/ui/BedBath";
import type { BuildingGroup } from "@/lib/buildings";

interface BuildingCardProps {
  building: BuildingGroup;
  rotation?: number;
  isMobile?: boolean;
  variant?: "board" | "grid";
}

function rangeLabel(min: number | null, max: number | null): string {
  if (min == null) return "—";
  if (max == null || min === max) return `${min}`;
  return `${min}–${max}`;
}

export function BuildingCard({
  building,
  rotation = 0,
  isMobile = false,
  variant = "board",
}: BuildingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isBoard = variant === "board";

  const walkMinutes = building.walk_time_minutes == null ? null : Number(building.walk_time_minutes);
  const driveMinutes = building.drive_time_minutes == null ? null : Number(building.drive_time_minutes);
  const distanceKm = building.distance_to_campus_km == null ? null : Number(building.distance_to_campus_km);
  const proximity = getProximityLabel(walkMinutes);

  const hoverProgress = useMotionValue(0);
  const springProgress = useSpring(hoverProgress, { stiffness: 300, damping: 24 });
  const y = useTransform(springProgress, [0, 1], [0, isBoard ? -12 : -6]);
  const rotate = useTransform(springProgress, [0, 1], [rotation, 0]);
  const scale = useTransform(springProgress, [0, 1], [1, isBoard ? 1.02 : 1.01]);
  const shadow = useTransform(
    springProgress,
    [0, 1],
    [
      "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
      isBoard
        ? "0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)"
        : "0 16px 28px rgba(27,45,69,0.10), 0 6px 14px rgba(27,45,69,0.06)",
    ]
  );

  const campusFacts = [
    `${proximity.emoji} ${proximity.label}`,
    driveMinutes != null ? `🚗 ${driveMinutes} min drive` : null,
    distanceKm != null ? `📍 ${distanceKm.toFixed(1)} km` : null,
  ].filter(Boolean) as string[];

  return (
    <motion.div
      className="relative group"
      style={{ y, rotate: isBoard ? rotate : 0, scale }}
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
      {isBoard && (
        <>
          <div
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10"
            style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.15))" }}
          >
            <Pushpin />
          </div>
          <TapeStrip side="left" rotation={-8} />
          <TapeStrip side="right" rotation={6} />
        </>
      )}

      <Link
        href={`/browse/building/${building.propertyId}`}
        className={`bg-white cursor-pointer block ${isBoard ? "rounded-sm" : "rounded-2xl border border-black/[0.06] overflow-hidden"}`}
        style={isBoard ? { padding: "8px 8px 18px 8px" } : undefined}
      >
        <motion.div style={{ boxShadow: shadow }} className={isBoard ? "rounded-sm" : "rounded-2xl"}>
          {/* Image */}
          <div
            className={`relative overflow-hidden bg-[#f0ece6] ${isBoard ? "rounded-sm" : "rounded-t-2xl"}`}
            style={{ height: isBoard ? (isMobile ? "148px" : "192px") : (isMobile ? "150px" : "170px") }}
          >
            {building.coverImage ? (
              <Image
                src={cloudinaryUrl(building.coverImage, { w: 600 })}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#f0ece6] to-[#e6e0d6] flex items-center justify-center text-[#1B2D45]/20">
                <motion.span
                  animate={isHovered ? { scale: 1.15 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                >
                  <Building2 className="w-8 h-8" />
                </motion.span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

            {/* Apartment / listing-count badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#1B2D45]/85 backdrop-blur-sm text-white px-2 py-1 rounded-full"
              style={{ fontSize: "10px", fontWeight: 700 }}>
              <Layers className="w-3 h-3" />
              {building.unitCount} listing{building.unitCount !== 1 ? "s" : ""}
            </div>

            <div className="absolute top-2 right-2 bg-white/85 backdrop-blur-sm text-[#1B2D45] px-2 py-1 rounded-full"
              style={{ fontSize: "10px", fontWeight: 700 }}>
              🏢 Apartment
            </div>

            {driveMinutes != null && (
              <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full"
                style={{ fontSize: "10px", fontWeight: 600, color: "#1B2D45" }}>
                🚗 {driveMinutes} min
              </div>
            )}
          </div>

          {/* Info */}
          <div className={isBoard ? "px-3 pt-4 pb-4" : "px-4 pb-4 pt-3"}>
            <h3 className="text-[#1B2D45] truncate" style={{ fontSize: "15px", fontWeight: 700 }}>
              {building.title}
            </h3>
            <p className="text-[#1B2D45]/40 truncate mt-1" style={{ fontSize: "11px", fontWeight: 400 }}>
              {building.address}
            </p>

            <div className="flex items-end justify-between gap-2 mt-2.5">
              <div className="flex items-baseline gap-1">
                <span className="text-[#1B2D45]/30" style={{ fontSize: "11px", fontWeight: 500 }}>From</span>
                <span className="text-[#FF6B35]" style={{ fontSize: "21px", fontWeight: 800 }}>
                  {formatPrice(building.priceMin)}
                </span>
                <span className="text-[#1B2D45]/30" style={{ fontSize: "11px", fontWeight: 500 }}>/mo</span>
              </div>
              <BedBath
                beds={rangeLabel(building.bedMin, building.bedMax)}
                baths={building.bathMin != null ? rangeLabel(building.bathMin, building.bathMax) : null}
              />
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {campusFacts.map((fact, index) => (
                <span
                  key={fact}
                  className={index === 0 ? "px-2.5 py-1 rounded-full" : "bg-[#1B2D45]/[0.04] text-[#1B2D45]/50 px-2.5 py-1 rounded"}
                  style={index === 0
                    ? { fontSize: "10px", fontWeight: 600, color: proximity.color, background: proximity.bg }
                    : { fontSize: "10px", fontWeight: 500 }}
                >
                  {fact}
                </span>
              ))}
            </div>

            {/* Property type + amenity tags — matches PolaroidCard styling */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="bg-[#1B2D45]/5 text-[#1B2D45]/55 px-2.5 py-1 rounded" style={{ fontSize: "10px", fontWeight: 500 }}>
                Apartment
              </span>
              {(() => {
                const tags: string[] = [];
                if (building.is_furnished) tags.push("Furnished");
                if (building.has_parking) tags.push("Parking");
                if (building.has_laundry) tags.push("Laundry");
                if (building.utilities_included) tags.push("Utilities Incl.");
                return tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="bg-[#FF6B35]/[0.06] text-[#FF6B35]/70 px-2.5 py-1 rounded border border-[#FF6B35]/10"
                    style={{ fontSize: "10px", fontWeight: 500 }}
                  >
                    {t}
                  </span>
                ));
              })()}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 700 }}>
              View {building.unitCount} listing{building.unitCount !== 1 ? "s" : ""} →
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
