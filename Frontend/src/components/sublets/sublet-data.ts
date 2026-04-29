import { mockSubletDetails } from "@/lib/mock-sublets";
import type { SubletListResponse } from "@/types";

/* ════════════════════════════════════════════════════════
   Sublet Types, Mock Data & Helpers
   ════════════════════════════════════════════════════════ */

export interface SubletListing {
  id: string;
  listing_id?: number;
  title: string;
  street: string;
  coverImage?: string;
  subletPrice: number;
  originalPrice: number;
  healthScore: number;
  verified: boolean;
  posterType: string;
  posterIsStudent: boolean;
  availableMonths: boolean[]; // [Jan ... Dec]
  neighborhood: string;
  furnished: boolean;
  negotiablePrice: boolean;
  flexibleDates: boolean;
  roommatesStaying: number | null;
  roommateDesc: string | null;
  bedsAvailable: number;
  bedsTotal: number;
  distance: string;
  walkTime: string;
  amenities: string[];
  views: number;
  saves: number;
  rotation: number;
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function isMockSubletId(id: string): boolean {
  return /^s\d+$/i.test(id);
}

function expandMockAvailability(availableMonths: boolean[]): boolean[] {
  const fullYear = Array.from({ length: 12 }, () => false);
  const mockStartMonthIndex = 4; // May
  availableMonths.forEach((available, index) => {
    fullYear[mockStartMonthIndex + index] = available;
  });
  return fullYear;
}

function inferSubletOccupancy(options: {
  bedsTotal: number;
  roomType?: string | null;
  entirePlace?: boolean | null;
  privateRoom?: boolean | null;
  roommatesStaying?: boolean | null;
}) {
  const { bedsTotal, roomType, entirePlace, privateRoom, roommatesStaying } = options;

  if (entirePlace) {
    return {
      bedsAvailable: bedsTotal,
      roommatesStaying: null as number | null,
      roommateDesc: null as string | null,
    };
  }

  const hasRoommatesStaying = Boolean(roommatesStaying);
  const inferredBedsAvailable = privateRoom || roomType === "private" || hasRoommatesStaying ? 1 : bedsTotal;
  const inferredRoommatesStaying = hasRoommatesStaying ? Math.max(0, bedsTotal - inferredBedsAvailable) : null;

  return {
    bedsAvailable: inferredBedsAvailable,
    roommatesStaying: inferredRoommatesStaying,
    roommateDesc:
      inferredRoommatesStaying && inferredRoommatesStaying > 0
        ? "Roommates staying during the sublet term"
        : null,
  };
}

function mapMockDetailToListing(
  detail: (typeof mockSubletDetails)[number],
  index: number
): SubletListing {
  return {
    id: detail.id,
    listing_id: detail.listing_id,
    title: detail.title,
    street: detail.street,
    coverImage: detail.images[0] || "/demo/listings/house.jpg",
    subletPrice: detail.subletPrice,
    originalPrice: detail.originalPrice,
    healthScore: detail.healthScore,
    verified: detail.verified,
    posterType: detail.posterType,
    posterIsStudent: detail.posterIsStudent,
    availableMonths: expandMockAvailability(detail.availableMonths),
    neighborhood: detail.neighborhood,
    furnished: detail.is_furnished,
    negotiablePrice: detail.negotiablePrice,
    flexibleDates: detail.flexibleDates,
    roommatesStaying: detail.roommatesStaying,
    roommateDesc: detail.roommateDesc,
    bedsAvailable: detail.bedsAvailable,
    bedsTotal: detail.bedsTotal,
    distance: `${detail.distanceKm.toFixed(1)} km`,
    walkTime: `${detail.walkTime} min`,
    amenities: [
      detail.utilities_included ? "Utilities Incl." : null,
      detail.has_laundry ? "Laundry" : null,
      detail.has_parking ? "Parking" : null,
      detail.has_wifi ? "WiFi" : null,
      detail.has_dishwasher ? "Dishwasher" : null,
      detail.has_air_conditioning ? "A/C" : null,
      detail.has_gym ? "Gym" : null,
      detail.has_backyard ? "Backyard" : null,
    ].filter(Boolean) as string[],
    views: detail.views,
    saves: detail.saves,
    rotation: [-2.2, 1.5, -0.8, 2.1, -1.4, 0.6][index] ?? (index % 2 === 0 ? -1.2 : 1.2),
  };
}

export const subletListings: SubletListing[] = mockSubletDetails.map(mapMockDetailToListing);

export function getScoreLabel(score: number) {
  if (score >= 85) return "Great Match";
  if (score >= 65) return "Good Option";
  return "Review First";
}

export const filterOptions = [
  { label: "Furnished 🛋️", key: "furnished" },
  { label: "Negotiable 💬", key: "negotiable" },
  { label: "Verified ✓", key: "verified" },
  { label: "Private Room 🚪", key: "private" },
  { label: "Entire Place 🏠", key: "entire" },
  { label: "Parking 🅿️", key: "parking" },
];

export type SubletViewMode = "board" | "grid" | "map";

export type SubletCellValue = string | number | boolean | null | undefined;

export function getSubletBestIndex(values: SubletCellValue[], fn: "lowest" | "highest"): number[] {
  const nums = values.map((v) => (typeof v === "number" ? v : null));
  const valid = nums.filter((n): n is number => n !== null);
  if (valid.length === 0) return [];
  const target = fn === "lowest" ? Math.min(...valid) : Math.max(...valid);
  return nums.reduce<number[]>((acc, n, i) => (n === target ? [...acc, i] : acc), []);
}

export function parseSubletDistance(distance: string): number | null {
  const m = distance.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

export function parseSubletWalkTime(walkTime: string): number | null {
  const m = walkTime.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export function generateSubletCompareSummary(listings: SubletListing[]): string {
  if (listings.length < 2) return "";
  const cheapest = listings.reduce((a, b) => (a.subletPrice < b.subletPrice ? a : b));
  const bestScore = listings.reduce((a, b) => (a.healthScore > b.healthScore ? a : b));
  const parts: string[] = [];
  parts.push(`${cheapest.title} is the most affordable at $${cheapest.subletPrice}/mo.`);
  if (bestScore.id !== cheapest.id) {
    parts.push(`${bestScore.title} has the highest Health Score (${bestScore.healthScore}).`);
  }
  const furnished = listings.filter((l) => l.furnished);
  if (furnished.length > 0 && furnished.length < listings.length) {
    parts.push(`${furnished.length} of ${listings.length} options come furnished.`);
  }
  return parts.join(" ");
}

export function mapApiSubletToListing(sublet: SubletListResponse): SubletListing {
  const startMonth = new Date(sublet.sublet_start_date).getMonth();
  const endMonth = new Date(sublet.sublet_end_date).getMonth();
  const availableMonths = MONTHS.map((_, index) => index >= startMonth && index <= endMonth);
  const distance = Number(sublet.distance_to_campus_km ?? 0);
  const originalPrice = Math.round(Number(sublet.rent_per_month) * 1.18);
  const walkTime = Number(sublet.walk_time_minutes ?? 0);
  const bedsTotal = Number(sublet.total_rooms ?? 1);
  const terms = sublet.terms;
  const occupancy = inferSubletOccupancy({
    bedsTotal,
    roomType: sublet.room_type,
    entirePlace: terms?.entire_place,
    privateRoom: terms?.private_room,
    roommatesStaying: terms?.roommates_staying,
  });

  const amenities = [
    sublet.is_furnished ? "Furnished" : null,
    sublet.utilities_included ? "Utilities Incl." : null,
    sublet.has_parking ? "Parking" : null,
    sublet.has_laundry ? "Laundry" : null,
    sublet.has_wifi ? "WiFi" : null,
    sublet.pet_policy === "allowed" ? "Pets Allowed" : sublet.pet_policy === "case_by_case" ? "Pets Case-by-case" : null,
  ].filter(Boolean) as string[];

  const neighborhood =
    distance <= 0.7
      ? "Campus"
      : distance <= 1.5
        ? "Near Campus"
        : distance <= 2.4
          ? "Stone Road"
          : "Guelph";

  return {
    id: String(sublet.id),
    title: sublet.title,
    street: sublet.address.split(",")[0]?.trim() || sublet.address,
    coverImage: sublet.primary_image || sublet.images?.[0]?.image_url || "/demo/listings/house.jpg",
    subletPrice: Number(sublet.rent_per_month),
    originalPrice,
    healthScore: Math.min(
      96,
      70
        + (distance <= 0.7 ? 12 : distance <= 1.4 ? 7 : 3)
        + (sublet.is_furnished ? 4 : 0)
        + (sublet.utilities_included ? 3 : 0)
        + (sublet.has_laundry ? 2 : 0)
        + (sublet.has_wifi ? 2 : 0)
    ),
    verified: false,
    posterType: sublet.posted_by || "Student poster",
    posterIsStudent: true,
    availableMonths,
    neighborhood,
    furnished: Boolean(sublet.is_furnished),
    negotiablePrice: Boolean(terms?.negotiable_price),
    flexibleDates: Boolean(terms?.flexible_dates),
    roommatesStaying: occupancy.roommatesStaying,
    roommateDesc: occupancy.roommateDesc,
    bedsAvailable: occupancy.bedsAvailable,
    bedsTotal,
    distance: `${distance.toFixed(1)} km`,
    walkTime: `${walkTime} min`,
    amenities,
    views: 0,
    saves: 0,
    rotation: Number(sublet.id) % 2 === 0 ? 1.2 : -1.2,
  };
}
