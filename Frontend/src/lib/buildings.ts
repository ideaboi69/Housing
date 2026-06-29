import type { ListingDetailResponse } from "@/types";

/**
 * Apartment buildings are shown as a single browse card that collapses all of
 * the building's unit-type listings (which share one `property_id`). Houses,
 * rooms and townhouses are shown as individual listing cards, exactly as before.
 *
 * A unit's monthly rent is its `rent_total` (the backend stores the unit price
 * there for apartments). Beds/baths come from the unit-level `beds`/`baths`
 * fields, falling back to the property's `total_rooms`/`bathrooms` for older
 * apartment rows that predate the unit fields.
 */

export interface BuildingGroup {
  propertyId: number;
  title: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  coverImage?: string;
  priceMin: number;
  priceMax: number;
  bedMin: number | null;
  bedMax: number | null;
  bathMin: number | null;
  bathMax: number | null;
  unitCount: number;
  listings: ListingDetailResponse[];
  // representative fields (from the cheapest unit) for sorting / map / facts
  walk_time_minutes: number | null;
  drive_time_minutes: number | null;
  bus_time_minutes: number | null;
  distance_to_campus_km: number | null;
  is_furnished: boolean;
  has_parking: boolean;
  has_laundry: boolean;
  utilities_included: boolean;
}

export type BrowseItem =
  | { kind: "listing"; listing: ListingDetailResponse }
  | { kind: "building"; building: BuildingGroup };

function unitBeds(l: ListingDetailResponse): number | null {
  if (l.beds != null) return Number(l.beds);
  if (l.total_rooms != null) return Number(l.total_rooms);
  return null;
}

function unitBaths(l: ListingDetailResponse): number | null {
  if (l.baths != null) return Number(l.baths);
  if (l.bathrooms != null) return Number(l.bathrooms);
  return null;
}

function unitRent(l: ListingDetailResponse): number {
  // Apartment unit monthly rent lives in rent_total; fall back to rent_per_room.
  return Number(l.rent_total || l.rent_per_room || 0);
}

export function isApartment(l: ListingDetailResponse): boolean {
  return l.property_type === "apartment";
}

function toBuildingGroup(listings: ListingDetailResponse[]): BuildingGroup {
  const sorted = [...listings].sort((a, b) => unitRent(a) - unitRent(b));
  const cheapest = sorted[0];
  const rents = sorted.map(unitRent).filter((r) => r > 0);
  const beds = sorted.map(unitBeds).filter((b): b is number => b != null);
  const baths = sorted.map(unitBaths).filter((b): b is number => b != null);
  const coverImage =
    sorted.map((l) => l.images?.[0]?.image_url).find(Boolean) ?? undefined;

  return {
    propertyId: Number(cheapest.property_id),
    title: cheapest.title,
    address: cheapest.address,
    latitude: cheapest.latitude ?? null,
    longitude: cheapest.longitude ?? null,
    coverImage,
    priceMin: rents.length ? Math.min(...rents) : 0,
    priceMax: rents.length ? Math.max(...rents) : 0,
    bedMin: beds.length ? Math.min(...beds) : null,
    bedMax: beds.length ? Math.max(...beds) : null,
    bathMin: baths.length ? Math.min(...baths) : null,
    bathMax: baths.length ? Math.max(...baths) : null,
    unitCount: sorted.length,
    listings: sorted,
    walk_time_minutes: cheapest.walk_time_minutes ?? null,
    drive_time_minutes: cheapest.drive_time_minutes ?? null,
    bus_time_minutes: cheapest.bus_time_minutes ?? null,
    distance_to_campus_km: cheapest.distance_to_campus_km ?? null,
    is_furnished: !!cheapest.is_furnished,
    has_parking: !!cheapest.has_parking,
    has_laundry: !!cheapest.has_laundry,
    utilities_included: !!cheapest.utilities_included,
  };
}

/**
 * Collapse a flat list of listings into browse items, preserving the original
 * order. Apartments collapse into one building card per `property_id` (placed
 * where the building's first unit appeared); everything else stays a listing.
 */
export function groupBrowseItems(listings: ListingDetailResponse[]): BrowseItem[] {
  const buildingUnits = new Map<number, ListingDetailResponse[]>();
  for (const l of listings) {
    if (!isApartment(l)) continue;
    const pid = Number(l.property_id);
    const arr = buildingUnits.get(pid) ?? [];
    arr.push(l);
    buildingUnits.set(pid, arr);
  }

  const emittedBuildings = new Set<number>();
  const items: BrowseItem[] = [];

  for (const l of listings) {
    if (isApartment(l)) {
      const pid = Number(l.property_id);
      if (emittedBuildings.has(pid)) continue;
      emittedBuildings.add(pid);
      items.push({ kind: "building", building: toBuildingGroup(buildingUnits.get(pid)!) });
    } else {
      items.push({ kind: "listing", listing: l });
    }
  }

  return items;
}
