/* ════════════════════════════════════════════════════════
   Proximity Labels — "Near Campus" definition
   ════════════════════════════════════════════════════════
   
   Used on listing cards, filters, and detail pages to show
   how far a property is from UofG campus.
   
   Brackets:
   - On campus:    0-5 min walk
   - Near campus:  6-15 min walk
   - Walkable:     16-25 min walk  
   - Bus distance: 26+ min walk (show bus time instead)
*/

export interface ProximityInfo {
  label: string;
  color: string;
  bg: string;
  emoji: string;
}

export type ProximityFilterKey = "on_campus" | "near_campus" | "walkable" | "any_distance";

export function getProximityLabel(walkMinutes: number | null | undefined): ProximityInfo {
  if (walkMinutes == null) {
    return { label: "Distance unknown", color: "#98A3B0", bg: "rgba(152,163,176,0.08)", emoji: "📍" };
  }
  if (walkMinutes <= 5) {
    return { label: "On campus", color: "#4ADE80", bg: "rgba(74,222,128,0.08)", emoji: "🎓" };
  }
  if (walkMinutes <= 15) {
    return { label: "Near campus", color: "#2EC4B6", bg: "rgba(46,196,182,0.08)", emoji: "🚶" };
  }
  if (walkMinutes <= 25) {
    return { label: "Walkable", color: "#FFB627", bg: "rgba(255,182,39,0.08)", emoji: "🚶" };
  }
  return { label: "Bus distance", color: "#1B2D45", bg: "rgba(27,45,69,0.06)", emoji: "🚌" };
}

export function getProximityFromKm(distanceKm: number | null | undefined): ProximityInfo {
  if (distanceKm == null) {
    return getProximityLabel(null);
  }
  // Rough conversion: 1km ≈ 12 min walk
  const walkMinutes = Math.round(distanceKm * 12);
  return getProximityLabel(walkMinutes);
}

export const PROXIMITY_BRACKETS = [
  { label: "On campus", min: 0, max: 5, description: "Under 5 min walk" },
  { label: "Near campus", min: 6, max: 15, description: "6-15 min walk" },
  { label: "Walkable", min: 16, max: 25, description: "16-25 min walk" },
  { label: "Bus distance", min: 26, max: 999, description: "26+ min walk" },
] as const;

export const PROXIMITY_FILTER_OPTIONS = [
  { key: "on_campus", label: "On campus", description: "Up to 5 min walk", maxWalk: 5, maxKm: 0.5 },
  { key: "near_campus", label: "Near campus", description: "Up to 15 min walk", maxWalk: 15, maxKm: 1.5 },
  { key: "walkable", label: "Walkable", description: "Up to 25 min walk", maxWalk: 25, maxKm: 2.5 },
  { key: "any_distance", label: "Any distance", description: "Bus routes and farther", maxWalk: null, maxKm: null },
] as const satisfies ReadonlyArray<{
  key: ProximityFilterKey;
  label: string;
  description: string;
  maxWalk: number | null;
  maxKm: number | null;
}>;

export function getDistanceMaxForProximityFilter(key: ProximityFilterKey | null | undefined): number | undefined {
  if (!key) return undefined;
  return PROXIMITY_FILTER_OPTIONS.find((option) => option.key === key)?.maxKm ?? undefined;
}

export function getMaxWalkForProximityFilter(key: ProximityFilterKey | null | undefined): number | undefined {
  if (!key) return undefined;
  const maxWalk = PROXIMITY_FILTER_OPTIONS.find((option) => option.key === key)?.maxWalk;
  return maxWalk == null ? undefined : maxWalk;
}

export function getProximityFilterFromDistanceMax(distanceMax: number | null | undefined): ProximityFilterKey | null {
  if (distanceMax == null) return null;
  if (distanceMax <= 0.5) return "on_campus";
  if (distanceMax <= 1.5) return "near_campus";
  if (distanceMax <= 2.5) return "walkable";
  return "any_distance";
}
