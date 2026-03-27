/**
 * Mock sublet detail data — uses the SAME structured amenity booleans as listings.
 * Every sublet is evaluated against the exact same amenity checklist.
 */

export interface SubletDetail {
  id: string;
  listing_id?: number;
  title: string;
  street: string;
  address: string;
  postalCode: string;
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
  busTime: number | null;
  genderPreference: string;
  views: number;
  saves: number;
  images: string[];
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

export const mockSubletDetails: SubletDetail[] = [
  {
    id: "s1", listing_id: 1001, title: "Furnished Room in 4BR House", street: "78 College Ave W", address: "78 College Ave W, Guelph, ON", postalCode: "N1G 1S4",
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
    id: "s2", listing_id: 1002, title: "Entire 2BR Apartment", street: "155 Gordon St", address: "155 Gordon St, Unit 405, Guelph, ON", postalCode: "N1G 4Y2",
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
    id: "s3", listing_id: 1003, title: "Private Room near Campus", street: "42 Suffolk St W", address: "42 Suffolk St W, Guelph, ON", postalCode: "N1H 2J2",
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
  {
    id: "s4", listing_id: 1004, title: "Studio Apartment Downtown", street: "88 Macdonell St", address: "88 Macdonell St, Unit 3, Guelph, ON", postalCode: "N1H 2Z6",
    description: "Cozy studio in the heart of downtown Guelph. Walk to restaurants, bars, and the farmers market. Building has a gym. Dates are flexible — could start mid-May or early June.",
    subletPrice: 700, originalPrice: 950, healthScore: 82, verified: true,
    posterName: "Marcus", posterType: "Landlord", posterIsStudent: false,
    availableMonths: [false, true, true, true, false], subletStart: "2026-06-01", subletEnd: "2026-08-31",
    neighborhood: "Downtown", negotiablePrice: false, flexibleDates: true,
    roommatesStaying: null, roommateDesc: null,
    bedsAvailable: 1, bedsTotal: 1, bathrooms: 1, propertyType: "apartment",
    distanceKm: 1.8, walkTime: 22, busTime: 8, genderPreference: "any", views: 134, saves: 22,
    images: SUBLET_IMAGES.s4, createdAt: "2026-02-05T16:45:00",
    is_furnished: false, has_parking: false, has_laundry: false, utilities_included: true,
    pet_friendly: true, has_air_conditioning: true, has_wifi: true, has_dishwasher: false,
    has_gym: true, has_elevator: true, has_backyard: false, has_balcony: false,
    smoking_allowed: false, wheelchair_accessible: true, estimated_utility_cost: null,
    price_vs_market_score: 78, landlord_reputation_score: 86, maintenance_score: 80, lease_clarity_score: 84,
  },
  {
    id: "s5", listing_id: 1005, title: "Room in Townhouse", street: "31 Grange St", address: "31 Grange St, Guelph, ON", postalCode: "N1E 3A1",
    description: "Furnished room in a clean townhouse. Two kinesiology students staying for the summer. Parking available on the driveway. Has a nice backyard. Bit farther from campus but on the bus route.",
    subletPrice: 450, originalPrice: 640, healthScore: 64, verified: false,
    posterName: "Sam", posterType: "2nd year, Business", posterIsStudent: true, posterYear: "2nd", posterProgram: "Business",
    availableMonths: [true, true, false, false, false], subletStart: "2026-05-01", subletEnd: "2026-06-30",
    neighborhood: "South End", negotiablePrice: false, flexibleDates: true,
    roommatesStaying: 2, roommateDesc: "2 upper-year kinesiology students staying for summer training",
    bedsAvailable: 1, bedsTotal: 4, bathrooms: 1, propertyType: "townhouse",
    distanceKm: 2.1, walkTime: 26, busTime: 10, genderPreference: "any", views: 28, saves: 3,
    images: SUBLET_IMAGES.s5, createdAt: "2026-02-18T08:00:00",
    is_furnished: true, has_parking: true, has_laundry: false, utilities_included: false,
    pet_friendly: false, has_air_conditioning: false, has_wifi: true, has_dishwasher: false,
    has_gym: false, has_elevator: false, has_backyard: true, has_balcony: false,
    smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: 45,
    price_vs_market_score: 82, landlord_reputation_score: 62, maintenance_score: 56, lease_clarity_score: 66,
  },
  {
    id: "s6", listing_id: 1006, title: "Master Bedroom in 5BR House", street: "62 Dean Ave", address: "62 Dean Ave, Guelph, ON", postalCode: "N1G 1L3",
    description: "Biggest room in the house — has a walk-in closet and gets tons of natural light. Three engineering friends staying for co-op. House is well-maintained with a big backyard. Price negotiable if you take it for all 4 months.",
    subletPrice: 500, originalPrice: 600, healthScore: 88, verified: true,
    posterName: "Taylor", posterType: "4th year, CompSci", posterIsStudent: true, posterYear: "4th", posterProgram: "Computer Science",
    availableMonths: [true, true, true, true, false], subletStart: "2026-05-01", subletEnd: "2026-08-31",
    neighborhood: "Campus", negotiablePrice: true, flexibleDates: true,
    roommatesStaying: 3, roommateDesc: "3 engineering students staying for summer internships — fun crew",
    bedsAvailable: 1, bedsTotal: 5, bathrooms: 2, propertyType: "house",
    distanceKm: 0.4, walkTime: 5, busTime: null, genderPreference: "any", views: 156, saves: 27,
    images: SUBLET_IMAGES.s6, createdAt: "2026-02-01T13:15:00",
    is_furnished: true, has_parking: false, has_laundry: true, utilities_included: true,
    pet_friendly: true, has_air_conditioning: false, has_wifi: true, has_dishwasher: false,
    has_gym: false, has_elevator: false, has_backyard: true, has_balcony: false,
    smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: null,
    price_vs_market_score: 85, landlord_reputation_score: 92, maintenance_score: 86, lease_clarity_score: 88,
  },
];

export function getMockSublet(id: string): SubletDetail | undefined {
  return mockSubletDetails.find((s) => s.id === id);
}
