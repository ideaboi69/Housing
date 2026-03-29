"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown, Expand } from "lucide-react";
import { GUELPH_CENTER, MAPBOX_STYLE, MAPBOX_TOKEN, loadMapboxGl } from "@/lib/mapbox";
import {
  DEFAULT_DETAIL_LANDMARKS,
  GUELPH_LANDMARKS,
  LANDMARK_TYPES,
} from "@/lib/guelph-landmarks";

/* ════════════════════════════════════════════════════════
   Helper: create a colored dot marker element
   ════════════════════════════════════════════════════════ */

function createLandmarkMarker(emoji: string, isCampus: boolean): HTMLDivElement {
  const el = document.createElement("div");
  const size = isCampus ? 32 : 28;
  const fontSize = isCampus ? 16 : 14;
  const border = isCampus ? 2.5 : 2;
  el.innerHTML = `<div style="
    width: ${size}px; height: ${size}px; background: #1B2D45; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: ${fontSize}px; border: ${border}px solid white;
    box-shadow: 0 2px ${isCampus ? 10 : 8}px rgba(0,0,0,${isCampus ? 0.2 : 0.15}); cursor: pointer;
  ">${emoji}</div>`;
  return el;
}

/* ════════════════════════════════════════════════════════
   Legend component
   ════════════════════════════════════════════════════════ */

