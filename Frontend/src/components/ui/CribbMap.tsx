"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const GUELPH_CENTER = { lat: 43.5305, lng: -80.2262 };
const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";

/* ════════════════════════════════════════════════════════
   Landmark type config — colors & labels
   ════════════════════════════════════════════════════════ */

export const LANDMARK_TYPES: Record<string, { color: string; label: string }> = {
  campus:     { color: "#1B2D45", label: "Campus" },
  grocery:    { color: "#4ADE80", label: "Grocery" },
  gym:        { color: "#2EC4B6", label: "Gym" },
  shopping:   { color: "#FF6B35", label: "Shopping" },
  transit:    { color: "#1B2D45", label: "Transit" },
  park:       { color: "#86EFAC", label: "Parks" },
  recreation: { color: "#2EC4B6", label: "Recreation" },
  food:       { color: "#FFB627", label: "Food & Drink" },
  health:     { color: "#E71D36", label: "Health" },
  library:    { color: "#A78BFA", label: "Library" },
  area:       { color: "#98A3B0", label: "Area" },
};

/* ════════════════════════════════════════════════════════
   Landmark data for Guelph
   ════════════════════════════════════════════════════════ */

export const GUELPH_LANDMARKS = [
  // Campus
  { name: "University of Guelph", lat: 43.5305, lng: -80.2262, emoji: "🎓", type: "campus" },
  { name: "UofG Athletics Centre", lat: 43.5320, lng: -80.2290, emoji: "🏟️", type: "campus" },
  { name: "UofG Library", lat: 43.5310, lng: -80.2265, emoji: "📚", type: "campus" },

  // Grocery
  { name: "Zehrs (Stone Road)", lat: 43.5185, lng: -80.2523, emoji: "🥬", type: "grocery" },
  { name: "Walmart Supercentre", lat: 43.5148, lng: -80.2560, emoji: "🛒", type: "grocery" },
  { name: "Metro (Paisley)", lat: 43.5420, lng: -80.2710, emoji: "🥬", type: "grocery" },
  { name: "FreshCo (Eramosa)", lat: 43.5460, lng: -80.2310, emoji: "🥬", type: "grocery" },
  { name: "Food Basics (Speedvale)", lat: 43.5580, lng: -80.2530, emoji: "🥬", type: "grocery" },
  { name: "Costco Guelph", lat: 43.5080, lng: -80.2740, emoji: "🛒", type: "grocery" },

  // Shopping
  { name: "Stone Road Mall", lat: 43.5195, lng: -80.2490, emoji: "🛍️", type: "shopping" },
  { name: "Canadian Tire", lat: 43.5150, lng: -80.2600, emoji: "🔧", type: "shopping" },
  { name: "Dollarama (Edinburgh)", lat: 43.5230, lng: -80.2430, emoji: "💲", type: "shopping" },

  // Gyms
  { name: "GoodLife Fitness", lat: 43.5460, lng: -80.2340, emoji: "💪", type: "gym" },
  { name: "Movati Athletic", lat: 43.5180, lng: -80.2580, emoji: "💪", type: "gym" },
  { name: "Fit4Less (Edinburgh)", lat: 43.5230, lng: -80.2410, emoji: "💪", type: "gym" },
  { name: "Crunch Fitness", lat: 43.5190, lng: -80.2500, emoji: "💪", type: "gym" },
  { name: "LA Fitness", lat: 43.5120, lng: -80.2650, emoji: "💪", type: "gym" },

  // Transit
  { name: "Guelph Central Station", lat: 43.5464, lng: -80.2559, emoji: "🚌", type: "transit" },

  // Parks & Recreation
  { name: "Royal City Park", lat: 43.5500, lng: -80.2530, emoji: "🌳", type: "park" },
  { name: "Riverside Park", lat: 43.5440, lng: -80.2600, emoji: "🌳", type: "park" },
  { name: "Exhibition Park", lat: 43.5390, lng: -80.2100, emoji: "🌳", type: "park" },
  { name: "South End Rec Centre", lat: 43.5130, lng: -80.2420, emoji: "🏊", type: "recreation" },
  { name: "West End Rec Centre", lat: 43.5370, lng: -80.2780, emoji: "🏊", type: "recreation" },

  // Food & Coffee
  { name: "Downtown Guelph", lat: 43.5464, lng: -80.2489, emoji: "🏙️", type: "area" },
  { name: "The Albion Hotel", lat: 43.5470, lng: -80.2500, emoji: "🍺", type: "food" },
  { name: "Planet Bean Coffee", lat: 43.5467, lng: -80.2475, emoji: "☕", type: "food" },

  // Healthcare
  { name: "Guelph General Hospital", lat: 43.5430, lng: -80.2430, emoji: "🏥", type: "health" },
  { name: "UofG Health Services", lat: 43.5300, lng: -80.2250, emoji: "🏥", type: "health" },

  // Other
  { name: "Guelph Public Library", lat: 43.5470, lng: -80.2520, emoji: "📖", type: "library" },
  { name: "LCBO (Stone Road)", lat: 43.5190, lng: -80.2510, emoji: "🍷", type: "shopping" },
];

