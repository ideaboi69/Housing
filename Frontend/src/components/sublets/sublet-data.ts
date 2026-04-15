/* ════════════════════════════════════════════════════════
   Sublet Types, Mock Data & Helpers
   Extracted from sublets/page.tsx for maintainability.
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

export const subletListings: SubletListing[] = [
  {
    id: "s1", listing_id: 1001, title: "Furnished Room in 4BR House", street: "78 College Ave W",
    coverImage: "/demo/listings/townhouse.jpg",
    subletPrice: 550, originalPrice: 720, healthScore: 91, verified: true,
    posterType: "4th year, Engineering", posterIsStudent: true,
    availableMonths: [false, false, false, false, true, true, true, false, false, false, false, false], neighborhood: "Campus",
    furnished: true, negotiablePrice: true, flexibleDates: false,
    roommatesStaying: 2, roommateDesc: "2 upper-year science students staying for summer",
    bedsAvailable: 1, bedsTotal: 4, distance: "0.3 km", walkTime: "4 min",
    amenities: ["Utilities Incl.", "Laundry", "Backyard"], views: 89, saves: 14, rotation: -2.2,
  },
  {
    id: "s2", listing_id: 1002, title: "Entire 2BR Apartment", street: "155 Gordon St",
    coverImage: "/demo/listings/apartment.jpg",
    subletPrice: 1100, originalPrice: 1400, healthScore: 86, verified: true,
    posterType: "Property Manager", posterIsStudent: false,
    availableMonths: [false, false, false, false, true, true, true, true, false, false, false, false], neighborhood: "Stone Road",
    furnished: true, negotiablePrice: true, flexibleDates: false,
    roommatesStaying: null, roommateDesc: null,
    bedsAvailable: 2, bedsTotal: 2, distance: "1.2 km", walkTime: "14 min",
    amenities: ["Parking", "Dishwasher", "A/C"], views: 203, saves: 31, rotation: 1.5,
  },
  {
    id: "s3", listing_id: 1003, title: "Private Room near Campus", street: "42 Suffolk St W",
    coverImage: "/demo/listings/studio.jpg",
    subletPrice: 480, originalPrice: 680, healthScore: 68, verified: false,
    posterType: "3rd year, Arts", posterIsStudent: true,
    availableMonths: [false, false, false, false, true, true, true, false, false, false, false, false], neighborhood: "Campus",
    furnished: false, negotiablePrice: false, flexibleDates: false,
    roommatesStaying: 1, roommateDesc: "1 grad student staying for research term",
    bedsAvailable: 1, bedsTotal: 3, distance: "0.5 km", walkTime: "6 min",
    amenities: ["Laundry", "WiFi"], views: 47, saves: 5, rotation: -0.8,
  },
  {
    id: "s4", listing_id: 1004, title: "Studio Apartment Downtown", street: "88 Macdonell St",
    coverImage: "/demo/listings/house.jpg",
    subletPrice: 700, originalPrice: 950, healthScore: 82, verified: true,
    posterType: "Landlord", posterIsStudent: false,
    availableMonths: [false, false, false, false, false, true, true, true, false, false, false, false], neighborhood: "Downtown",
    furnished: false, negotiablePrice: false, flexibleDates: true,
    roommatesStaying: null, roommateDesc: null,
    bedsAvailable: 1, bedsTotal: 1, distance: "1.8 km", walkTime: "22 min",
    amenities: ["A/C", "Gym", "Utilities Incl."], views: 134, saves: 22, rotation: 2.1,
  },
  {
    id: "s5", listing_id: 1005, title: "Room in Townhouse", street: "31 Grange St",
    coverImage: "/demo/listings/townhouse.jpg",
    subletPrice: 450, originalPrice: 640, healthScore: 64, verified: false,
    posterType: "2nd year, Business", posterIsStudent: true,
    availableMonths: [false, false, false, false, true, true, false, false, false, false, false, false], neighborhood: "South End",
    furnished: true, negotiablePrice: false, flexibleDates: true,
    roommatesStaying: 2, roommateDesc: "2 upper-year kinesiology students staying",
    bedsAvailable: 1, bedsTotal: 4, distance: "2.1 km", walkTime: "26 min",
    amenities: ["Parking", "Backyard"], views: 28, saves: 3, rotation: -1.4,
  },
  {
    id: "s6", listing_id: 1006, title: "Master Bedroom in 5BR House", street: "62 Dean Ave",
    coverImage: "/demo/listings/house.jpg",
    subletPrice: 500, originalPrice: 600, healthScore: 88, verified: true,
    posterType: "4th year, CompSci", posterIsStudent: true,
    availableMonths: [false, false, false, false, true, true, true, true, false, false, false, false], neighborhood: "Campus",
    furnished: true, negotiablePrice: true, flexibleDates: true,
    roommatesStaying: 3, roommateDesc: "3 engineering students staying for internships",
    bedsAvailable: 1, bedsTotal: 5, distance: "0.4 km", walkTime: "5 min",
    amenities: ["Utilities Incl.", "Laundry", "WiFi", "Backyard"], views: 156, saves: 27, rotation: 0.6,
  },
];

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
    roommatesStaying: terms?.roommates_staying ? Math.max(0, bedsTotal - 1) : null,
    roommateDesc: terms?.roommates_staying ? "Roommates staying during the sublet term" : null,
    bedsAvailable: terms?.entire_place ? bedsTotal : 1,
    bedsTotal,
    distance: `${distance.toFixed(1)} km`,
    walkTime: `${walkTime} min`,
    amenities,
    views: 0,
    saves: 0,
    rotation: Number(sublet.id) % 2 === 0 ? 1.2 : -1.2,
  };
}
import type { SubletListResponse } from "@/types";
