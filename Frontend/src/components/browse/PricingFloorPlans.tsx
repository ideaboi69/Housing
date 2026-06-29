"use client";

import { useState } from "react";
import Link from "next/link";
import { Maximize2, ChevronDown, ChevronLeft, ChevronRight, X, Check, Layers, Table2 } from "lucide-react";
import { formatPrice, formatLeaseType } from "@/lib/utils";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import type { BuildingUnitResponse } from "@/types";

interface Amenity {
  key: string;
  label: string;
  has: boolean;
  category: string;
}

const CATEGORY_ORDER = ["essentials", "comfort", "building", "outdoor", "policy"];
const CATEGORY_LABELS: Record<string, string> = {
  essentials: "Essentials",
  comfort: "Comfort & Appliances",
  building: "Building Features",
  outdoor: "Outdoor",
  policy: "Policies",
};

function bedKeyOf(u: BuildingUnitResponse): string {
  return u.beds == null ? "other" : String(u.beds);
}

function bedLabel(key: string): string {
  if (key === "other") return "Other";
  if (key === "0") return "Studio";
  return `${key} Bedroom${key === "1" ? "" : "s"}`;
}

function unitName(u: BuildingUnitResponse): string {
  return u.unit_label ?? bedLabel(bedKeyOf(u));
}

function availabilityText(u: BuildingUnitResponse): string {
  if (u.units_available == null) return "Contact";
  return u.units_available > 0 ? "Available now" : "Waitlist";
}

/* ════════════════════════════════════════════════════════
   Unit Details Modal — dropdown to switch units + floor plan
   ════════════════════════════════════════════════════════ */

