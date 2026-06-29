"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Building2, Layers, Check, BadgeCheck, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { getMockBuilding } from "@/lib/mock-data";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { formatPrice, formatLeaseType } from "@/lib/utils";
import { getProximityLabel } from "@/lib/proximity";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { BedBath } from "@/components/ui/BedBath";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import type { BuildingResponse, BuildingUnitResponse } from "@/types";

function priceLabel(b: BuildingResponse): string {
  if (b.price_min == null) return "—";
  if (b.price_max == null || b.price_min === b.price_max) return formatPrice(b.price_min);
  return `${formatPrice(b.price_min)}–${formatPrice(b.price_max)}`;
}

function rangeLabel(min?: number | null, max?: number | null, unit = ""): string | null {
  if (min == null) return null;
  const base = max == null || min === max ? `${min}` : `${min}–${max}`;
  return unit ? `${base} ${unit}` : base;
}

const AMENITY_LABELS: { key: keyof BuildingResponse; label: string }[] = [
  { key: "is_furnished", label: "Furnished" },
  { key: "has_parking", label: "Parking" },
  { key: "has_laundry", label: "In-suite Laundry" },
  { key: "utilities_included", label: "Utilities Incl." },
  { key: "has_wifi", label: "Wi-Fi" },
  { key: "has_air_conditioning", label: "Air Conditioning" },
  { key: "has_dishwasher", label: "Dishwasher" },
  { key: "has_gym", label: "Gym" },
  { key: "has_elevator", label: "Elevator" },
  { key: "has_balcony", label: "Balcony" },
  { key: "wheelchair_accessible", label: "Accessible" },
];

