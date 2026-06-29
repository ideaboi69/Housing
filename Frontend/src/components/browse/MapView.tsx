"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Pin, ZoomIn, ZoomOut, Bed, Bath, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { formatPrice, formatPropertyType } from "@/lib/utils";
import { getProximityLabel } from "@/lib/proximity";
import {
  GOOGLE_MAPS_KEY,
  GUELPH_CENTER,
  loadGoogleMaps,
  projectLngLatToContainer,
} from "@/lib/google-maps";
import type { ListingDetailResponse } from "@/types";

type SortKey = "recommended" | "price_low" | "price_high" | "closest";

interface MapViewProps {
  listings: ListingDetailResponse[];
  healthScores: Record<number, number>;
  pinnedIds: number[];
  onTogglePin: (id: number) => void;
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapZoom, setMapZoom] = useState(13.8);
  const [mapCenter, setMapCenter] = useState(GUELPH_CENTER);
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

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setMapSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

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
      } catch (err) {
        console.error("Google Maps init failed:", err);
      }
    }
    init();

    return () => {
      cancelled = true;
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

  const markerPoints = useMemo(() => {
    return sortedListings.map((listing) => {
      if (listing.latitude == null || listing.longitude == null) return null;
      const coords = { lat: Number(listing.latitude), lng: Number(listing.longitude) };
      const point = projectLngLatToContainer({
        lat: coords.lat,
        lng: coords.lng,
        center: mapCenter,
        zoom: mapZoom,
        width: mapSize.width,
        height: mapSize.height,
      });
      return { listing, point };
    }).filter(Boolean) as { listing: ListingDetailResponse; point: { x: number; y: number } }[];
  }, [mapCenter, mapSize.height, mapSize.width, mapZoom, sortedListings]);

  // Apartment units share a property_id (and coordinates), so a building would
  // otherwise show as several stacked pins. Collapse units into one marker per
  // building, labelled "From $X" with the unit count.
  const buildingMarkers = useMemo(() => {
    const groups = new Map<number, { listings: ListingDetailResponse[]; point: { x: number; y: number } }>();
    for (const { listing, point } of markerPoints) {
      const existing = groups.get(listing.property_id);
      if (existing) existing.listings.push(listing);
      else groups.set(listing.property_id, { listings: [listing], point });
    }
    return [...groups.values()].map(({ listings: group, point }) => {
      const representative = group.reduce((min, l) => (Number(l.rent_per_room) < Number(min.rent_per_room) ? l : min), group[0]);
      return { point, representative, group, count: group.length };
    });
  }, [markerPoints]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-5">
      <div
        className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-white xl:h-[calc(100vh-190px)]"
        style={{ boxShadow: "0 22px 55px rgba(27,45,69,0.08)" }}
      >
        <div className="grid xl:h-full xl:grid-cols-[minmax(0,1.18fr)_430px]">
          <div className="relative min-h-[54vh] bg-[#EDF2EF] xl:h-full">
            <div ref={mapContainerRef} className="absolute inset-0" />

            <BrowseMapSummary listings={listings} avgRent={avgRent} />
            <MapControls
              onZoomIn={() => setMapZoom((value) => Math.min(20, Math.round(value) + 1))}
              onZoomOut={() => setMapZoom((value) => Math.max(8, Math.round(value) - 1))}
            />
            <MapHintCard text="Tap a price pin to preview that listing in the panel beside the map." />

            <div className="pointer-events-none absolute inset-0 z-[5]">
              {buildingMarkers.map(({ representative, group, point, count }) => {
                const score = healthScores[representative.id] ?? 0;
                const color = score >= 85 ? "#4ADE80" : score >= 65 ? "#FFB627" : "#E71D36";
                const isSelected = selectedListing != null && group.some((l) => l.id === selectedListing.id);
                const minRent = Math.round(Math.min(...group.map((l) => Number(l.rent_per_room))));
                const isMulti = count > 1;
                return (
                  <button
                    key={representative.property_id}
                    onClick={() => focusListing(representative.id)}
                    className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-all"
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
                        {isMulti ? `From $${minRent}` : `$${minRent}`}
                      </span>
                      {isMulti && (
                        <span
                          className="rounded-full px-1.5"
                          style={{ fontSize: "9px", fontWeight: 800, background: isSelected ? "rgba(255,255,255,0.2)" : "#1B2D45", color: "white" }}
                        >
                          {count}
                        </span>
                      )}
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