function MapLegend({ activeFilters, onToggle }: { activeFilters: Set<string>; onToggle: (type: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  // Unique types that exist in landmarks
  const types = Array.from(new Set(GUELPH_LANDMARKS.map((l) => l.type))).filter((t) => t !== "area");

  return (
    <div className="absolute bottom-3 left-3 z-[10] bg-white/95 backdrop-blur-sm rounded-xl shadow-md overflow-hidden" style={{ maxWidth: "240px" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-black/[0.02] transition-colors"
      >
        <span className="text-[#1B2D45]" style={{ fontSize: "11px", fontWeight: 700 }}>Nearby Places</span>
        <ChevronDown className={`w-3 h-3 text-[#1B2D45]/30 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-3 pb-2.5 flex flex-wrap gap-1">
          {types.map((type) => {
            const config = LANDMARK_TYPES[type];
            if (!config) return null;
            const isActive = activeFilters.has(type);
            return (
              <button
                key={type}
                onClick={() => onToggle(type)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all ${
                  isActive
                    ? "border-[#1B2D45]/15 bg-white"
                    : "border-transparent bg-black/[0.03] opacity-40"
                }`}
                style={{ fontSize: "10px", fontWeight: 600, color: "#1B2D45" }}
              >
                <span>{config.emoji}</span>
                {config.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   CribbMap — reusable map for detail pages
   ════════════════════════════════════════════════════════ */

interface CribbMapProps {
  lat?: number;
  lng?: number;
  address?: string;
  showLandmarks?: boolean;
  height?: string;
  zoom?: number;
}

export function CribbMap({ lat, lng, address, showLandmarks = true, height = "280px", zoom = 14 }: CribbMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    () => new Set(DEFAULT_DETAIL_LANDMARKS)
  );

  const center = lat && lng ? { lat, lng } : GUELPH_CENTER;

  const toggleFilter = (type: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // Show/hide markers based on active filters
  useEffect(() => {
    markersRef.current.forEach(({ marker, type }: { marker: any; type: string }) => {
      const el = marker.getElement();
      if (el) el.style.display = activeFilters.has(type) ? "block" : "none";
    });
  }, [activeFilters]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || !MAPBOX_TOKEN) return;

    let cancelled = false;
    setReady(false);

    async function initMap() {
      try {
        const mapboxgl = await loadMapboxGl();
        if (cancelled) return;

        const map = new (mapboxgl as any).Map({
          container: mapRef.current!,
          style: MAPBOX_STYLE,
          center: [center.lng, center.lat],
          zoom,
          attributionControl: false,
        });

        map.addControl(new (mapboxgl as any).NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new (mapboxgl as any).AttributionControl({ compact: true }), "bottom-right");

        map.on("load", () => {
          if (cancelled) return;

          // Property pin
          if (lat && lng) {
            const el = document.createElement("div");
            el.innerHTML = `<div style="
              width: 36px; height: 36px; background: #FF6B35; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              border: 3px solid white; box-shadow: 0 3px 12px rgba(255,107,53,0.35);
            "><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`;
            new (mapboxgl as any).Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
          }

          // Landmark pins
          if (showLandmarks) {
            markersRef.current = [];

            GUELPH_LANDMARKS.forEach((lm) => {
              const isCampus = lm.type === "campus" && lm.name === "Guelph Campus";
              const el = createLandmarkMarker(lm.emoji, isCampus);

              const popup = new (mapboxgl as any).Popup({ offset: isCampus ? 20 : 10, closeButton: false })
                .setHTML(`<div style="font-size: 11px; font-weight: 600; color: #1B2D45; padding: 2px 6px;">${lm.name}</div>`);

              const marker = new (mapboxgl as any).Marker({ element: el })
                .setLngLat([lm.lng, lm.lat])
                .setPopup(popup)
                .addTo(map);

              markersRef.current.push({ marker, type: lm.type });
            });
          }

          requestAnimationFrame(() => {
            map.resize();
            setReady(true);
          });
        });

        mapInstance.current = map;
        resizeObserverRef.current = new ResizeObserver(() => {
          if (mapInstance.current) {
            mapInstance.current.resize();
          }
        });
        resizeObserverRef.current.observe(mapRef.current!);
      } catch (err) {
        console.error("Map init failed:", err);
      }
    }

    initMap();

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (mapInstance.current) {
        try { mapInstance.current.remove(); } catch {}
        mapInstance.current = null;
      }
    };
  }, [lat, lng, zoom, showLandmarks]);

  const [expanded, setExpanded] = useState(false);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-xl bg-[#FAF8F4] flex items-center justify-center border border-black/[0.06]" style={{ height }}>
        <div className="text-center">
          <MapPin className="w-8 h-8 text-[#1B2D45]/10 mx-auto mb-1" />
          <p className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>{address || "Guelph, ON"}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative rounded-xl overflow-hidden border border-black/[0.06] cursor-pointer group" style={{ height }} onClick={() => setExpanded(true)}>
        <div ref={mapRef} className="w-full h-full" />
        {!ready && (
          <div className="absolute inset-0 bg-[#FAF8F4] flex items-center justify-center">
            <div className="animate-pulse w-8 h-8 rounded-full bg-[#FF6B35]/20" />
          </div>
        )}
        {address && (
          <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[#FF6B35]" />
              <span className="text-[#1B2D45]" style={{ fontSize: "11px", fontWeight: 600 }}>{address}</span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded(true);
          }}
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-[#1B2D45]/75 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          style={{ fontSize: "10px", fontWeight: 700 }}
        >
          <Expand className="h-3 w-3" />
          Expand map
        </button>
      </div>

      {/* Expanded map modal */}
      {expanded && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => setExpanded(false)}>
          <div className="w-full max-w-[900px] h-[80vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{address || "Location"}</span>
              </div>
              <button onClick={() => setExpanded(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1B2D45]/30 hover:bg-[#1B2D45]/5 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="w-full" style={{ height: "calc(80vh - 52px)" }}>
              <CribbMapExpanded
                lat={lat}
                lng={lng}
                showLandmarks={showLandmarks}
                zoom={zoom}
                activeFilters={activeFilters}
                onToggleFilter={toggleFilter}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* Expanded map rendered in modal — separate instance so it fills the modal */
function CribbMapExpanded({
  lat,
  lng,
  showLandmarks = true,
  zoom = 15,
  activeFilters,
  onToggleFilter,
}: {
  lat?: number;
  lng?: number;
  showLandmarks?: boolean;
  zoom?: number;
  activeFilters: Set<string>;
  onToggleFilter: (type: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);
  const center = lat && lng ? { lat, lng } : GUELPH_CENTER;

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || !MAPBOX_TOKEN) return;
    let cancelled = false;

    async function initMap() {
      try {
        const mapboxgl = await loadMapboxGl();
        if (cancelled) return;

        const map = new (mapboxgl as any).Map({
          container: mapRef.current!,
          style: MAPBOX_STYLE,
          center: [center.lng, center.lat],
          zoom,
          attributionControl: false,
        });
        map.addControl(new (mapboxgl as any).NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new (mapboxgl as any).AttributionControl({ compact: true }), "bottom-right");

        map.on("load", () => {
          if (cancelled) return;
          if (lat && lng) {
            const el = document.createElement("div");
            el.innerHTML = '<div style="width:36px;height:36px;background:#FF6B35;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 3px 12px rgba(255,107,53,0.35);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>';
            new (mapboxgl as any).Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
          }
          if (showLandmarks) {
            GUELPH_LANDMARKS.forEach((lm) => {
              const isCampus = lm.type === "campus" && lm.name === "Guelph Campus";
              const el = createLandmarkMarker(lm.emoji, isCampus);
              const popup = new (mapboxgl as any).Popup({ offset: isCampus ? 20 : 16, closeButton: false })
                .setHTML('<div style="font-size:12px;font-weight:600;color:#1B2D45;padding:2px 6px;">' + lm.name + '</div>');
              new (mapboxgl as any).Marker({ element: el }).setLngLat([lm.lng, lm.lat]).setPopup(popup).addTo(map);
            });
          }
          requestAnimationFrame(() => {
            map.resize();
            setReady(true);
          });
        });
        mapInstance.current = map;
        resizeObserverRef.current = new ResizeObserver(() => {
          if (mapInstance.current) {
            mapInstance.current.resize();
          }
        });
        resizeObserverRef.current.observe(mapRef.current!);
      } catch {}
    }
    initMap();
    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (mapInstance.current) { try { mapInstance.current.remove(); } catch {} }
    };
  }, [lat, lng, zoom, showLandmarks]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 bg-[#FAF8F4] flex items-center justify-center">
          <div className="animate-pulse w-10 h-10 rounded-full bg-[#FF6B35]/20" />
        </div>
      )}
      {ready && showLandmarks && (
        <MapLegend activeFilters={activeFilters} onToggle={onToggleFilter} />
      )}
    </div>
  );
}
