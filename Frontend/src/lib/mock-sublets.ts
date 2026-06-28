/**
 * Mock sublet detail data — uses the SAME structured amenity booleans as listings.
 * Every sublet is evaluated against the exact same amenity checklist.
 */

import {
  computeAmenityScore,
  computeLocationScore,
  computeOverallScore,
} from "@/lib/cribb-score";

export interface SubletDetail {
  id: string;
  listing_id?: number;
  title: string;
  street: string;
  address: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  description: string;
  subletPrice: number;
  originalPrice: number;
  healthScore: number;
  verified: boolean;
  posterName: string;
  posterType: string;
  posterIsStudent: boolean;
  posterYear?: string;
  posterProgram?: string;
  availableMonths: boolean[]; // [May, Jun, Jul, Aug, Sep]
  subletStart: string;
  subletEnd: string;
  neighborhood: string;
  negotiablePrice: boolean;
  flexibleDates: boolean;
  roommatesStaying: number | null;
  roommateDesc: string | null;
  bedsAvailable: number;
  bedsTotal: number;
  bathrooms: number;
  propertyType: string;
  distanceKm: number;
  walkTime: number;
  driveTime?: number | null;
  busTime: number | null;
  genderPreference: string;
  views: number;
  saves: number;
  images: string[];
  floorPlans?: string[];
  createdAt: string;
  // ── Standard Amenities (same as listings) ──
  is_furnished: boolean;
  has_parking: boolean;
  has_laundry: boolean;
  utilities_included: boolean;
  pet_friendly: boolean;
  has_air_conditioning: boolean;
  has_wifi: boolean;
  has_dishwasher: boolean;
  has_gym: boolean;
  has_elevator: boolean;
  has_backyard: boolean;
  has_balcony: boolean;
  smoking_allowed: boolean;
  wheelchair_accessible: boolean;
  estimated_utility_cost: number | null;
  // ── Health Score Breakdown ──
  price_vs_market_score: number;
  location_score: number;
  amenity_score: number;
  landlord_reputation_score: number;
  maintenance_score: number;
  lease_clarity_score: number;
}

const SUBLET_IMAGES: Record<string, string[]> = {
  s1: [
    "/demo/listings/townhouse.jpg",
    "/demo/listings/apartment.jpg",
    "/demo/listings/house.jpg",
  ],
  s2: [
    "/demo/listings/apartment.jpg",
    "/demo/listings/house.jpg",
    "/demo/listings/studio.jpg",
    "/demo/listings/townhouse.jpg",
  ],
  s3: [
    "/demo/listings/studio.jpg",
    "/demo/listings/apartment.jpg",
  ],
  s4: [
    "/demo/listings/house.jpg",
    "/demo/listings/apartment.jpg",
    "/demo/listings/studio.jpg",
  ],
  s5: [
    "/demo/listings/townhouse.jpg",
    "/demo/listings/house.jpg",
  ],
  s6: [
    "/demo/listings/house.jpg",
    "/demo/listings/townhouse.jpg",
    "/demo/listings/apartment.jpg",
    "/demo/listings/studio.jpg",
  ],
};

/** Seed data — Location & Amenity sub-scores are derived in getMockSublet(). */
type SubletSeed = Omit<SubletDetail, "location_score" | "amenity_score">;