function UnitDetailsModal({
  units,
  activeId,
  amenities,
  onSelect,
  onClose,
  onTourFloorPlan,
}: {
  units: BuildingUnitResponse[];
  activeId: number;
  amenities: Amenity[];
  onSelect: (id: number) => void;
  onClose: () => void;
  onTourFloorPlan: (images: string[]) => void;
}) {
  const idx = Math.max(0, units.findIndex((u) => u.id === activeId));
  const unit = units[idx];
  if (!unit) return null;

  const go = (dir: number) => onSelect(units[(idx + dir + units.length) % units.length].id);
  const hasAmenities = amenities.filter((a) => a.has);
  const grouped = CATEGORY_ORDER
    .map((cat) => ({ cat, items: hasAmenities.filter((a) => a.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white w-full max-w-[1000px] max-h-[88vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar: dropdown + actions */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/[0.06]">
          {/* Unit dropdown */}
          <div className="relative min-w-0">
            <select
              value={unit.id}
              onChange={(e) => onSelect(Number(e.target.value))}
              className="appearance-none w-full max-w-[320px] truncate rounded-xl border border-black/[0.12] bg-white py-2.5 pl-3.5 pr-9 text-[#1B2D45] focus:border-[#FF6B35]/40 focus:outline-none cursor-pointer"
              style={{ fontSize: "13px", fontWeight: 700 }}
              aria-label="Choose a unit"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {unitName(u)} · {availabilityText(u)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#1B2D45]/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {unit.floor_plan_image && (
              <button
                type="button"
                onClick={() => onTourFloorPlan([unit.floor_plan_image as string])}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF6B35] text-white hover:bg-[#e55e2e] transition-colors"
                style={{ fontSize: "13px", fontWeight: 700 }}
              >
                <Maximize2 className="w-3.5 h-3.5" /> Tour Floor Plan
              </button>
            )}
            <Link
              href={`/browse/${unit.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#FF6B35]/30 text-[#FF6B35] hover:bg-[#FF6B35]/[0.06] transition-colors"
              style={{ fontSize: "13px", fontWeight: 700 }}
            >
              Send Message
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4.5 h-4.5 text-[#1B2D45]/50" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 md:p-6">
          {/* Unit summary */}
          <h2 className="text-[#1B2D45]" style={{ fontSize: "22px", fontWeight: 800 }}>{unitName(unit)}</h2>
          <p className="text-[#1B2D45] mt-1" style={{ fontSize: "18px", fontWeight: 800 }}>
            Base Price: <span className="text-[#FF6B35]">{formatPrice(unit.rent)}</span>
            <span className="text-[#1B2D45]/30 ml-1" style={{ fontSize: "13px", fontWeight: 500 }}>/mo · {formatLeaseType(unit.lease_type)}</span>
          </p>
          <p className="text-[#1B2D45]/55 mt-1" style={{ fontSize: "13px", fontWeight: 600 }}>
            {unit.beds != null ? `${unit.beds === 0 ? "Studio" : `${unit.beds} Bed`}` : "—"}
            {unit.baths != null ? ` · ${unit.baths} Bath` : ""}
            {unit.sqft != null ? ` · ${unit.sqft} Sq Ft` : ""}
            {unit.units_available != null && (
              <span className="ml-2 text-[#15803d]">· {availabilityText(unit)}</span>
            )}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6 mt-5">
            {/* Left: feature lists */}
            <div>
              {grouped.length > 0 ? (
                <div className="space-y-5">
                  {grouped.map((g) => (
                    <div key={g.cat}>
                      <h3 className="text-[#1B2D45] mb-2.5" style={{ fontSize: "14px", fontWeight: 800 }}>
                        {CATEGORY_LABELS[g.cat] ?? g.cat}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {g.items.map((a) => (
                          <div key={a.key} className="flex items-center gap-2 text-[#1B2D45]/75" style={{ fontSize: "13px" }}>
                            <Check className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                            {a.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#1B2D45]/40" style={{ fontSize: "13px" }}>
                  Amenity details are listed on the building page above.
                </p>
              )}
            </div>

            {/* Right: floor plan viewer */}
            <div>
              <div className="relative rounded-xl border border-black/[0.08] bg-[#FAF8F4] p-4">
                {units.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      aria-label="Previous unit"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-[#1B2D45]/60 hover:text-[#1B2D45] z-10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      aria-label="Next unit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-[#1B2D45]/60 hover:text-[#1B2D45] z-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                {unit.floor_plan_image ? (
                  <button
                    type="button"
                    onClick={() => onTourFloorPlan([unit.floor_plan_image as string])}
                    className="block w-full group relative"
                    aria-label="Expand floor plan"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={unit.floor_plan_image} alt={`${unitName(unit)} floor plan`} className="w-full h-[320px] object-contain" />
                    <span className="absolute top-1.5 right-1.5 w-8 h-8 rounded-lg bg-white/90 shadow flex items-center justify-center text-[#1B2D45]/55 group-hover:text-[#FF6B35]">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </button>
                ) : (
                  <div className="w-full h-[320px] flex flex-col items-center justify-center text-[#1B2D45]/30 gap-2">
                    <Layers className="w-8 h-8" />
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>No floor plan yet</span>
                  </div>
                )}
              </div>
              <p className="text-center text-[#1B2D45] mt-3" style={{ fontSize: "14px", fontWeight: 700 }}>{unitName(unit)}</p>
              <p className="text-center text-[#1B2D45]/40 mt-1" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                Renderings and visuals are for general reference only. Features may differ from what&apos;s shown.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Pricing & Floor Plans — tabs + floor-plan cards + table
   ════════════════════════════════════════════════════════ */

export function PricingFloorPlans({
  units,
  amenities,
}: {
  units: BuildingUnitResponse[];
  amenities: Amenity[];
}) {
  const [tab, setTab] = useState<string>("all");
  const [modalId, setModalId] = useState<number | null>(null);
  const [floorPlanImgs, setFloorPlanImgs] = useState<string[] | null>(null);

  const bedKeys = Array.from(new Set(units.map(bedKeyOf))).sort((a, b) =>
    a === "other" ? 1 : b === "other" ? -1 : Number(a) - Number(b)
  );
  const tabs = ["all", ...bedKeys];
  const filtered = tab === "all" ? units : units.filter((u) => bedKeyOf(u) === tab);

  return (
    <div className="mt-6 bg-white rounded-xl border border-black/[0.04] p-5 md:p-6" style={{ boxShadow: "0 1px 4px rgba(27,45,69,0.03)" }}>
      <h3 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>Pricing &amp; Floor Plans</h3>

      {/* Tabs */}
      <div className="mt-4 flex flex-wrap gap-1.5 rounded-xl bg-[#FAF8F4] p-1">
        {tabs.map((t) => {
          const active = tab === t;
          const label = t === "all" ? "All" : bedLabel(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 min-w-[80px] py-2 rounded-lg text-center transition-colors ${
                active ? "bg-[#1B2D45] text-white" : "text-[#1B2D45]/55 hover:text-[#1B2D45]"
              }`}
              style={{ fontSize: "13px", fontWeight: active ? 700 : 600 }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Floor-plan cards */}
      <div className="mt-5 flex flex-col gap-4">
        {filtered.map((unit) => {
          const available = unit.units_available ?? 0;
          return (
            <div key={unit.id} className="rounded-xl border border-black/[0.08] overflow-hidden">
              {/* Card header */}
              <div className="flex items-start gap-4 p-4">
                <button
                  type="button"
                  disabled={!unit.floor_plan_image}
                  onClick={() => unit.floor_plan_image && setFloorPlanImgs([unit.floor_plan_image])}
                  className="relative shrink-0 w-24 h-20 rounded-lg overflow-hidden bg-[#FAF8F4] border border-black/[0.06] disabled:cursor-default hidden sm:block"
                  aria-label={unit.floor_plan_image ? "View floor plan" : undefined}
                >
                  {unit.floor_plan_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={unit.floor_plan_image} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#1B2D45]/30"><Layers className="w-5 h-5" /></div>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>{unitName(unit)}</h4>
                  <p className="text-[#1B2D45] mt-0.5" style={{ fontSize: "16px", fontWeight: 800 }}>{formatPrice(unit.rent)}</p>
                  <p className="text-[#1B2D45]/55 mt-0.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                    {unit.beds != null ? (unit.beds === 0 ? "Studio" : `${unit.beds} Bed`) : "—"}
                    {unit.baths != null ? ` · ${unit.baths} Bath` : ""}
                    {unit.sqft != null ? ` · ${unit.sqft} Sq Ft` : ""}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setModalId(unit.id)}
                      className="text-[#FF6B35] hover:underline"
                      style={{ fontSize: "13px", fontWeight: 700 }}
                    >
                      Floor Plan Details
                    </button>
                    {unit.floor_plan_image && (
                      <>
                        <span className="text-[#1B2D45]/20">•</span>
                        <button
                          type="button"
                          onClick={() => setFloorPlanImgs([unit.floor_plan_image as string])}
                          className="inline-flex items-center gap-1 text-[#FF6B35] hover:underline"
                          style={{ fontSize: "13px", fontWeight: 700 }}
                        >
                          <Table2 className="w-3.5 h-3.5" /> Tour Floor Plan
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Availability table */}
              <div className="border-t border-black/[0.06]">
                <div className="px-4 py-2.5">
                  <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 800 }}>
                    {available > 0 ? `${available} Available Unit${available === 1 ? "" : "s"}` : "Join the waitlist"}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ fontSize: "13px" }}>
                    <thead>
                      <tr className="bg-[#FAF8F4] text-[#1B2D45]/50 text-left" style={{ fontSize: "11px", fontWeight: 700 }}>
                        <th className="px-4 py-2 font-bold">Unit</th>
                        <th className="px-4 py-2 font-bold">Base Price</th>
                        <th className="px-4 py-2 font-bold">Sq Ft</th>
                        <th className="px-4 py-2 font-bold">Availability</th>
                        <th className="px-4 py-2 font-bold text-right">Unit Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-black/[0.04]">
                        <td className="px-4 py-3 text-[#1B2D45]" style={{ fontWeight: 600 }}>{unitName(unit)}</td>
                        <td className="px-4 py-3 text-[#1B2D45]" style={{ fontWeight: 700 }}>{formatPrice(unit.rent)}</td>
                        <td className="px-4 py-3 text-[#1B2D45]/70">{unit.sqft ?? "—"}</td>
                        <td className="px-4 py-3 text-[#1B2D45]/70">{availabilityText(unit)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setModalId(unit.id)}
                              className="text-[#FF6B35] hover:underline"
                              style={{ fontWeight: 700 }}
                            >
                              View More
                            </button>
                            <Link
                              href={`/browse/${unit.id}`}
                              className="px-3 py-1.5 rounded-lg border border-[#FF6B35]/30 text-[#FF6B35] hover:bg-[#FF6B35]/[0.06] transition-colors"
                              style={{ fontWeight: 700, fontSize: "12px" }}
                            >
                              Send Message
                            </Link>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalId != null && (
        <UnitDetailsModal
          units={units}
          activeId={modalId}
          amenities={amenities}
          onSelect={setModalId}
          onClose={() => setModalId(null)}
          onTourFloorPlan={(imgs) => setFloorPlanImgs(imgs)}
        />
      )}
      {floorPlanImgs && floorPlanImgs.length > 0 && (
        <PhotoLightbox images={floorPlanImgs} title="Floor Plan" onClose={() => setFloorPlanImgs(null)} />
      )}
    </div>
  );
}
