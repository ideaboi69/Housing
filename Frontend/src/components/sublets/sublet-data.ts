/* ════════════════════════════════════════════════════════
   Sublet Types, Mock Data & Helpers
   Extracted from sublets/page.tsx for maintainability.
   ════════════════════════════════════════════════════════ */

export interface SubletListing {
  id: string;
  listing_id?: number;
  title: string;
  street: string;
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