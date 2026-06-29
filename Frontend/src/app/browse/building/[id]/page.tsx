"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Building2, Layers, Check, Maximize2, Ruler, Bed, DollarSign, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { getMockBuilding } from "@/lib/mock-data";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { formatPrice, formatPropertyType } from "@/lib/utils";
import { getProximityLabel } from "@/lib/proximity";
import { getAmenityChecklist } from "@/lib/amenities";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { BedBath } from "@/components/ui/BedBath";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { LandlordContactCard } from "@/components/ui/LandlordContactCard";
import { CribbMap } from "@/components/ui/CribbMap";
import { PricingFloorPlans } from "@/components/browse/PricingFloorPlans";
import type { BuildingResponse } from "@/types";

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
  const sideThumbs = images.slice(1, 4);
  const overflowCount = Math.max(0, images.length - 4);
  const proximity = getProximityLabel(building.walk_time_minutes ?? null);

  // Shared amenity checklist — same component the regular listing uses.
  const amenities = getAmenityChecklist(building as unknown as Record<string, unknown>);
  const hasAmenities = amenities.filter((a) => a.has);
  const noAmenities = amenities.filter((a) => !a.has);

  // Building-level Cribb Score = average of unit scores that have one.
  const unitScores = building.units.map((u) => u.overall_score).filter((s): s is number => s != null && s > 0);
  const avgScore = unitScores.length ? Math.round(unitScores.reduce((a, b) => a + b, 0) / unitScores.length) : 0;

  const totalAvailable = building.units.reduce((sum, u) => sum + (u.units_available ?? 0), 0);

  // Quick facts — mirrors the regular listing's 4-up grid, adapted to a building.
  const quickFacts: { label: string; value: string; icon: typeof Ruler }[] = [
    { label: "Type", value: formatPropertyType(building.property_type), icon: Building2 },
    { label: "Layouts", value: `${building.unit_count} floor plan${building.unit_count === 1 ? "" : "s"}`, icon: Layers },
    { label: "Beds · Baths", value: `${rangeLabel(building.bed_min, building.bed_max, "bed") ?? "—"} · ${rangeLabel(building.bath_min, building.bath_max, "bath") ?? "—"}`, icon: Bed },
    { label: "Starting rent", value: building.price_min != null ? `${formatPrice(building.price_min)}/mo` : "—", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        <Link href="/browse" className="inline-flex items-center gap-1.5 text-[#1B2D45]/50 hover:text-[#1B2D45] transition-colors mb-5" style={{ fontSize: "13px", fontWeight: 500 }}>
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* ─── Main Content ─── */}
          <div>
            {/* Gallery */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
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

            {/* Title + address + score */}
            <div className="mt-6 bg-white rounded-xl border border-black/[0.04] p-5 md:p-6" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.03)" }}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.3px" }}>{building.title}</h1>
                  <div className="flex items-center gap-2 mt-1.5 text-[#1B2D45]/50">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span style={{ fontSize: "13px" }}>{building.address}</span>
                  </div>
                  <div className="mt-2.5">
                    <BedBath
                      beds={rangeLabel(building.bed_min, building.bed_max) ?? "—"}
                      baths={building.bath_min != null ? rangeLabel(building.bath_min, building.bath_max) : null}
                      size="md"
                    />
                  </div>
                </div>
                {avgScore > 0 && (
                  <div className="shrink-0 text-center">
                    <ScoreRing score={avgScore} size={56} />
                    <p className="mt-1 text-[#1B2D45]/40" style={{ fontSize: "9px", fontWeight: 700 }}>Building avg</p>
                  </div>
                )}
              </div>

              {/* Quick facts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 mt-5">
                {quickFacts.map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <div key={fact.label} className="bg-[#FAF8F4] rounded-xl p-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-[#FF6B35]/50" />
                        <span className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 600 }}>{fact.label}</span>
                      </div>
                      <div className="text-[#1B2D45] mt-1" style={{ fontSize: "13px", fontWeight: 700 }}>{fact.value}</div>
                    </div>
                  );
                })}
              </div>

              {/* Building Overview */}
              {building.description && building.description.trim() && (
                <div className="mt-6">
                  <h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Building Overview</h3>
                  <p className="mt-2 text-[#1B2D45]/70 whitespace-pre-line" style={{ fontSize: "13px", lineHeight: 1.7 }}>
                    {building.description}
                  </p>
                </div>
              )}

              {/* Getting to campus */}
              <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Getting to Campus</h3>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 700, color: proximity.color, background: proximity.bg }}>
                  <span>{proximity.emoji}</span><span>{proximity.label}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {building.drive_time_minutes != null && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4]">
                    <span style={{ fontSize: "16px" }}>🚗</span>
                    <div>
                      <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{building.drive_time_minutes} min</p>
                      <p className="text-[#1B2D45]/30" style={{ fontSize: "9px" }}>by car</p>
                    </div>
                  </div>
                )}
                {building.bus_time_minutes != null && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4]">
                    <span style={{ fontSize: "16px" }}>🚌</span>
                    <div>
                      <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{building.bus_time_minutes} min</p>
                      <p className="text-[#1B2D45]/30" style={{ fontSize: "9px" }}>by bus</p>
                    </div>
                  </div>
                )}
                {building.distance_to_campus_km != null && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4]">
                    <span style={{ fontSize: "16px" }}>📍</span>
                    <div>
                      <p className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{Number(building.distance_to_campus_km).toFixed(1)} km</p>
                      <p className="text-[#1B2D45]/30" style={{ fontSize: "9px" }}>to campus</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Amenities */}
              {(hasAmenities.length > 0 || noAmenities.length > 0) && (
                <>
                  <h3 className="mt-6 text-[#1B2D45]" style={{ fontSize: "15px", fontWeight: 700 }}>Amenities</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                    {hasAmenities.map((a) => {
                      const Icon = a.icon;
                      return (
                        <div key={a.key} className="flex items-center gap-2.5 py-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#4ADE80]/10">
                            <Icon className="w-3.5 h-3.5 text-[#4ADE80]" />
                          </div>
                          <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 500 }}>{a.label}</span>
                        </div>
                      );
                    })}
                    {noAmenities.map((a) => {
                      const Icon = a.icon;
                      return (
                        <div key={a.key} className="flex items-center gap-2.5 py-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#1B2D45]/[0.03]">
                            <Icon className="w-3.5 h-3.5 text-[#1B2D45]/15" />
                          </div>
                          <span className="text-[#1B2D45]/25 line-through" style={{ fontSize: "13px", fontWeight: 500 }}>{a.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Estimated utility cost */}
              {building.estimated_utility_cost != null && !building.utilities_included && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FFB627]/[0.06] border border-[#FFB627]/10">
                  <Zap className="w-3.5 h-3.5 text-[#FFB627]" />
                  <span className="text-[#1B2D45]/60" style={{ fontSize: "11px" }}>
                    Estimated utilities: <strong className="text-[#1B2D45]">${building.estimated_utility_cost}/mo</strong> per person
                  </span>
                </div>
              )}
            </div>

            {/* Pricing & Floor Plans — apartments-style tabs, cards, table + modal */}
            <PricingFloorPlans units={building.units} amenities={amenities} />
          </div>

          {/* ─── Sidebar ─── */}
          <div className="space-y-4 lg:sticky lg:top-[80px] lg:self-start">
            {/* Price card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-black/[0.04] p-5" style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.04)" }}>
              <div className="flex items-baseline gap-1">
                <span className="text-[#1B2D45]/40" style={{ fontSize: "14px", fontWeight: 600 }}>From</span>
                <span className="text-[#FF6B35]" style={{ fontSize: "32px", fontWeight: 800 }}>{priceLabel(building)}</span>
                <span className="text-[#1B2D45]/30" style={{ fontSize: "14px" }}>/mo</span>
              </div>
              <div className="text-[#1B2D45]/40 mt-0.5" style={{ fontSize: "12px" }}>
                {building.unit_count} floor plan{building.unit_count === 1 ? "" : "s"}
                {totalAvailable > 0 ? ` · ${totalAvailable} available now` : ""}
              </div>

              {building.landlord_verified && (
                <div className="flex items-center gap-1.5 mt-4 bg-[#4ADE80]/10 text-[#4ADE80] px-3 py-1.5 rounded-lg" style={{ fontSize: "12px", fontWeight: 600 }}>
                  <Check className="w-3.5 h-3.5" /> Verified Landlord
                </div>
              )}

              <p className="mt-4 text-[#1B2D45]/55" style={{ fontSize: "12px", lineHeight: 1.55 }}>
                Pick a unit above and tap <strong className="text-[#1B2D45]">Details</strong> to book a showing or message the {building.landlord_company_name ? "leasing office" : "landlord"} about that layout.
              </p>
            </div>

            {/* Landlord Contact Card */}
            <LandlordContactCard
              landlordId={building.landlord_id}
              landlordName={building.landlord_name}
              landlordVerified={building.landlord_verified}
              landlordIsEarlyAdopter={building.landlord_is_early_adopter}
            />

            {/* Map */}
            <div className="rounded-xl border border-black/[0.04] overflow-hidden bg-white/90 backdrop-blur-xl" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
              <CribbMap
                lat={building.latitude != null ? Number(building.latitude) : undefined}
                lng={building.longitude != null ? Number(building.longitude) : undefined}
                address={building.address}
                height="200px"
                zoom={15}
              />
            </div>
          </div>
        </div>
      </div>

      {lightboxIndex !== null && images.length > 0 && (
        <PhotoLightbox images={images.map((img) => img.image_url)} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}