/* ════════════════════════════════════════════════════════
   Helper: create a colored dot marker element
   ════════════════════════════════════════════════════════ */

function createLandmarkDot(type: string, isCampus: boolean): HTMLDivElement {
  const el = document.createElement("div");
  const config = LANDMARK_TYPES[type] || LANDMARK_TYPES.area;

  if (isCampus) {
    // Campus keeps the emoji
    el.innerHTML = `<div style="
      width: 32px; height: 32px; background: #1B2D45; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; border: 2.5px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2); cursor: pointer;
    ">🎓</div>`;
  } else {
    el.innerHTML = `<div style="
      width: 12px; height: 12px; background: ${config.color}; border-radius: 50%;
      border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.15);
      cursor: pointer; transition: transform 0.15s;
    " onmouseenter="this.style.transform='scale(1.4)'" onmouseleave="this.style.transform='scale(1)'"></div>`;
  }
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
    <div className="absolute bottom-3 left-3 z-[10] bg-white/95 backdrop-blur-sm rounded-xl shadow-md overflow-hidden" style={{ maxWidth: "220px" }}>
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
                <span
                  className="shrink-0 rounded-full"
                  style={{ width: "8px", height: "8px", background: config.color }}
                />
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
  const [ready, setReady] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    () => new Set(Object.keys(LANDMARK_TYPES))
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

    async function initMap() {
      if (!document.querySelector('link[href*="mapbox-gl"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
        document.head.appendChild(link);
      }

      try {
        const mapboxModule = await import("mapbox-gl");
        const mapboxgl = (mapboxModule as any).default || mapboxModule;
        if (cancelled) return;

        (mapboxgl as any).accessToken = MAPBOX_TOKEN;

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
              const isCampus = lm.type === "campus" && lm.name === "University of Guelph";
              const el = createLandmarkDot(lm.type, isCampus);

              const popup = new (mapboxgl as any).Popup({ offset: isCampus ? 20 : 10, closeButton: false })
                .setHTML(`<div style="font-size: 11px; font-weight: 600; color: #1B2D45; padding: 2px 6px;">${lm.name}</div>`);

              const marker = new (mapboxgl as any).Marker({ element: el })
                .setLngLat([lm.lng, lm.lat])
                .setPopup(popup)
                .addTo(map);

              markersRef.current.push({ marker, type: lm.type });
            });
          }

          setReady(true);
        });

        mapInstance.current = map;
      } catch (err) {
        console.error("Map init failed:", err);
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        try { mapInstance.current.remove(); } catch {}
        mapInstance.current = null;
      }
    };
  }, [lat, lng, zoom, showLandmarks]);

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
    <div className="relative rounded-xl overflow-hidden border border-black/[0.06]" style={{ height }}>
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
      {showLandmarks && ready && (
        <MapLegend activeFilters={activeFilters} onToggle={toggleFilter} />
      )}
    </div>
  );
}