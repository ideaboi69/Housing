"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Pin, ZoomIn, ZoomOut, Bed, Bath, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { formatPrice, formatPropertyType } from "@/lib/utils";
import { getListingImages, mockCoordinates } from "@/lib/mock-data";
import { getProximityLabel } from "@/lib/proximity";
import { buildStaticMapUrl, GUELPH_CENTER, projectLngLatToContainer } from "@/lib/mapbox";
import type { ListingDetailResponse } from "@/types";

type SortKey = "recommended" | "price_low" | "price_high" | "closest";

interface MapViewProps {
  listings: ListingDetailResponse[];
  healthScores: Record<number, number>;
  pinnedIds: number[];
  onTogglePin: (id: number) => void;
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

            <div className="absolute left-4 top-4 z-[10] rounded-2xl bg-white/92 backdrop-blur-sm px-4 py-3 shadow-md">
              <div className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 800 }}>
                Guelph student rentals
              </div>
              <div className="mt-1 text-[#1B2D45]/45" style={{ fontSize: "11px", fontWeight: 600 }}>
                {listings.length} listings · Avg {formatPrice(avgRent)}/room
              </div>
              <div className="flex items-center gap-3 mt-2">
                {[{ color: "#4ADE80", label: "85+" }, { color: "#FFB627", label: "65-84" }, { color: "#E71D36", label: "<65" }].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-[#1B2D45]/45" style={{ fontSize: "10px", fontWeight: 600 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute right-4 top-4 z-[10] flex flex-col gap-2">
              <button onClick={() => setMapZoom((value) => Math.min(16.5, value + 0.8))} className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50">
                <ZoomIn className="w-4 h-4 text-[#1B2D45]" />
              </button>
              <button onClick={() => setMapZoom((value) => Math.max(11.5, value - 0.8))} className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50">
                <ZoomOut className="w-4 h-4 text-[#1B2D45]" />
              </button>
            </div>

            <div className="absolute inset-0 z-[5]">
              <div
                className="absolute flex items-center justify-center rounded-full border-[3px] border-white bg-[#1B2D45] shadow-[0_3px_12px_rgba(0,0,0,0.2)]"
                style={{ width: 38, height: 38, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
              >
                <span style={{ fontSize: "18px" }}>🎓</span>
              </div>

              {markerPoints.map(({ listing, point }) => {
                const score = healthScores[listing.id] ?? 0;
                const color = score >= 85 ? "#4ADE80" : score >= 65 ? "#FFB627" : "#E71D36";
                const isSelected = selectedListing?.id === listing.id;
                return (
                  <button
                    key={listing.id}
                    onClick={() => focusListing(listing.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white px-3 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-all"
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
                      <span style={{ fontSize: "12px", fontWeight: 800, color: isSelected ? "white" : "#FF6B35" }}>
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
