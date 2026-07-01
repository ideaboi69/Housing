"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Pin, ZoomIn, ZoomOut, Bed, Bath, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { formatPrice, formatPropertyType } from "@/lib/utils";
import { getProximityLabel } from "@/lib/proximity";
import {
  GOOGLE_MAPS_KEY,
  GUELPH_CENTER,
  loadGoogleMaps,
} from "@/lib/google-maps";
import type { ListingDetailResponse, NearbyPlaces } from "@/types";
import { groupBrowseItems, type BrowseItem, type BuildingGroup } from "@/lib/buildings";

function formatNearbyKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// Compact grocery + gym readout for a rail card. Renders nothing when the
// property has no cached POIs (e.g. GOOGLE_MAPS_API_KEY unset on the backend).
function NearbyChips({ places }: { places?: NearbyPlaces | null }) {
  if (!places) return null;
  const rows: Array<{ emoji: string; name: string; km: number }> = [];
  if (places.grocery) rows.push({ emoji: "🥬", name: places.grocery.name, km: places.grocery.distance_km });
  if (places.gym) rows.push({ emoji: "💪", name: places.gym.name, km: places.gym.distance_km });
  if (rows.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      {rows.map((row) => (
        <span
          key={row.emoji}
          className="inline-flex items-center gap-1 rounded-full bg-[#FAF8F4] px-2 py-0.5 max-w-full"
          style={{ fontSize: "10px", fontWeight: 700, color: "#1B2D45" }}
          title={`${row.name} · ${formatNearbyKm(row.km)}`}
        >
          <span>{row.emoji}</span>
          <span className="truncate max-w-[110px]">{row.name}</span>
          <span className="text-[#1B2D45]/45">· {formatNearbyKm(row.km)}</span>
        </span>
      ))}
    </div>
  );
}

type SortKey = "recommended" | "price_low" | "price_high" | "closest";

interface MapViewProps {
  listings: ListingDetailResponse[];
  healthScores: Record<number, number>;
  pinnedIds: number[];
  onTogglePin: (id: number) => void;
}

// Map pins are colour-coded by property type (score still shows on the list
// cards + score rings). Every apartment building uses the apartment colour.
const PROPERTY_TYPE_COLORS: Record<string, string> = {
  house: "#FF6B35",     // primary orange
  apartment: "#2EC4B6", // teal
  townhouse: "#FFB627", // amber
  room: "#4ADE80",      // green
};
const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: "House",
  apartment: "Apartment",
  townhouse: "Townhouse",
  room: "Room",
};
function propertyTypeColor(type?: string): string {
  return PROPERTY_TYPE_COLORS[type ?? ""] ?? "#1B2D45";
}

function MapTypeLegend() {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {Object.entries(PROPERTY_TYPE_LABELS).map(([type, label]) => (
        <div key={type} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: PROPERTY_TYPE_COLORS[type] }} />
          <span className="text-[#1B2D45]/45" style={{ fontSize: "9px", fontWeight: 600 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function MapHintCard({ text }: { text: string }) {
  return (
    <div className="absolute bottom-4 right-4 z-[10] hidden max-w-[220px] rounded-2xl bg-white/90 px-3 py-2.5 shadow-md backdrop-blur-sm md:block">
      <p className="text-[#1B2D45]/55" style={{ fontSize: "10px", fontWeight: 700, lineHeight: 1.45 }}>
        {text}
      </p>
    </div>
  );
}

function BrowseMapSummary({ listings, avgRent }: { listings: ListingDetailResponse[]; avgRent: number }) {
  return (
    <div className="absolute left-4 top-4 z-[10] max-w-[calc(100%-5rem)] sm:max-w-[250px] rounded-2xl bg-white/92 px-3 py-2.5 shadow-md backdrop-blur-sm sm:px-4 sm:py-3">
      <div className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 800 }}>
        Guelph student rentals
      </div>
      <div className="mt-0.5 text-[#1B2D45]/45" style={{ fontSize: "10px", fontWeight: 600 }}>
        {listings.length} listings · Avg {formatPrice(avgRent)}/room
      </div>
      <MapTypeLegend />
    </div>
  );
}

function MapControls({ onZoomIn, onZoomOut }: { onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <div className="absolute right-4 top-4 z-[10] flex flex-col gap-2">
      <button onClick={onZoomIn} className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50">
        <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1B2D45]" />
      </button>
      <button onClick={onZoomOut} className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50">
        <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1B2D45]" />
      </button>
    </div>
  );
}

