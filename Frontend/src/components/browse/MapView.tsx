"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Pin, ZoomIn, ZoomOut, Bed, Bath, Clock, MapPin, ChevronDown } from "lucide-react";
import Link from "next/link";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { formatPrice, formatPropertyType } from "@/lib/utils";
import { getListingImages, mockCoordinates } from "@/lib/mock-data";
import { getProximityLabel } from "@/lib/proximity";
import { buildStaticMapUrl, GUELPH_CENTER, projectLngLatToContainer } from "@/lib/mapbox";
import {
  DEFAULT_MAP_VIEW_LANDMARKS,
  GUELPH_LANDMARKS,
  LANDMARK_TYPES,
  MAP_VIEW_LANDMARK_ORDER,
  type LandmarkType,
} from "@/lib/guelph-landmarks";
import type { ListingDetailResponse } from "@/types";

type SortKey = "recommended" | "price_low" | "price_high" | "closest";

interface MapViewProps {
  listings: ListingDetailResponse[];
  healthScores: Record<number, number>;
  pinnedIds: number[];
  onTogglePin: (id: number) => void;
}

function MapNearbyFilters({
  activeTypes,
  onToggle,
}: {
  activeTypes: Set<LandmarkType>;
  onToggle: (type: LandmarkType) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-[10] overflow-hidden rounded-2xl bg-white/92 shadow-md backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex items-center gap-2 px-3 py-2.5 text-[#1B2D45] transition-colors hover:bg-black/[0.02]"
        style={{ fontSize: "11px", fontWeight: 800 }}
      >
        <span>📍</span>
        Nearby places
        <ChevronDown className={`h-3.5 w-3.5 text-[#1B2D45]/40 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="border-t border-black/[0.06] px-3 pb-3 pt-2">
          <div className="flex flex-wrap gap-1.5">
            {MAP_VIEW_LANDMARK_ORDER.map((type) => {
              const config = LANDMARK_TYPES[type];
              const isActive = activeTypes.has(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onToggle(type)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 transition-all ${
                    isActive ? "bg-white shadow-sm" : "bg-black/[0.03] opacity-45"
                  }`}
                  style={{
                    borderColor: isActive ? `${config.color}30` : "transparent",
                    color: "#1B2D45",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  <span>{config.emoji}</span>
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MapScoreLegend() {
  return (
    <div className="mt-2 flex items-center gap-2 sm:gap-3">
      {[{ color: "#4ADE80", label: "85+" }, { color: "#FFB627", label: "65-84" }, { color: "#E71D36", label: "<65" }].map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
          <span className="text-[#1B2D45]/45" style={{ fontSize: "9px", fontWeight: 600 }}>{item.label}</span>
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

function poiPointSize(type: LandmarkType) {
  if (type === "campus") return { size: 34, fontSize: "16px" };
  if (type === "park") return { size: 26, fontSize: "12px" };
  return { size: 24, fontSize: "11px" };
}

function poiPointStyle(type: LandmarkType) {
  const config = LANDMARK_TYPES[type];
  return {
    background: `${config.color}E8`,
    borderColor: "rgba(255,255,255,0.95)",
  };
}

function poiZIndex(type: LandmarkType) {
  return type === "campus" ? 4 : 3;
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
      <MapScoreLegend />
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
  const image = getListingImages(listing.id)[0];
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
              {listing.walk_time_minutes ? `${listing.walk_time_minutes} min walk` : listing.bus_time_minutes ? `${listing.bus_time_minutes} min bus` : "Distance available"}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-3 text-[#1B2D45]/52 flex-wrap" style={{ fontSize: "11px", fontWeight: 600 }}>
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {listing.total_rooms} bed</span>
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {listing.bathrooms} bath</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatPropertyType(listing.property_type)}</span>
          </div>

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

export function MapView({ listings, healthScores, pinnedIds, onTogglePin }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapZoom, setMapZoom] = useState(13.8);
  const [mapSize, setMapSize] = useState({ width: 960, height: 720 });
  const [sortKey, setSortKey] = useState<SortKey>("recommended");
  const [activePoiTypes, setActivePoiTypes] = useState<Set<LandmarkType>>(
    () => new Set(DEFAULT_MAP_VIEW_LANDMARKS)
  );

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
      result.sort((a, b) => (a.walk_time_minutes ?? 999) - (b.walk_time_minutes ?? 999));
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

  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setMapSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  const staticMapUrl = useMemo(() => buildStaticMapUrl({
    center: GUELPH_CENTER,
    zoom: mapZoom,
    width: mapSize.width,
    height: mapSize.height,
  }), [mapZoom, mapSize.height, mapSize.width]);

  const markerPoints = useMemo(() => {
    return sortedListings.map((listing) => {
      const coords = listing.latitude != null && listing.longitude != null
        ? { lat: Number(listing.latitude), lng: Number(listing.longitude) }
        : mockCoordinates[listing.id];
      if (!coords) return null;
      const point = projectLngLatToContainer({
        lat: coords.lat,
        lng: coords.lng,
        center: GUELPH_CENTER,
        zoom: mapZoom,
        width: mapSize.width,
        height: mapSize.height,
      });
      return { listing, point };
    }).filter(Boolean) as { listing: ListingDetailResponse; point: { x: number; y: number } }[];
  }, [mapSize.height, mapSize.width, mapZoom, sortedListings]);

  const poiPoints = useMemo(() => {
    return GUELPH_LANDMARKS.filter((landmark) => activePoiTypes.has(landmark.type))
      .map((landmark) => {
        const point = projectLngLatToContainer({
          lat: landmark.lat,
          lng: landmark.lng,
          center: GUELPH_CENTER,
          zoom: mapZoom,
          width: mapSize.width,
          height: mapSize.height,
        });

        if (point.x < -24 || point.x > mapSize.width + 24 || point.y < -24 || point.y > mapSize.height + 24) {
          return null;
        }

        return { landmark, point };
      })
      .filter(Boolean) as { landmark: (typeof GUELPH_LANDMARKS)[number]; point: { x: number; y: number } }[];
  }, [activePoiTypes, mapSize.height, mapSize.width, mapZoom]);

  const togglePoiType = useCallback((type: LandmarkType) => {
    setActivePoiTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-5">
      <div
        className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-white xl:h-[calc(100vh-190px)]"
        style={{ boxShadow: "0 22px 55px rgba(27,45,69,0.08)" }}
      >
        <div className="grid xl:h-full xl:grid-cols-[minmax(0,1.18fr)_430px]">
          <div className="relative min-h-[54vh] bg-[#EDF2EF] xl:h-full">
            <div ref={mapRef} className="absolute inset-0" />
            {staticMapUrl ? (
              <img src={staticMapUrl} alt="Guelph rental map" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(180deg,#EEF4F0_0%,#E2ECE7_100%)]" />
            )}

            <BrowseMapSummary listings={listings} avgRent={avgRent} />
            <MapControls
              onZoomIn={() => setMapZoom((value) => Math.min(16.5, value + 0.8))}
              onZoomOut={() => setMapZoom((value) => Math.max(11.5, value - 0.8))}
            />
            <MapNearbyFilters activeTypes={activePoiTypes} onToggle={togglePoiType} />
            <MapHintCard text="Toggle nearby groceries, gyms, trails, and transit without losing the listing view." />

            <div className="absolute inset-0 z-[5]">
              {poiPoints.map(({ landmark, point }) => {
                const { size, fontSize } = poiPointSize(landmark.type);
                return (
                  <div
                    key={landmark.name}
                    title={landmark.name}
                    className="absolute flex items-center justify-center rounded-full border-2 border-white shadow-[0_3px_12px_rgba(0,0,0,0.14)]"
                    style={{
                      width: size,
                      height: size,
                      left: point.x,
                      top: point.y,
                      transform: "translate(-50%, -50%)",
                      ...poiPointStyle(landmark.type),
                      zIndex: poiZIndex(landmark.type),
                      fontSize,
                    }}
                  >
                    <span>{landmark.emoji}</span>
                  </div>
                );
              })}

              {markerPoints.map(({ listing, point }) => {
                const score = healthScores[listing.id] ?? 0;
                const color = score >= 85 ? "#4ADE80" : score >= 65 ? "#FFB627" : "#E71D36";
                const isSelected = selectedListing?.id === listing.id;
                return (
                  <button
                    key={listing.id}
                    onClick={() => focusListing(listing.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-all"
                    style={{
                      left: point.x,
                      top: point.y,
                      borderColor: color,
                      transform: `translate(-50%, -50%) scale(${isSelected ? 1.08 : 1})`,
                      background: isSelected ? "#1B2D45" : "white",
                      zIndex: isSelected ? 8 : 6,
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
                      <span style={{ fontSize: "11px", fontWeight: 800, color: isSelected ? "white" : "#FF6B35" }}>
                        ${Math.round(Number(listing.rent_per_room))}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

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
              {sortedListings.map((listing) => (
                <ListingRailCard
                  key={listing.id}
                  listing={listing}
                  healthScores={healthScores}
                  isPinned={pinnedIds.includes(listing.id)}
                  isSelected={selectedListing?.id === listing.id}
                  onSelect={focusListing}
                  onTogglePin={onTogglePin}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