export const mockSubletDetails: SubletSeed[] = [
  {
    id: "s1", listing_id: 1001, title: "Furnished Room in 4BR House", street: "78 College Ave W", address: "78 College Ave W, Guelph, ON", postalCode: "N1G 1S4", latitude: 43.5310, longitude: -80.2240,
    description: "Leaving for a summer co-op in Toronto. Room is fully furnished — queen bed, desk, dresser, and a mini fridge. The house is super clean and quiet. Two roommates staying are both upper-year science students, really chill people. Backyard is great for BBQs. 5 min walk to campus.",
    subletPrice: 550, originalPrice: 720, healthScore: 91, verified: true,
    posterName: "Alex", posterType: "4th year, Engineering", posterIsStudent: true, posterYear: "4th", posterProgram: "Engineering",
    availableMonths: [true, true, true, false, false], subletStart: "2026-05-01", subletEnd: "2026-07-31",
    neighborhood: "Campus", negotiablePrice: true, flexibleDates: false,
    roommatesStaying: 2, roommateDesc: "2 upper-year science students staying for summer research",
    bedsAvailable: 1, bedsTotal: 4, bathrooms: 2, propertyType: "house",
    distanceKm: 0.3, walkTime: 4, busTime: null, genderPreference: "any", views: 89, saves: 14,
    images: SUBLET_IMAGES.s1, createdAt: "2026-02-10T14:00:00",
    is_furnished: true, has_parking: false, has_laundry: true, utilities_included: true,
    pet_friendly: false, has_air_conditioning: false, has_wifi: true, has_dishwasher: false,
    has_gym: false, has_elevator: false, has_backyard: true, has_balcony: false,
    smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: null,
    price_vs_market_score: 90, landlord_reputation_score: 94, maintenance_score: 88, lease_clarity_score: 92,
  },
  {
    id: "s2", listing_id: 1002, title: "Entire 2BR Apartment", street: "155 Gordon St", address: "155 Gordon St, Unit 405, Guelph, ON", postalCode: "N1G 4Y2", latitude: 43.5220, longitude: -80.2450,
    description: "Taking both rooms for the summer — great deal. The whole apartment is yours. Modern building with A/C, underground parking, and a dishwasher. Quiet floor. Close to Stone Rd Mall for groceries.",
    subletPrice: 1100, originalPrice: 1400, healthScore: 86, verified: true,
    posterName: "Jordan", posterType: "Property Manager", posterIsStudent: false,
    availableMonths: [true, true, true, true, false], subletStart: "2026-05-01", subletEnd: "2026-08-31",
    neighborhood: "Stone Road", negotiablePrice: true, flexibleDates: false,
    roommatesStaying: null, roommateDesc: null,
    bedsAvailable: 2, bedsTotal: 2, bathrooms: 1, propertyType: "apartment",
    distanceKm: 1.2, walkTime: 14, busTime: 5, genderPreference: "any", views: 203, saves: 31,
    images: SUBLET_IMAGES.s2, createdAt: "2026-01-28T09:30:00",
    is_furnished: true, has_parking: true, has_laundry: false, utilities_included: false,
    pet_friendly: false, has_air_conditioning: true, has_wifi: true, has_dishwasher: true,
    has_gym: false, has_elevator: true, has_backyard: false, has_balcony: false,
    smoking_allowed: false, wheelchair_accessible: true, estimated_utility_cost: 60,
    price_vs_market_score: 88, landlord_reputation_score: 84, maintenance_score: 82, lease_clarity_score: 90,
  },
  {
    id: "s3", listing_id: 1003, title: "Private Room near Campus", street: "42 Suffolk St W", address: "42 Suffolk St W, Guelph, ON", postalCode: "N1H 2J2", latitude: 43.5290, longitude: -80.2210,
    description: "Room is unfurnished but spacious. One grad student staying for a summer research term — very quiet and keeps to herself. House has laundry in the basement and good WiFi. Short walk to campus.",
    subletPrice: 480, originalPrice: 680, healthScore: 68, verified: false,
    posterName: "Priya", posterType: "3rd year, Arts", posterIsStudent: true, posterYear: "3rd", posterProgram: "Arts",
    availableMonths: [true, true, true, false, false], subletStart: "2026-05-01", subletEnd: "2026-07-31",
    neighborhood: "Campus", negotiablePrice: false, flexibleDates: false,
    roommatesStaying: 1, roommateDesc: "1 grad student staying for research term — very quiet",
    bedsAvailable: 1, bedsTotal: 3, bathrooms: 1, propertyType: "house",
    distanceKm: 0.5, walkTime: 6, busTime: null, genderPreference: "female", views: 47, saves: 5,
    images: SUBLET_IMAGES.s3, createdAt: "2026-02-15T11:20:00",
    is_furnished: false, has_parking: false, has_laundry: true, utilities_included: false,
    pet_friendly: false, has_air_conditioning: false, has_wifi: true, has_dishwasher: false,
    has_gym: false, has_elevator: false, has_backyard: false, has_balcony: false,
    smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: 40,
    price_vs_market_score: 72, landlord_reputation_score: 70, maintenance_score: 58, lease_clarity_score: 72,
  },
];

export function getMockSublet(id: string): SubletDetail | undefined {
  const base = mockSubletDetails.find((s) => s.id === id);
  if (!base) return undefined;

  // Derive Location & Amenity sub-scores from real data, then recompute the
  // overall Cribb Score with the v3 weights (Price 30 / Location 40 / Amenities 20 / Completeness 10).
  const location_score = computeLocationScore({
    lat: base.latitude,
    lng: base.longitude,
    busMinutes: base.busTime,
    walkMinutes: base.walkTime,
    distanceKm: base.distanceKm,
  });
  const amenity_score = computeAmenityScore(base, base.pet_friendly);
  const healthScore = computeOverallScore({
    price: base.price_vs_market_score,
    location: location_score,
    amenity: amenity_score,
    completeness: base.lease_clarity_score,
  });

  return { ...base, location_score, amenity_score, healthScore };
}
