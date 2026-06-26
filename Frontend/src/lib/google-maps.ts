export const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";
export const GUELPH_CENTER = { lat: 43.5305, lng: -80.2262 };

// University Centre — the practical "to campus" destination students reference.
export const UNIVERSITY_CENTRE = { lat: 43.5327, lng: -80.2261 };

// Loose bounding box around the city of Guelph — used to bias Places Autocomplete.
export const GUELPH_BOUNDS = {
  south: 43.48,
  west: -80.31,
  north: 43.58,
  east: -80.16,
};

declare global {
  interface Window {
    google?: any;
    __cribbGoogleMapsCb?: () => void;
  }
}

let loaderPromise: Promise<any> | null = null;

export async function loadGoogleMaps(libraries: string[] = []): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("Google Maps can only be loaded in the browser");
  }
  if (window.google?.maps) return window.google;
  if (!GOOGLE_MAPS_KEY) {
    throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_KEY");
  }

  if (!loaderPromise) {
    loaderPromise = new Promise((resolve, reject) => {
      const callbackName = "__cribbGoogleMapsCb";
      window[callbackName] = () => {
        resolve(window.google);
        delete window[callbackName];
      };

      const libs = libraries.length ? `&libraries=${libraries.join(",")}` : "";
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}${libs}&callback=${callbackName}&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        loaderPromise = null;
        reject(new Error("Failed to load Google Maps JS API"));
      };
      document.head.appendChild(script);
    });
  }

  return loaderPromise;
}

export function buildEmbedUrl({
  lat,
  lng,
  address,
  zoom = 15,
}: {
  lat?: number;
  lng?: number;
  address?: string;
  zoom?: number;
}): string | null {
  if (!GOOGLE_MAPS_KEY) return null;

  if (lat != null && lng != null) {
    const q = encodeURIComponent(address ? `${address} @${lat},${lng}` : `${lat},${lng}`);
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=${q}&zoom=${zoom}`;
  }
  if (address) {
    const q = encodeURIComponent(address);
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=${q}&zoom=${zoom}`;
  }
  return `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_KEY}&center=${GUELPH_CENTER.lat},${GUELPH_CENTER.lng}&zoom=${zoom}`;
}

export function buildStaticMapUrl({
  center,
  zoom,
  width,
  height,
}: {
  center: { lat: number; lng: number };
  zoom: number;
  width: number;
  height: number;
}) {
  if (!GOOGLE_MAPS_KEY) return null;
  const safeWidth = Math.max(320, Math.min(1280, Math.round(width)));
  const safeHeight = Math.max(240, Math.min(1280, Math.round(height)));
  const safeZoom = Math.round(zoom);
  return `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${safeZoom}&size=${safeWidth}x${safeHeight}&scale=2&maptype=roadmap&key=${GOOGLE_MAPS_KEY}`;
}

/**
 * Web Mercator projection at 256px tiles (Google Maps convention).
 * Lets us position absolute HTML overlays on top of a live Google Map by
 * sharing its center+zoom — the math matches what Google renders.
 */
export function projectLngLatToContainer({
  lat,
  lng,
  center,
  zoom,
  width,
  height,
}: {
  lat: number;
  lng: number;
  center: { lat: number; lng: number };
  zoom: number;
  width: number;
  height: number;
}) {
  const tileSize = 256;
  const scale = tileSize * 2 ** zoom;

  const project = (latitude: number, longitude: number) => {
    const sin = Math.sin((latitude * Math.PI) / 180);
    const clampedSin = Math.max(-0.9999, Math.min(0.9999, sin));
    const x = ((longitude + 180) / 360) * scale;
    const y = (0.5 - Math.log((1 + clampedSin) / (1 - clampedSin)) / (4 * Math.PI)) * scale;
    return { x, y };
  };

  const centerPoint = project(center.lat, center.lng);
  const point = project(lat, lng);

  return {
    x: width / 2 + (point.x - centerPoint.x),
    y: height / 2 + (point.y - centerPoint.y),
  };
}