function UnitRow({ unit }: { unit: BuildingUnitResponse }) {
  const available = unit.units_available;
  const total = unit.units_total;
  const soldOut = available != null && available <= 0;

  return (
    <Link
      href={`/browse/${unit.id}`}
      className="group flex items-center gap-3 sm:gap-4 rounded-xl border border-black/[0.06] bg-white p-3 transition-shadow hover:shadow-[0_8px_22px_rgba(27,45,69,0.07)]"
    >
      {/* Floor plan thumb */}
      <div className="relative shrink-0 w-24 h-20 sm:w-28 sm:h-24 rounded-lg overflow-hidden bg-[#FAF8F4] border border-black/[0.04]">
        {unit.floor_plan_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={unit.floor_plan_image}
            alt={`${unit.unit_label ?? "Unit"} floor plan`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#1B2D45]/30">
            <Layers className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-[#1B2D45] truncate" style={{ fontSize: "15px", fontWeight: 800 }}>
            {unit.unit_label ?? "Unit"}
          </h3>
          {(unit.beds != null || unit.baths != null) && (
            <BedBath beds={unit.beds ?? "—"} baths={unit.baths ?? null} />
          )}
          {unit.sqft != null && (
            <span className="text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 600 }}>
              {unit.sqft} sq ft
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-[#FF6B35]" style={{ fontSize: "18px", fontWeight: 800 }}>{formatPrice(unit.rent)}</span>
          <span className="text-[#1B2D45]/30" style={{ fontSize: "11px", fontWeight: 500 }}>/mo</span>
          <span className="text-[#1B2D45]/30 ml-1.5" style={{ fontSize: "11px", fontWeight: 500 }}>· {formatLeaseType(unit.lease_type)}</span>
          {available != null && total != null && (
            <span
              className={`ml-2 px-2 py-0.5 rounded-full ${soldOut ? "bg-[#1B2D45]/5 text-[#1B2D45]/40" : "bg-[#4ADE80]/15 text-[#15803d]"}`}
              style={{ fontSize: "10px", fontWeight: 700 }}
            >
              {soldOut ? "Waitlist" : `${available}/${total}`}
            </span>
          )}
        </div>
      </div>

      {/* Right side: score + chevron */}
      <div className="shrink-0 flex items-center gap-2">
        {unit.overall_score != null && unit.overall_score > 0 && (
          <ScoreRing score={unit.overall_score} size={32} />
        )}
        <span className="text-[#FF6B35] group-hover:translate-x-0.5 transition-transform" style={{ fontSize: "13px", fontWeight: 800 }}>
          →
        </span>
      </div>
    </Link>
  );
}

export default function BuildingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const propertyId = Number(id);

  const [building, setBuilding] = useState<BuildingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const data = await api.properties.getBuilding(propertyId);
        if (!cancelled && data && data.units?.length) {
          setBuilding(data);
          return;
        }
        throw new Error("empty");
      } catch {
        // Fall back to mock building (sample data / local dev)
        const mock = getMockBuilding(propertyId);
        if (!cancelled) {
          if (mock) setBuilding(mock);
          else setError("Building not found");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    if (Number.isFinite(propertyId)) load();
    else {
      setError("Invalid building");
      setIsLoading(false);
    }
    return () => { cancelled = true; };
  }, [propertyId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="text-[#1B2D45]/40" style={{ fontWeight: 600 }}>Loading building…</div>
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex flex-col items-center justify-center gap-4">
        <Building2 className="w-10 h-10 text-[#1B2D45]/30" />
        <p className="text-[#1B2D45]/60" style={{ fontWeight: 600 }}>{error ?? "Building not found"}</p>
        <Link href="/browse" className="text-[#FF6B35]" style={{ fontWeight: 700 }}>← Back to browse</Link>
      </div>
    );
  }

  const images = building.images ?? [];
  const cover = images[0]?.image_url;
  // Side column shows up to 3 thumbs. If there's more than 1 cover + 3 thumbs
  // (i.e. 5+ photos), the last thumb becomes a "+N more" tile that opens the
  // lightbox at that index.
  const sideThumbs = images.slice(1, 4);
  const overflowCount = Math.max(0, images.length - 4);
  const proximity = getProximityLabel(building.walk_time_minutes ?? null);
  const amenities = AMENITY_LABELS.filter((a) => building[a.key]);

  return (
    <div className="min-h-screen bg-[#FAF8F4] pb-16">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pt-5 md:pt-8">
        <Link href="/browse" className="inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45] transition-colors" style={{ fontSize: "13px", fontWeight: 600 }}>
          <ArrowLeft className="w-4 h-4" /> Back to browse
        </Link>

        {/* Gallery */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
          <button
            type="button"
            onClick={() => images.length > 0 && setLightboxIndex(0)}
            className="relative h-[280px] md:h-[380px] rounded-2xl overflow-hidden bg-[#f0ece6] text-left"
            aria-label={cover ? "View all photos" : undefined}
            disabled={!cover}
          >
            {cover ? (
              <Image src={cloudinaryUrl(cover, { w: 1000 })} alt={building.title} fill sizes="(max-width: 1024px) 100vw, 800px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#1B2D45]/20"><Building2 className="w-12 h-12" /></div>
            )}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#1B2D45]/85 backdrop-blur-sm text-white px-3 py-1.5 rounded-full" style={{ fontSize: "12px", fontWeight: 700 }}>
              <Building2 className="w-3.5 h-3.5" /> Apartment building
            </div>
            {images.length > 0 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 text-[#1B2D45] px-2.5 py-1.5 rounded-full backdrop-blur-sm" style={{ fontSize: "11px", fontWeight: 700 }}>
                <Maximize2 className="w-3 h-3" /> View all {images.length} photo{images.length === 1 ? "" : "s"}
              </div>
            )}
          </button>
          {sideThumbs.length > 0 && (
            <div className="hidden lg:grid grid-rows-3 gap-3">
              {sideThumbs.map((img, i) => {
                const isLast = i === sideThumbs.length - 1;
                const showOverflow = isLast && overflowCount > 0;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setLightboxIndex(i + 1)}
                    className="relative rounded-xl overflow-hidden bg-[#f0ece6] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
                  >
                    <Image src={cloudinaryUrl(img.image_url, { w: 400 })} alt="" fill sizes="300px" className={`object-cover ${showOverflow ? "brightness-[0.55]" : ""}`} />
                    {showOverflow && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-0.5">
                        <span style={{ fontSize: "20px", fontWeight: 800, lineHeight: 1 }}>+{overflowCount}</span>
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>View all</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Header */}
        <div className="mt-5 bg-white rounded-2xl border border-black/[0.04] p-5 md:p-6" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.03)" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 800 }}>{building.title}</h1>
              <div className="flex items-center gap-1.5 text-[#1B2D45]/50 mt-1.5">
                <MapPin className="w-4 h-4 shrink-0" />
                <span style={{ fontSize: "13px" }}>{building.address}</span>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 600, color: proximity.color, background: proximity.bg }}>
                  {proximity.emoji} {proximity.label}
                </span>
                {building.distance_to_campus_km != null && (
                  <span className="bg-[#1B2D45]/[0.04] text-[#1B2D45]/55 px-2.5 py-1 rounded" style={{ fontSize: "11px", fontWeight: 500 }}>
                    📍 {Number(building.distance_to_campus_km).toFixed(1)} km to campus
                  </span>
                )}
                {/* Match standard listing tags — navy property type, orange amenities */}
                <span className="bg-[#1B2D45]/5 text-[#1B2D45]/55 px-2.5 py-1 rounded" style={{ fontSize: "11px", fontWeight: 500 }}>
                  Apartment
                </span>
                {building.is_furnished && (
                  <span className="bg-[#FF6B35]/[0.06] text-[#FF6B35]/70 px-2.5 py-1 rounded border border-[#FF6B35]/10" style={{ fontSize: "11px", fontWeight: 500 }}>
                    Furnished
                  </span>
                )}
                {building.has_parking && (
                  <span className="bg-[#FF6B35]/[0.06] text-[#FF6B35]/70 px-2.5 py-1 rounded border border-[#FF6B35]/10" style={{ fontSize: "11px", fontWeight: 500 }}>
                    Parking
                  </span>
                )}
                {building.has_laundry && (
                  <span className="bg-[#FF6B35]/[0.06] text-[#FF6B35]/70 px-2.5 py-1 rounded border border-[#FF6B35]/10" style={{ fontSize: "11px", fontWeight: 500 }}>
                    Laundry
                  </span>
                )}
                {building.utilities_included && (
                  <span className="bg-[#FF6B35]/[0.06] text-[#FF6B35]/70 px-2.5 py-1 rounded border border-[#FF6B35]/10" style={{ fontSize: "11px", fontWeight: 500 }}>
                    Utilities Incl.
                  </span>
                )}
                <span className="flex items-center gap-1 bg-[#1B2D45]/[0.04] text-[#1B2D45]/55 px-2.5 py-1 rounded" style={{ fontSize: "11px", fontWeight: 600 }}>
                  <Layers className="w-3 h-3" /> {building.unit_count} listing{building.unit_count !== 1 ? "s" : ""}
                </span>
                {building.landlord_verified && (
                  <span className="flex items-center gap-1 bg-[#2EC4B6]/[0.08] text-[#2EC4B6] px-2.5 py-1 rounded" style={{ fontSize: "11px", fontWeight: 600 }}>
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified landlord
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-3 flex-wrap justify-end">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[#1B2D45]/40" style={{ fontSize: "12px", fontWeight: 600 }}>From</span>
                <span className="text-[#FF6B35]" style={{ fontSize: "28px", fontWeight: 800, lineHeight: 1 }}>{priceLabel(building)}</span>
                <span className="text-[#1B2D45]/40" style={{ fontSize: "12px", fontWeight: 500 }}>/mo</span>
              </div>
              <BedBath
                beds={rangeLabel(building.bed_min, building.bed_max) ?? "—"}
                baths={building.bath_min != null ? rangeLabel(building.bath_min, building.bath_max) : null}
                size="md"
              />
            </div>
          </div>

          {amenities.length > 0 && (
            <div className="mt-5 pt-5 border-t border-black/[0.05]">
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span key={a.label} className="flex items-center gap-1.5 bg-[#FAF8F4] text-[#1B2D45]/70 px-3 py-1.5 rounded-lg" style={{ fontSize: "12px", fontWeight: 600 }}>
                    <Check className="w-3.5 h-3.5 text-[#4ADE80]" /> {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Units */}
        <div className="mt-6">
          <h2 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
            Listings <span className="text-[#1B2D45]/40">({building.units.length})</span>
          </h2>
          <p className="text-[#1B2D45]/45 mt-1" style={{ fontSize: "13px" }}>Pick a listing to see photos, the Cribb Score, and book a showing.</p>
          <div className="mt-5 flex flex-col gap-6">
            {(() => {
              // Group by bed count; units with no beds value land in "Other"
              const groups = new Map<string, typeof building.units>();
              const order: string[] = [];
              for (const u of building.units) {
                const key = u.beds == null ? "other" : String(u.beds);
                if (!groups.has(key)) {
                  groups.set(key, []);
                  order.push(key);
                }
                groups.get(key)!.push(u);
              }
              // Sort numeric keys ascending, "other" last
              order.sort((a, b) => {
                if (a === "other") return 1;
                if (b === "other") return -1;
                return Number(a) - Number(b);
              });
              return order.map((key) => {
                const units = groups.get(key)!;
                const label =
                  key === "other"
                    ? "Other layouts"
                    : key === "0"
                    ? "Studio"
                    : `${key} Bedroom${key === "1" ? "" : "s"}`;
                return (
                  <div key={key}>
                    <div className="flex items-baseline gap-2 mb-2.5">
                      <h3 className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {label}
                      </h3>
                      <span className="text-[#1B2D45]/30" style={{ fontSize: "12px", fontWeight: 600 }}>
                        {units.length} {units.length === 1 ? "option" : "options"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {units.map((unit) => (
                        <UnitRow key={unit.id} unit={unit} />
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
      {lightboxIndex !== null && images.length > 0 && (
        <PhotoLightbox
          images={images.map((img) => img.image_url)}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
