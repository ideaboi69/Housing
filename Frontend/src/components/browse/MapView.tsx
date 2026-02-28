"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, Pin, X, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { formatPrice, formatPropertyType } from "@/lib/utils";
import { mockHealthScores, mockCoordinates } from "@/lib/mock-data";
import type { ListingDetailResponse } from "@/types";

// UofG campus center
const GUELPH_CENTER = { lat: 43.5305, lng: -80.2262 };

interface MapViewProps {
  listings: ListingDetailResponse[];
  pinnedIds: number[];
  onTogglePin: (id: number) => void;
}

export function MapView({ listings, pinnedIds, onTogglePin }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const selectedListing = listings.find((l) => l.id === selectedId);

  // Load Leaflet dynamically (client-side only)
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // Add Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default;

      // Fix default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (leafletMap.current) return; // Already initialized

      const map = L.map(mapRef.current!, {
        center: [GUELPH_CENTER.lat, GUELPH_CENTER.lng],
        zoom: 14,
        zoomControl: false,
      });

      // Use CartoDB Voyager tiles — clean, modern look, free
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      // UofG campus marker
      const campusIcon = L.divIcon({
        html: `<div style="
          width: 32px; height: 32px; background: #1B2D45; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">🎓</div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([43.5305, -80.2262], { icon: campusIcon })
        .addTo(map)
        .bindTooltip("University of Guelph", {
          permanent: false,
          direction: "top",
          offset: [0, -16],
        });

      // Add listing markers
      listings.forEach((listing) => {
        const coords = mockCoordinates[listing.id];
        if (!coords) return;

        const score = mockHealthScores[listing.id] ?? 0;
        const color = score >= 85 ? "#4ADE80" : score >= 65 ? "#FFB627" : "#E71D36";
        const price = Math.round(Number(listing.rent_per_room));

        const icon = L.divIcon({
          html: `<div style="
            background: white; border-radius: 20px; padding: 4px 10px;
            font-size: 13px; font-weight: 800; color: #FF6B35;
            box-shadow: 0 2px 12px rgba(0,0,0,0.15);
            border: 2px solid ${color};
            cursor: pointer; white-space: nowrap;
            display: flex; align-items: center; gap: 4px;
            transition: transform 0.15s ease;
          " class="listing-pin" data-id="${listing.id}">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; display: inline-block;"></span>
            $${price}
          </div>`,
          className: "",
          iconSize: [80, 30],
          iconAnchor: [40, 15],
        });

        const marker = L.marker([coords.lat, coords.lng], { icon }).addTo(map);

        marker.on("click", () => {
          setSelectedId(listing.id);
        });
      });

      leafletMap.current = map;
      setMapReady(true);
    };

    loadLeaflet();

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [listings]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6">
      <div className="relative rounded-xl overflow-hidden border border-black/[0.06]" style={{ height: "600px" }}>
        {/* Map container */}
        <div ref={mapRef} className="w-full h-full" />

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
          <button
            onClick={() => leafletMap.current?.zoomIn()}
            className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-[#1B2D45]" />
          </button>
          <button
            onClick={() => leafletMap.current?.zoomOut()}
            className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ZoomOut className="w-4 h-4 text-[#1B2D45]" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md">
          <div className="text-[#1B2D45]" style={{ fontSize: "11px", fontWeight: 700 }}>Cribb Score</div>
          <div className="flex items-center gap-3 mt-1.5">
            {[
              { color: "#4ADE80", label: "85+" },
              { color: "#FFB627", label: "65–84" },
              { color: "#E71D36", label: "<65" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                <span className="text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected listing card */}
        {selectedListing && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[340px] z-[1000] bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Link href={`/browse/${selectedListing.id}`} className="hover:underline">
                    <h3 className="text-[#1B2D45] truncate" style={{ fontSize: "15px", fontWeight: 700 }}>
                      {selectedListing.title}
                    </h3>
                  </Link>
                  <p className="text-[#1B2D45]/40 truncate mt-0.5" style={{ fontSize: "12px" }}>
                    {selectedListing.address}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="ml-2 w-7 h-7 rounded-full bg-[#1B2D45]/5 flex items-center justify-center hover:bg-[#1B2D45]/10 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-[#1B2D45]/40" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-[#FF6B35]" style={{ fontSize: "22px", fontWeight: 800 }}>
                    {formatPrice(Number(selectedListing.rent_per_room))}
                  </span>
                  <span className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>/room/mo</span>
                </div>
                <ScoreRing score={mockHealthScores[selectedListing.id] ?? 0} size={40} />
              </div>

              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                <span className="bg-[#1B2D45]/5 text-[#1B2D45]/55 px-2 py-0.5 rounded" style={{ fontSize: "10px", fontWeight: 500 }}>
                  {formatPropertyType(selectedListing.property_type)}
                </span>
                <span className="bg-[#1B2D45]/5 text-[#1B2D45]/55 px-2 py-0.5 rounded" style={{ fontSize: "10px", fontWeight: 500 }}>
                  {selectedListing.total_rooms} bed
                </span>
                {selectedListing.walk_time_minutes && (
                  <span className="bg-[#1B2D45]/5 text-[#1B2D45]/55 px-2 py-0.5 rounded" style={{ fontSize: "10px", fontWeight: 500 }}>
                    🚶 {selectedListing.walk_time_minutes} min
                  </span>
                )}
                {selectedListing.is_furnished && (
                  <span className="bg-[#FF6B35]/[0.06] text-[#FF6B35]/70 px-2 py-0.5 rounded border border-[#FF6B35]/10" style={{ fontSize: "10px", fontWeight: 500 }}>
                    Furnished
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Link
                  href={`/browse/${selectedListing.id}`}
                  className="flex-1 py-2 rounded-lg bg-[#FF6B35] text-white text-center hover:bg-[#e55e2e] transition-all"
                  style={{ fontSize: "12px", fontWeight: 600 }}
                >
                  View Details
                </Link>
                <button
                  onClick={() => onTogglePin(selectedListing.id)}
                  className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-1 ${
                    pinnedIds.includes(selectedListing.id)
                      ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.08] text-[#FF6B35]"
                      : "border-black/[0.06] text-[#1B2D45]/40 hover:border-[#FF6B35]/20"
                  }`}
                  style={{ fontSize: "12px", fontWeight: 600 }}
                >
                  <Pin className="w-3 h-3" />
                  {pinnedIds.includes(selectedListing.id) ? "Pinned" : "Pin"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {!mapReady && (
          <div className="absolute inset-0 bg-[#FAF8F4] flex items-center justify-center z-[999]">
            <div className="text-center">
              <div className="animate-pulse w-10 h-10 rounded-full bg-[#FF6B35]/20 mx-auto mb-3" />
              <p className="text-[#1B2D45]/30" style={{ fontSize: "13px" }}>Loading map...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
