"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Pin, X, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { formatPrice, formatPropertyType } from "@/lib/utils";
import { mockHealthScores, mockCoordinates } from "@/lib/mock-data";
import { GUELPH_LANDMARKS } from "@/components/ui/CribbMap";
import type { ListingDetailResponse } from "@/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const GUELPH_CENTER = { lat: 43.5305, lng: -80.2262 };

interface MapViewProps {
  listings: ListingDetailResponse[];
  pinnedIds: number[];
  onTogglePin: (id: number) => void;
}

export function MapView({ listings, pinnedIds, onTogglePin }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const selectedListing = listings.find((l) => l.id === selectedId);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || !MAPBOX_TOKEN) {
      setMapError(true);
      return;
    }

    let cancelled = false;
    let map: any = null;

    async function initMap() {
      try {
        // Load CSS
        if (!document.querySelector('link[href*="mapbox-gl"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
          document.head.appendChild(link);
          // Wait for CSS to load
          await new Promise((resolve) => { link.onload = resolve; setTimeout(resolve, 1000); });
        }

        // Dynamic import with workaround for Next.js SSR
        const mapboxModule = await import("mapbox-gl");
        const mapboxgl = (mapboxModule as any).default || mapboxModule;

        if (cancelled || !mapRef.current) return;

        (mapboxgl as any).accessToken = MAPBOX_TOKEN;

        map = new mapboxgl.Map({
          container: mapRef.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [GUELPH_CENTER.lng, GUELPH_CENTER.lat],
          zoom: 14,
          attributionControl: false,
        });

        map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");

        map.on("load", () => {
          if (cancelled) return;

          // Campus marker
          const campusEl = document.createElement("div");
          campusEl.innerHTML = '<div style="width:36px;height:36px;background:#1B2D45;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.2);">🎓</div>';
          new mapboxgl.Marker({ element: campusEl })
            .setLngLat([GUELPH_CENTER.lng, GUELPH_CENTER.lat])
            .setPopup(new mapboxgl.Popup({ offset: 20, closeButton: false }).setHTML('<div style="font-size:12px;font-weight:600;padding:2px 4px;">University of Guelph</div>'))
            .addTo(map);

          // Landmarks — emoji markers
          GUELPH_LANDMARKS.filter((lm) => lm.type !== "campus").forEach((lm) => {
            const el = document.createElement("div");
            el.innerHTML = '<div style="width:28px;height:28px;background:#1B2D45;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:pointer;">' + lm.emoji + '</div>';
            new mapboxgl.Marker({ element: el })
              .setLngLat([lm.lng, lm.lat])
              .setPopup(new mapboxgl.Popup({ offset: 10, closeButton: false }).setHTML('<div style="font-size:11px;font-weight:600;padding:2px 4px;">' + lm.name + '</div>'))
              .addTo(map);
          });

          // Listing pins
          listings.forEach((listing) => {
            const coords = mockCoordinates[listing.id];
            if (!coords) return;
            const score = mockHealthScores[listing.id] ?? 0;
            const color = score >= 85 ? "#4ADE80" : score >= 65 ? "#FFB627" : "#E71D36";
            const price = Math.round(Number(listing.rent_per_room));
            const el = document.createElement("div");
            el.innerHTML = '<div style="background:white;border-radius:20px;padding:4px 10px;font-size:13px;font-weight:800;color:#FF6B35;box-shadow:0 2px 12px rgba(0,0,0,0.15);border:2px solid ' + color + ';cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px;transition:transform 0.15s;"><span style="width:8px;height:8px;border-radius:50%;background:' + color + ';display:inline-block;"></span>$' + price + '</div>';
            el.addEventListener("click", () => setSelectedId(listing.id));
            new mapboxgl.Marker({ element: el }).setLngLat([coords.lng, coords.lat]).addTo(map);
          });

          setMapReady(true);
        });

        map.on("error", () => {
          if (!cancelled) setMapError(true);
        });

        mapInstance.current = map;
      } catch (err) {
        console.error("Map init failed:", err);
        if (!cancelled) setMapError(true);
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (map) { try { map.remove(); } catch {} }
      mapInstance.current = null;
    };
  }, [listings]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6">
      <div className="relative rounded-xl overflow-hidden border border-black/[0.06]" style={{ height: "600px" }}>
        <div ref={mapRef} className="w-full h-full" />

        {/* Zoom controls */}
        {mapReady && (
          <div className="absolute top-4 right-4 z-[10] flex flex-col gap-1">
            <button onClick={() => mapInstance.current?.zoomIn()} className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"><ZoomIn className="w-4 h-4 text-[#1B2D45]" /></button>
            <button onClick={() => mapInstance.current?.zoomOut()} className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"><ZoomOut className="w-4 h-4 text-[#1B2D45]" /></button>
          </div>
        )}

        {/* Legend */}
        {mapReady && (
          <div className="absolute top-4 left-4 z-[10] bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md">
            <div className="text-[#1B2D45]" style={{ fontSize: "11px", fontWeight: 700 }}>Cribb Score</div>
            <div className="flex items-center gap-3 mt-1.5">
              {[{ color: "#4ADE80", label: "85+" }, { color: "#FFB627", label: "65–84" }, { color: "#E71D36", label: "<65" }].map((item) => (
                <div key={item.label} className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} /><span className="text-[#1B2D45]/50" style={{ fontSize: "10px", fontWeight: 500 }}>{item.label}</span></div>
              ))}
            </div>
          </div>
        )}

        {/* Selected listing card */}
        {selectedListing && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[340px] z-[10] bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Link href={`/browse/${selectedListing.id}`} className="hover:underline"><h3 className="text-[#1B2D45] truncate" style={{ fontSize: "15px", fontWeight: 700 }}>{selectedListing.title}</h3></Link>
                  <p className="text-[#1B2D45]/40 truncate mt-0.5" style={{ fontSize: "12px" }}>{selectedListing.address}</p>
                </div>
                <button onClick={() => setSelectedId(null)} className="ml-2 w-7 h-7 rounded-full bg-[#1B2D45]/5 flex items-center justify-center hover:bg-[#1B2D45]/10 shrink-0"><X className="w-3.5 h-3.5 text-[#1B2D45]/40" /></button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-baseline gap-1"><span className="text-[#FF6B35]" style={{ fontSize: "22px", fontWeight: 800 }}>{formatPrice(Number(selectedListing.rent_per_room))}</span><span className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>/room/mo</span></div>
                <ScoreRing score={mockHealthScores[selectedListing.id] ?? 0} size={40} />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Link href={`/browse/${selectedListing.id}`} className="flex-1 py-2 rounded-lg bg-[#FF6B35] text-white text-center hover:bg-[#e55e2e]" style={{ fontSize: "12px", fontWeight: 600 }}>View Details</Link>
                <button onClick={() => onTogglePin(selectedListing.id)} className={`px-3 py-2 rounded-lg border flex items-center gap-1 ${pinnedIds.includes(selectedListing.id) ? "border-[#FF6B35]/30 bg-[#FF6B35]/[0.08] text-[#FF6B35]" : "border-black/[0.06] text-[#1B2D45]/40"}`} style={{ fontSize: "12px", fontWeight: 600 }}>
                  <Pin className="w-3 h-3" /> {pinnedIds.includes(selectedListing.id) ? "Pinned" : "Pin"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading / Error overlay */}
        {!mapReady && (
          <div className="absolute inset-0 bg-[#FAF8F4] flex items-center justify-center z-[5]">
            <div className="text-center">
              {mapError ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-[#1B2D45]/[0.06] mx-auto mb-3 flex items-center justify-center"><ZoomIn className="w-5 h-5 text-[#1B2D45]/20" /></div>
                  <p className="text-[#1B2D45]/40" style={{ fontSize: "13px", fontWeight: 600 }}>Map couldn&apos;t load</p>
                  <p className="text-[#1B2D45]/25 mt-1" style={{ fontSize: "11px" }}>Try refreshing the page</p>
                </>
              ) : (
                <>
                  <div className="animate-pulse w-10 h-10 rounded-full bg-[#FF6B35]/20 mx-auto mb-3" />
                  <p className="text-[#1B2D45]/30" style={{ fontSize: "13px" }}>Loading map...</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}