const MAPBOX_CSS_HREF = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
export const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";
export const GUELPH_CENTER = { lat: 43.5305, lng: -80.2262 };

let cssLoadPromise: Promise<void> | null = null;

export async function ensureMapboxCss() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[href="${MAPBOX_CSS_HREF}"]`)) {
    return;
  }
  if (!cssLoadPromise) {
    cssLoadPromise = new Promise((resolve) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = MAPBOX_CSS_HREF;
      link.onload = () => resolve();
      link.onerror = () => resolve();
      document.head.appendChild(link);
      setTimeout(resolve, 1000);
    });
  }
  await cssLoadPromise;
}

export async function loadMapboxGl() {
  await ensureMapboxCss();
  const mapboxModule = await import("mapbox-gl");
  const mapboxgl = (mapboxModule as any).default || mapboxModule;
  (mapboxgl as any).accessToken = MAPBOX_TOKEN;
  return mapboxgl as any;
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
  if (!MAPBOX_TOKEN) return null;
  const safeWidth = Math.max(320, Math.min(1280, Math.round(width)));
  const safeHeight = Math.max(240, Math.min(1280, Math.round(height)));
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${center.lng},${center.lat},${zoom},0/${safeWidth}x${safeHeight}@2x?access_token=${MAPBOX_TOKEN}`;
}

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
  const tileSize = 512;
  const scale = tileSize * 2 ** zoom;

  const project = (latitude: number, longitude: number) => {
    const sin = Math.sin((latitude * Math.PI) / 180);
    const x = ((longitude + 180) / 360) * scale;
    const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
    return { x, y };
  };

  const centerPoint = project(center.lat, center.lng);
  const point = project(lat, lng);

  return {
    x: width / 2 + (point.x - centerPoint.x),
    y: height / 2 + (point.y - centerPoint.y),
  };
}
