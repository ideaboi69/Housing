"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Expand } from "lucide-react";
import { GOOGLE_MAPS_KEY, GUELPH_CENTER, buildEmbedUrl, loadGoogleMaps } from "@/lib/google-maps";
import {
  GUELPH_LANDMARKS,
  type LandmarkType,
} from "@/lib/guelph-landmarks";

/* ════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════ */

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function propertyMarkerIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="15" fill="#FF6B35" stroke="white" stroke-width="3"/>
      <path d="M27 16c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" transform="translate(0,-3)"/>
      <circle cx="18" cy="13" r="3" fill="none" stroke="white" stroke-width="2.2"/>
    </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    size: 36,
  };
}

/* ════════════════════════════════════════════════════════
   Nearby landmarks list (cheap proximity readout)
   ════════════════════════════════════════════════════════ */

type NearbyRow = { key: string; emoji: string; name: string; distanceKm: number };

function NearbyLandmarksList({ lat, lng }: { lat: number; lng: number }) {
  // Downtown / closest grocery / closest gym from the curated Guelph set.
  // (Campus is shown separately in "Getting to Campus", so it's excluded here.)
  const rows = useMemo<NearbyRow[]>(() => {
    const closestOfType = (type: LandmarkType): NearbyRow | null => {
      const candidate = GUELPH_LANDMARKS
        .filter((lm) => lm.type === type)
        .map((lm) => ({ lm, distanceKm: haversineKm({ lat, lng }, { lat: lm.lat, lng: lm.lng }) }))
        .sort((a, b) => a.distanceKm - b.distanceKm)[0];
      if (!candidate) return null;
      return { key: candidate.lm.name, emoji: candidate.lm.emoji, name: candidate.lm.name, distanceKm: candidate.distanceKm };
    };

    return [
      closestOfType("area"),    // Downtown Guelph
      closestOfType("grocery"), // closest grocer
      closestOfType("gym"),     // closest gym
    ].filter(Boolean) as NearbyRow[];
  }, [lat, lng]);

  if (rows.length === 0) return null;

  return (
    <div className="mt-2.5 space-y-1.5">
      {rows.map((row) => (
        <div
          key={row.key}
          className="flex items-center gap-2 rounded-lg bg-[#FAF8F4] px-2.5 py-1.5"
        >
          <span style={{ fontSize: "13px" }}>{row.emoji}</span>
          <span className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 600 }}>
            {row.name}
          </span>
          <span className="ml-auto shrink-0 text-[#1B2D45]/45" style={{ fontSize: "11px", fontWeight: 700 }}>
            {formatDistance(row.distanceKm)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   CribbMap — detail page map
   ════════════════════════════════════════════════════════ */

interface CribbMapProps {
  lat?: number;
  lng?: number;
  address?: string;
  showLandmarks?: boolean;
  height?: string;
  zoom?: number;
}

export function CribbMap({
  lat,
  lng,
  address,
  showLandmarks = true,
  height = "280px",
  zoom = 14,
}: CribbMapProps) {
  const [expanded, setExpanded] = useState(false);

  const embedUrl = useMemo(
    () => buildEmbedUrl({ lat, lng, address, zoom }),
    [lat, lng, address, zoom]
  );

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  if (!GOOGLE_MAPS_KEY) {
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
      <div
        className="relative rounded-xl overflow-hidden border border-black/[0.06] cursor-pointer group"
        style={{ height }}
        onClick={() => setExpanded(true)}
      >
        {embedUrl ? (
          <iframe
            title={address ? `Map of ${address}` : "Map"}
            src={embedUrl}
            className="w-full h-full pointer-events-none"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="absolute inset-0 bg-[#FAF8F4]" />
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

      {showLandmarks && lat != null && lng != null && (
        <NearbyLandmarksList lat={lat} lng={lng} />
      )}

      {expanded && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => setExpanded(false)}>
          <div className="w-full max-w-[1020px] h-[84vh] bg-white rounded-[28px] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 700 }}>{address || "Location"}</span>
              </div>
              <button onClick={() => setExpanded(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1B2D45]/30 hover:bg-[#1B2D45]/5 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="w-full" style={{ height: "calc(84vh - 52px)" }}>
              <CribbMapExpanded lat={lat} lng={lng} address={address} zoom={zoom} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════
   Expanded modal — Maps JavaScript API, property pin only
   ════════════════════════════════════════════════════════ */

function CribbMapExpanded({
  lat,
  lng,
  address,
  zoom = 15,
}: {
  lat?: number;
  lng?: number;
  address?: string;
  zoom?: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const center = lat != null && lng != null ? { lat, lng } : GUELPH_CENTER;

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    let cancelled = false;
    setReady(false);

    async function init() {
      try {
        const google = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
        });
        mapInstance.current = map;

        if (lat != null && lng != null) {
          const icon = propertyMarkerIcon();
          new google.maps.Marker({
            map,
            position: { lat, lng },
            icon: {
              url: icon.url,
              scaledSize: new google.maps.Size(icon.size, icon.size),
              anchor: new google.maps.Point(icon.size / 2, icon.size / 2),
            },
            zIndex: 1000,
          });
        }

        setReady(true);
      } catch (err) {
        console.error("Google Maps init failed:", err);
      }
    }

    init();

    return () => {
      cancelled = true;
      mapInstance.current = null;
    };
  }, [lat, lng, zoom]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 bg-[#FAF8F4] flex items-center justify-center pointer-events-none">
          <div className="animate-pulse w-10 h-10 rounded-full bg-[#FF6B35]/20" />
        </div>
      )}
      {ready && address && (
        <div className="absolute top-3 left-3 z-[10] rounded-xl bg-white/92 px-3 py-2 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span className="text-[#1B2D45]" style={{ fontSize: "11px", fontWeight: 700 }}>{address}</span>
          </div>
        </div>
      )}
    </div>
  );
}