function ListingRailCard({
  listing,
  healthScores,
  isPinned,
  isSelected,
  onSelect,
  onTogglePin,
}: {
  listing: ListingDetailResponse;
  healthScores: Record<number, number>;
  isPinned: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onTogglePin: (id: number) => void;
}) {
  const score = healthScores[listing.id] ?? 0;
  const image = listing.images?.[0]?.image_url;
  const proximity = getProximityLabel(listing.walk_time_minutes);

  return (
    <div
      onClick={() => onSelect(listing.id)}
      className={`rounded-2xl border bg-white overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? "border-[#FF6B35]/35 shadow-[0_12px_28px_rgba(255,107,53,0.14)]"
          : "border-black/[0.06] hover:border-[#1B2D45]/12 hover:shadow-[0_10px_24px_rgba(27,45,69,0.08)]"
      }`}
    >
      <div className="grid grid-cols-[136px_minmax(0,1fr)] min-h-[152px]">
        <div className="relative h-full bg-[#F2EEE8]">
          {image ? (
            <img src={image} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🏠</div>
          )}
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-sm shadow-sm">
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#FF6B35" }}>
              {formatPrice(Number(listing.rent_per_room))}
            </span>
          </div>
        </div>

        <div className="p-3.5 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[#1B2D45] truncate" style={{ fontSize: "15px", fontWeight: 800 }}>
                {listing.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-[#1B2D45]/40 min-w-0">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate" style={{ fontSize: "11px", fontWeight: 500 }}>
                  {listing.address}
                </span>
              </div>
            </div>
            <ScoreRing score={score} size={40} />
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full border"
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: proximity.color,
                background: proximity.bg,
                borderColor: `${proximity.color}22`,
              }}
            >
              <span>{proximity.emoji}</span>
              <span>{proximity.label}</span>
            </span>
            <span className="text-[#1B2D45]/42" style={{ fontSize: "11px", fontWeight: 600 }}>
              {listing.drive_time_minutes ? `${listing.drive_time_minutes} min drive` : listing.bus_time_minutes ? `${listing.bus_time_minutes} min bus` : "Distance available"}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-3 text-[#1B2D45]/52 flex-wrap" style={{ fontSize: "11px", fontWeight: 600 }}>
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {listing.total_rooms} bed</span>
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {listing.bathrooms} bath</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatPropertyType(listing.property_type)}</span>
          </div>

          <NearbyChips places={listing.nearby_places} />

          <div className="flex items-center gap-2 mt-4">
            <Link
              href={`/browse/${listing.id}`}
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#FF6B35] px-3 py-2 text-white hover:bg-[#e55e2e] transition-colors"
              style={{ fontSize: "12px", fontWeight: 700 }}
            >
              View details
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(listing.id);
              }}
              className={`inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 border transition-colors ${
                isPinned
                  ? "border-[#FF6B35]/25 bg-[#FF6B35]/[0.08] text-[#FF6B35]"
                  : "border-black/[0.06] text-[#1B2D45]/45 hover:text-[#1B2D45]/70"
              }`}
              style={{ fontSize: "12px", fontWeight: 700 }}
            >
              <Pin className="w-3.5 h-3.5" />
              {isPinned ? "Pinned" : "Pin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuildingRailCard({
  building,
  healthScores,
  isSelected,
  onSelect,
}: {
  building: BuildingGroup;
  healthScores: Record<number, number>;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const score = healthScores[building.listings[0]?.id] ?? 0;
  const image = building.coverImage;
  const proximity = getProximityLabel(building.walk_time_minutes);
  const bedLabel = building.bedMin != null
    ? (building.bedMax && building.bedMax !== building.bedMin ? `${building.bedMin}–${building.bedMax} bed` : `${building.bedMin} bed`)
    : null;

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border bg-white overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? "border-[#FF6B35]/35 shadow-[0_12px_28px_rgba(255,107,53,0.14)]"
          : "border-black/[0.06] hover:border-[#1B2D45]/12 hover:shadow-[0_10px_24px_rgba(27,45,69,0.08)]"
      }`}
    >
      <div className="grid grid-cols-[136px_minmax(0,1fr)] min-h-[152px]">
        <div className="relative h-full bg-[#F2EEE8]">
          {image ? (
            <img src={image} alt={building.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🏢</div>
          )}
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-sm shadow-sm">
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#FF6B35" }}>
              From {formatPrice(building.priceMin)}
            </span>
          </div>
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[#1B2D45] text-white" style={{ fontSize: "10px", fontWeight: 800 }}>
            {building.unitCount} units
          </div>
        </div>

        <div className="p-3.5 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[#1B2D45] truncate" style={{ fontSize: "15px", fontWeight: 800 }}>
                {building.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-[#1B2D45]/40 min-w-0">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate" style={{ fontSize: "11px", fontWeight: 500 }}>
                  {building.address}
                </span>
              </div>
            </div>
            <ScoreRing score={score} size={40} />
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full border"
              style={{ fontSize: "10px", fontWeight: 700, color: proximity.color, background: proximity.bg, borderColor: `${proximity.color}22` }}
            >
              <span>{proximity.emoji}</span>
              <span>{proximity.label}</span>
            </span>
            {bedLabel && (
              <span className="text-[#1B2D45]/42" style={{ fontSize: "11px", fontWeight: 600 }}>{bedLabel}</span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3 text-[#1B2D45]/52 flex-wrap" style={{ fontSize: "11px", fontWeight: 600 }}>
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {building.unitCount} unit{building.unitCount !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Apartment</span>
          </div>

          <NearbyChips places={building.listings[0]?.nearby_places} />

          <div className="flex items-center gap-2 mt-4">
            <Link
              href={`/browse/building/${building.propertyId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#FF6B35] px-3 py-2 text-white hover:bg-[#e55e2e] transition-colors"
              style={{ fontSize: "12px", fontWeight: 700 }}
            >
              View building
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MapView({ listings, healthScores, pinnedIds, onTogglePin }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Google OverlayView that hosts the price pins. Positioning happens inside the
  // overlay's draw() (called by the map every paint frame), so pins stay glued
  // to their coordinates while panning/zooming instead of snapping on idle.
  const overlayRef = useRef<any>(null);
  const markersRef = useRef<Map<string, { el: HTMLElement; lat: number; lng: number }>>(new Map());
  const [layerEl, setLayerEl] = useState<HTMLDivElement | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapZoom, setMapZoom] = useState(13.8);
  const [mapCenter, setMapCenter] = useState(GUELPH_CENTER);
  const [sortKey, setSortKey] = useState<SortKey>("recommended");

  // Reposition every pin from the map's live projection. Kept in a ref so the
  // OverlayView's draw() always calls the latest closure.
  const reposition = useCallback(() => {
    const projection = overlayRef.current?.getProjection?.();
    const google = typeof window !== "undefined" ? window.google : undefined;
    if (!projection || !google) return;
    markersRef.current.forEach(({ el, lat, lng }) => {
      const p = projection.fromLatLngToDivPixel(new google.maps.LatLng(lat, lng));
      if (!p) return;
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
    });
  }, []);
  const repositionRef = useRef(reposition);
  repositionRef.current = reposition;

  const avgRent = listings.length > 0
    ? Math.round(listings.reduce((total, listing) => total + Number(listing.rent_per_room), 0) / listings.length)
    : 0;

  const sortedListings = useMemo(() => {
    const result = [...listings];
    if (sortKey === "price_low") {
      result.sort((a, b) => Number(a.rent_per_room) - Number(b.rent_per_room));
    } else if (sortKey === "price_high") {
      result.sort((a, b) => Number(b.rent_per_room) - Number(a.rent_per_room));
    } else if (sortKey === "closest") {
      result.sort((a, b) => (a.drive_time_minutes ?? a.walk_time_minutes ?? 999) - (b.drive_time_minutes ?? b.walk_time_minutes ?? 999));
    } else {
      result.sort((a, b) => (healthScores[b.id] ?? 0) - (healthScores[a.id] ?? 0));
    }
    return result;
  }, [healthScores, listings, sortKey]);

  const selectedListing = sortedListings.find((listing) => listing.id === selectedId) ?? sortedListings[0] ?? null;

  const focusListing = useCallback((listingId: number) => {
    setSelectedId(listingId);
  }, []);

  useEffect(() => {
    if (!selectedId && sortedListings.length > 0) {
      setSelectedId(sortedListings[0].id);
    }
  }, [selectedId, sortedListings]);

  // Initialize Google Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current || !GOOGLE_MAPS_KEY) return;
    let cancelled = false;

    async function init() {
      try {
        const google = await loadGoogleMaps();
        if (cancelled || !mapContainerRef.current || mapInstanceRef.current) return;

        const map = new google.maps.Map(mapContainerRef.current, {
          center: mapCenter,
          zoom: Math.round(mapZoom),
          disableDefaultUI: true,
          gestureHandling: "greedy",
          clickableIcons: false,
          backgroundColor: "#EDF2EF",
        });
        mapInstanceRef.current = map;

        map.addListener("idle", () => {
          const c = map.getCenter();
          const z = map.getZoom();
          if (c) setMapCenter({ lat: c.lat(), lng: c.lng() });
          if (z != null) setMapZoom(z);
        });

        // Pin layer as a native map overlay — draw() fires on every map paint,
        // keeping pins locked to their coordinates during pan/zoom.
        class PinOverlay extends google.maps.OverlayView {
          div: HTMLDivElement | null = null;
          onAdd() {
            const div = document.createElement("div");
            div.style.position = "absolute";
            div.style.top = "0";
            div.style.left = "0";
            div.style.pointerEvents = "none"; // map stays draggable between pins
            this.div = div;
            this.getPanes().overlayMouseTarget.appendChild(div);
            setLayerEl(div);
          }
          draw() {
            repositionRef.current();
          }
          onRemove() {
            this.div?.parentNode?.removeChild(this.div);
            this.div = null;
            setLayerEl(null);
          }
        }
        const overlay = new PinOverlay();
        overlay.setMap(map);
        overlayRef.current = overlay;
      } catch (err) {
        console.error("Google Maps init failed:", err);
      }
    }
    init();

    return () => {
      cancelled = true;
      overlayRef.current?.setMap(null);
      overlayRef.current = null;
      mapInstanceRef.current = null;
    };
    // intentionally only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external zoom changes (from our buttons) into the map.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const current = map.getZoom();
    const rounded = Math.round(mapZoom);
    if (current !== rounded) map.setZoom(rounded);
  }, [mapZoom]);

  // Group apartment units into one building entry (the same logic the board/grid
  // use), so the map markers AND the side list show a building once instead of
  // once per unit.
  const items = useMemo(() => groupBrowseItems(sortedListings), [sortedListings]);

  const markerData = useMemo(() => {
    return items.map((item) => {
      const lat = item.kind === "building" ? item.building.latitude : item.listing.latitude;
      const lng = item.kind === "building" ? item.building.longitude : item.listing.longitude;
      if (lat == null || lng == null) return null;
      const repId = item.kind === "building" ? item.building.listings[0].id : item.listing.id;
      const minRent = Math.round(item.kind === "building" ? item.building.priceMin : Number(item.listing.rent_per_room));
      const isMulti = item.kind === "building" && item.building.unitCount > 1;
      const count = item.kind === "building" ? item.building.unitCount : 1;
      const key = item.kind === "building" ? `b-${item.building.propertyId}` : `l-${item.listing.id}`;
      const propertyType = item.kind === "building" ? "apartment" : String(item.listing.property_type);
      return { key, lat: Number(lat), lng: Number(lng), repId, minRent, isMulti, count, propertyType, item };
    }).filter(Boolean) as Array<{ key: string; lat: number; lng: number; repId: number; minRent: number; isMulti: boolean; count: number; propertyType: string; item: BrowseItem }>;
  }, [items]);

  // Re-apply pin positions whenever the set of pins, the selection, or the
  // overlay layer changes (the map itself repositions on pan/zoom via draw()).
  useEffect(() => {
    reposition();
  }, [markerData, selectedListing, layerEl, reposition]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-5">
      <div
        className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-white xl:h-[calc(100vh-190px)]"
        style={{ boxShadow: "0 22px 55px rgba(27,45,69,0.08)" }}
      >
        <div className="grid xl:h-full xl:grid-cols-[minmax(0,1.18fr)_430px]">
          <div className="relative min-h-[54vh] overflow-hidden bg-[#EDF2EF] xl:h-full">
            <div ref={mapContainerRef} className="absolute inset-0" />

            <BrowseMapSummary listings={listings} avgRent={avgRent} />
            <MapControls
              onZoomIn={() => setMapZoom((value) => Math.min(20, Math.round(value) + 1))}
              onZoomOut={() => setMapZoom((value) => Math.max(8, Math.round(value) - 1))}
            />
            <MapHintCard text="Tap a price pin to preview that listing in the panel beside the map." />

            {layerEl && createPortal(
              markerData.map((m) => {
                const color = propertyTypeColor(m.propertyType);
                const isSelected = m.item.kind === "building"
                  ? (selectedListing != null && m.item.building.listings.some((l) => l.id === selectedListing.id))
                  : selectedListing?.id === m.item.listing.id;
                return (
                  <button
                    key={m.key}
                    ref={(el) => {
                      if (el) markersRef.current.set(m.key, { el, lat: m.lat, lng: m.lng });
                      else markersRef.current.delete(m.key);
                    }}
                    onClick={() => focusListing(m.repId)}
                    className="pointer-events-auto absolute rounded-full border-2 bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-transform"
                    style={{
                      borderColor: color,
                      transform: `translate(-50%, -50%) scale(${isSelected ? 1.08 : 1})`,
                      background: isSelected ? "#1B2D45" : "white",
                      zIndex: isSelected ? 8 : 6,
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
                      <span style={{ fontSize: "11px", fontWeight: 800, color: isSelected ? "white" : "#FF6B35" }}>
                        {m.isMulti ? `From $${m.minRent}` : `$${m.minRent}`}
                      </span>
                      {m.isMulti && (
                        <span
                          className="rounded-full px-1.5"
                          style={{ fontSize: "9px", fontWeight: 800, background: isSelected ? "rgba(255,255,255,0.2)" : "#1B2D45", color: "white" }}
                        >
                          {m.count}
                        </span>
                      )}
                    </span>
                  </button>
                );
              }),
              layerEl
            )}

          </div>

          <div className="min-h-[46vh] border-t xl:h-full xl:border-t-0 xl:border-l border-black/[0.06] bg-[#FCFBF8] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.06] bg-white/92 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[#1B2D45]/45" style={{ fontSize: "12px", fontWeight: 700 }}>
                    Home • ON • Guelph
                  </div>
                  <h2 className="mt-1 text-[#1B2D45]" style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.02em" }}>
                    {listings.length} listings found
                  </h2>
                  <p className="mt-1 text-[#1B2D45]/42" style={{ fontSize: "12px" }}>
                    Compare closer-to-campus options without leaving the map.
                  </p>
                </div>
                <div className="shrink-0">
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="rounded-xl border border-black/[0.06] bg-white px-3 py-2 text-[#1B2D45]/65 focus:border-[#FF6B35]/30 focus:outline-none"
                    style={{ fontSize: "12px", fontWeight: 700 }}
                  >
                    <option value="recommended">Recommended</option>
                    <option value="closest">Closest to campus</option>
                    <option value="price_low">Price: low to high</option>
                    <option value="price_high">Price: high to low</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {items.map((item) =>
                item.kind === "building" ? (
                  <BuildingRailCard
                    key={`b-${item.building.propertyId}`}
                    building={item.building}
                    healthScores={healthScores}
                    isSelected={selectedListing != null && item.building.listings.some((l) => l.id === selectedListing.id)}
                    onSelect={() => focusListing(item.building.listings[0].id)}
                  />
                ) : (
                  <ListingRailCard
                    key={`l-${item.listing.id}`}
                    listing={item.listing}
                    healthScores={healthScores}
                    isPinned={pinnedIds.includes(item.listing.id)}
                    isSelected={selectedListing?.id === item.listing.id}
                    onSelect={focusListing}
                    onTogglePin={onTogglePin}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
