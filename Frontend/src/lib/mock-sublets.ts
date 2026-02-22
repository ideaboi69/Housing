/**
 * Mock sublet detail data — extended version of the SubletListing type used on /sublets.
 * Once OJ builds backend endpoints, replace with API calls.
 */

export interface SubletDetail {
  id: string;
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
  subletStart: string; // "2026-05-01"
  subletEnd: string;   // "2026-07-31"
  neighborhood: string;
  furnished: boolean;
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
  amenities: string[];
  genderPreference: string;
  views: number;
  saves: number;
  images: string[];
  createdAt: string;
}

const SUBLET_IMAGES: Record<string, string[]> = {
  s1: [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
  ],
  s2: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop",
  ],
  s3: [
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
  ],
  s4: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop",
  ],
  s5: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=500&fit=crop",
  ],
  s6: [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",
  ],
};

export const mockSubletDetails: SubletDetail[] = [
  {
    id: "s1", title: "Furnished Room in 4BR House", street: "78 College Ave W", address: "78 College Ave W, Guelph, ON", postalCode: "N1G 1S4",
    description: "Leaving for a summer co-op in Toronto. Room is fully furnished — queen bed, desk, dresser, and a mini fridge. The house is super clean and quiet. Two roommates staying are both upper-year science students, really chill people. Backyard is great for BBQs. 5 min walk to campus.",
    subletPrice: 550, originalPrice: 720, healthScore: 91, verified: true,
    posterName: "Alex", posterType: "4th year, Engineering", posterIsStudent: true, posterYear: "4th", posterProgram: "Engineering",
    availableMonths: [true, true, true, false, false], subletStart: "2026-05-01", subletEnd: "2026-07-31",
    neighborhood: "Campus", furnished: true, negotiablePrice: true, flexibleDates: false,
    roommatesStaying: 2, roommateDesc: "2 upper-year science students staying for summer research",
    bedsAvailable: 1, bedsTotal: 4, bathrooms: 2, propertyType: "house",
    distanceKm: 0.3, walkTime: 4, busTime: null, amenities: ["Utilities Incl.", "Laundry", "Backyard", "WiFi"],
    genderPreference: "any", views: 89, saves: 14, images: SUBLET_IMAGES.s1, createdAt: "2026-02-10T14:00:00",
  },
  {
    id: "s2", title: "Entire 2BR Apartment", street: "155 Gordon St", address: "155 Gordon St, Unit 405, Guelph, ON", postalCode: "N1G 4Y2",
    description: "Taking both rooms for the summer — great deal. The whole apartment is yours. Modern building with A/C, underground parking, and a dishwasher. Quiet floor. Close to Stone Rd Mall for groceries.",
    subletPrice: 1100, originalPrice: 1400, healthScore: 86, verified: true,
    posterName: "Jordan", posterType: "Property Manager", posterIsStudent: false,
    availableMonths: [true, true, true, true, false], subletStart: "2026-05-01", subletEnd: "2026-08-31",
    neighborhood: "Stone Road", furnished: true, negotiablePrice: true, flexibleDates: false,
    roommatesStaying: null, roommateDesc: null,
    bedsAvailable: 2, bedsTotal: 2, bathrooms: 1, propertyType: "apartment",
    distanceKm: 1.2, walkTime: 14, busTime: 5, amenities: ["Parking", "Dishwasher", "A/C", "Elevator"],
    genderPreference: "any", views: 203, saves: 31, images: SUBLET_IMAGES.s2, createdAt: "2026-01-28T09:30:00",
  },
  {
    id: "s3", title: "Private Room near Campus", street: "42 Suffolk St W", address: "42 Suffolk St W, Guelph, ON", postalCode: "N1H 2J2",
    description: "Room is unfurnished but spacious. One grad student staying for a summer research term — very quiet and keeps to herself. House has laundry in the basement and good WiFi. Short walk to campus.",
    subletPrice: 480, originalPrice: 680, healthScore: 68, verified: false,
    posterName: "Priya", posterType: "3rd year, Arts", posterIsStudent: true, posterYear: "3rd", posterProgram: "Arts",
    availableMonths: [true, true, true, false, false], subletStart: "2026-05-01", subletEnd: "2026-07-31",
    neighborhood: "Campus", furnished: false, negotiablePrice: false, flexibleDates: false,
    roommatesStaying: 1, roommateDesc: "1 grad student staying for research term — very quiet",
    bedsAvailable: 1, bedsTotal: 3, bathrooms: 1, propertyType: "house",
    distanceKm: 0.5, walkTime: 6, busTime: null, amenities: ["Laundry", "WiFi"],
    genderPreference: "female", views: 47, saves: 5, images: SUBLET_IMAGES.s3, createdAt: "2026-02-15T11:20:00",
  },
  {
    id: "s4", title: "Studio Apartment Downtown", street: "88 Macdonell St", address: "88 Macdonell St, Unit 3, Guelph, ON", postalCode: "N1H 2Z6",
    description: "Cozy studio in the heart of downtown Guelph. Walk to restaurants, bars, and the farmers market. Building has a gym. Dates are flexible — could start mid-May or early June.",
    subletPrice: 700, originalPrice: 950, healthScore: 82, verified: true,
    posterName: "Marcus", posterType: "Landlord", posterIsStudent: false,
    availableMonths: [false, true, true, true, false], subletStart: "2026-06-01", subletEnd: "2026-08-31",
    neighborhood: "Downtown", furnished: false, negotiablePrice: false, flexibleDates: true,
    roommatesStaying: null, roommateDesc: null,
    bedsAvailable: 1, bedsTotal: 1, bathrooms: 1, propertyType: "apartment",
    distanceKm: 1.8, walkTime: 22, busTime: 8, amenities: ["A/C", "Gym", "Utilities Incl.", "Elevator"],
    genderPreference: "any", views: 134, saves: 22, images: SUBLET_IMAGES.s4, createdAt: "2026-02-05T16:45:00",
  },
  {
    id: "s5", title: "Room in Townhouse", street: "31 Grange St", address: "31 Grange St, Guelph, ON", postalCode: "N1E 3A1",
    description: "Furnished room in a clean townhouse. Two kinesiology students staying for the summer. Parking available on the driveway. Has a nice backyard. Bit farther from campus but on the bus route.",
    subletPrice: 450, originalPrice: 640, healthScore: 64, verified: false,
    posterName: "Sam", posterType: "2nd year, Business", posterIsStudent: true, posterYear: "2nd", posterProgram: "Business",
    availableMonths: [true, true, false, false, false], subletStart: "2026-05-01", subletEnd: "2026-06-30",
    neighborhood: "South End", furnished: true, negotiablePrice: false, flexibleDates: true,
    roommatesStaying: 2, roommateDesc: "2 upper-year kinesiology students staying for summer training",
    bedsAvailable: 1, bedsTotal: 4, bathrooms: 1, propertyType: "townhouse",
    distanceKm: 2.1, walkTime: 26, busTime: 10, amenities: ["Parking", "Backyard", "WiFi"],
    genderPreference: "any", views: 28, saves: 3, images: SUBLET_IMAGES.s5, createdAt: "2026-02-18T08:00:00",
  },
  {
    id: "s6", title: "Master Bedroom in 5BR House", street: "62 Dean Ave", address: "62 Dean Ave, Guelph, ON", postalCode: "N1G 1L3",
    description: "Biggest room in the house — has a walk-in closet and gets tons of natural light. Three engineering friends staying for co-op. House is well-maintained with a big backyard. Price negotiable if you take it for all 4 months.",
    subletPrice: 500, originalPrice: 600, healthScore: 88, verified: true,
    posterName: "Taylor", posterType: "4th year, CompSci", posterIsStudent: true, posterYear: "4th", posterProgram: "Computer Science",
    availableMonths: [true, true, true, true, false], subletStart: "2026-05-01", subletEnd: "2026-08-31",
    neighborhood: "Campus", furnished: true, negotiablePrice: true, flexibleDates: true,
    roommatesStaying: 3, roommateDesc: "3 engineering students staying for summer internships — fun crew",
    bedsAvailable: 1, bedsTotal: 5, bathrooms: 2, propertyType: "house",
    distanceKm: 0.4, walkTime: 5, busTime: null, amenities: ["Utilities Incl.", "Laundry", "WiFi", "Backyard"],
    genderPreference: "any", views: 156, saves: 27, images: SUBLET_IMAGES.s6, createdAt: "2026-02-01T13:15:00",
  },
];

export function getMockSublet(id: string): SubletDetail | undefined {
  return mockSubletDetails.find((s) => s.id === id);
}