import type { ListingDetailResponse, HealthScoreResponse, ReviewResponse } from "@/types";

const LISTING_IMAGES: Record<number, string[]> = {
  1: [
    "/demo/listings/townhouse.jpg",
    "/demo/listings/house.jpg",
    "/demo/listings/apartment.jpg",
    "/demo/listings/studio.jpg",
  ],
  2: [
    "/demo/listings/apartment.jpg",
    "/demo/listings/studio.jpg",
    "/demo/listings/house.jpg",
  ],
  3: [
    "/demo/listings/studio.jpg",
    "/demo/listings/apartment.jpg",
  ],
  4: [
    "/demo/listings/house.jpg",
    "/demo/listings/apartment.jpg",
    "/demo/listings/townhouse.jpg",
  ],
  5: [
    "/demo/listings/house.jpg",
    "/demo/listings/townhouse.jpg",
    "/demo/listings/apartment.jpg",
    "/demo/listings/studio.jpg",
  ],
  6: [
    "/demo/listings/apartment.jpg",
    "/demo/listings/studio.jpg",
    "/demo/listings/townhouse.jpg",
  ],
  7: [
    "/demo/listings/townhouse.jpg",
    "/demo/listings/house.jpg",
  ],
  8: [
    "/demo/listings/apartment.jpg",
    "/demo/listings/studio.jpg",
    "/demo/listings/house.jpg",
    "/demo/listings/townhouse.jpg",
  ],
};

export const mockListings: ListingDetailResponse[] = [
  { id: 1, rent_per_room: 725, rent_total: 2175, lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: "any", status: "active", view_count: 245, created_at: "2026-01-15T10:30:00", property_id: 1, title: "Cozy Townhouse on College Ave", address: "118 College Ave W, Guelph", property_type: "townhouse", total_rooms: 3, bathrooms: 2, is_furnished: true, has_parking: false, has_laundry: true, utilities_included: false, pet_friendly: false, has_air_conditioning: false, has_wifi: true, has_dishwasher: false, has_gym: false, has_elevator: false, has_backyard: true, has_balcony: false, smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: 45, distance_to_campus_km: 0.4, walk_time_minutes: 5, bus_time_minutes: null, landlord_id: 1, landlord_name: "Sarah Mitchell", landlord_verified: true },
  { id: 2, rent_per_room: 650, rent_total: 1300, lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: "any", status: "active", view_count: 312, created_at: "2026-01-20T14:15:00", property_id: 2, title: "Sunny 2BR near Stone Rd Mall", address: "45 Stone Rd W, Unit 302, Guelph", property_type: "apartment", total_rooms: 2, bathrooms: 1, is_furnished: false, has_parking: true, has_laundry: false, utilities_included: false, pet_friendly: true, has_air_conditioning: false, has_wifi: true, has_dishwasher: false, has_gym: false, has_elevator: false, has_backyard: false, has_balcony: false, smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: 55, distance_to_campus_km: 1.2, walk_time_minutes: 12, bus_time_minutes: 5, landlord_id: 2, landlord_name: "David Chen", landlord_verified: true },
  { id: 3, rent_per_room: 680, rent_total: 680, lease_type: "8_month", move_in_date: "2027-01-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: null, status: "active", view_count: 134, created_at: "2026-02-01T09:00:00", property_id: 3, title: "Bright Studio on Gordon St", address: "220 Gordon St, Unit 4B, Guelph", property_type: "apartment", total_rooms: 1, bathrooms: 1, is_furnished: true, has_parking: false, has_laundry: false, utilities_included: true, pet_friendly: false, has_air_conditioning: true, has_wifi: true, has_dishwasher: false, has_gym: false, has_elevator: true, has_backyard: false, has_balcony: false, smoking_allowed: false, wheelchair_accessible: true, estimated_utility_cost: null, distance_to_campus_km: 0.5, walk_time_minutes: 6, bus_time_minutes: null, landlord_id: 1, landlord_name: "Sarah Mitchell", landlord_verified: true },
  { id: 4, rent_per_room: 550, rent_total: 2200, lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: null, status: "active", view_count: 89, created_at: "2026-02-10T16:45:00", property_id: 4, title: "Renovated Bungalow on Harvard", address: "33 Harvard Rd, Guelph", property_type: "house", total_rooms: 4, bathrooms: 2, is_furnished: false, has_parking: true, has_laundry: true, utilities_included: false, pet_friendly: true, has_air_conditioning: false, has_wifi: false, has_dishwasher: true, has_gym: false, has_elevator: false, has_backyard: true, has_balcony: false, smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: 60, distance_to_campus_km: 2.5, walk_time_minutes: 18, bus_time_minutes: 8, landlord_id: 3, landlord_name: "Mike Patterson", landlord_verified: false },
  { id: 5, rent_per_room: 875, rent_total: 4375, lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: null, status: "active", view_count: 198, created_at: "2026-01-25T11:20:00", property_id: 5, title: "Spacious House near Campus", address: "87 Edinburgh Rd S, Guelph", property_type: "house", total_rooms: 5, bathrooms: 3, is_furnished: false, has_parking: true, has_laundry: true, utilities_included: false, pet_friendly: false, has_air_conditioning: false, has_wifi: true, has_dishwasher: true, has_gym: false, has_elevator: false, has_backyard: true, has_balcony: true, smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: 50, distance_to_campus_km: 0.7, walk_time_minutes: 8, bus_time_minutes: null, landlord_id: 2, landlord_name: "David Chen", landlord_verified: true },
  { id: 6, rent_per_room: 750, rent_total: 2250, lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: null, status: "active", view_count: 156, created_at: "2026-02-05T13:30:00", property_id: 6, title: "Modern Apartment with Balcony", address: "415 Gordon St, Unit B, Guelph", property_type: "apartment", total_rooms: 3, bathrooms: 1, is_furnished: false, has_parking: false, has_laundry: true, utilities_included: false, pet_friendly: false, has_air_conditioning: true, has_wifi: true, has_dishwasher: false, has_gym: false, has_elevator: true, has_backyard: false, has_balcony: true, smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: 40, distance_to_campus_km: 0.9, walk_time_minutes: 10, bus_time_minutes: 4, landlord_id: 3, landlord_name: "Mike Patterson", landlord_verified: false },
  { id: 7, rent_per_room: 620, rent_total: 1860, lease_type: "8_month", move_in_date: "2026-05-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: null, status: "active", view_count: 67, created_at: "2026-02-12T08:00:00", property_id: 7, title: "Charming Duplex with Yard", address: "90 Suffolk St W, Guelph", property_type: "townhouse", total_rooms: 3, bathrooms: 1, is_furnished: false, has_parking: false, has_laundry: false, utilities_included: false, pet_friendly: false, has_air_conditioning: false, has_wifi: false, has_dishwasher: false, has_gym: false, has_elevator: false, has_backyard: true, has_balcony: false, smoking_allowed: true, wheelchair_accessible: false, estimated_utility_cost: 50, distance_to_campus_km: 1.8, walk_time_minutes: 15, bus_time_minutes: 6, landlord_id: 1, landlord_name: "Sarah Mitchell", landlord_verified: true },
  { id: 8, rent_per_room: 780, rent_total: 1560, lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: null, status: "active", view_count: 203, created_at: "2026-02-08T15:00:00", property_id: 8, title: "New Build near Kortright", address: "150 Kortright Rd W, Unit 210, Guelph", property_type: "apartment", total_rooms: 2, bathrooms: 1, is_furnished: true, has_parking: true, has_laundry: true, utilities_included: true, pet_friendly: false, has_air_conditioning: true, has_wifi: true, has_dishwasher: true, has_gym: true, has_elevator: true, has_backyard: false, has_balcony: true, smoking_allowed: false, wheelchair_accessible: true, estimated_utility_cost: null, distance_to_campus_km: 2.8, walk_time_minutes: 22, bus_time_minutes: 10, landlord_id: 2, landlord_name: "David Chen", landlord_verified: true },
];

export const mockHealthScores: Record<number, number> = {
  1: 88, 2: 92, 3: 79, 4: 86, 5: 95, 6: 81, 7: 73, 8: 91,
};

export const mockHealthScoreDetails: Record<number, HealthScoreResponse> = {
  1: { id: 1, listing_id: 1, overall_score: 88, price_vs_market_score: 82, landlord_reputation_score: 94, maintenance_score: 85, lease_clarity_score: 90, created_at: "2026-01-16T00:00:00" },
  2: { id: 2, listing_id: 2, overall_score: 92, price_vs_market_score: 95, landlord_reputation_score: 91, maintenance_score: 88, lease_clarity_score: 93, created_at: "2026-01-21T00:00:00" },
  3: { id: 3, listing_id: 3, overall_score: 79, price_vs_market_score: 72, landlord_reputation_score: 94, maintenance_score: 68, lease_clarity_score: 82, created_at: "2026-02-02T00:00:00" },
  4: { id: 4, listing_id: 4, overall_score: 86, price_vs_market_score: 90, landlord_reputation_score: 78, maintenance_score: 84, lease_clarity_score: 92, created_at: "2026-02-11T00:00:00" },
  5: { id: 5, listing_id: 5, overall_score: 95, price_vs_market_score: 88, landlord_reputation_score: 98, maintenance_score: 96, lease_clarity_score: 97, created_at: "2026-01-26T00:00:00" },
  6: { id: 6, listing_id: 6, overall_score: 81, price_vs_market_score: 78, landlord_reputation_score: 76, maintenance_score: 88, lease_clarity_score: 82, created_at: "2026-02-06T00:00:00" },
  7: { id: 7, listing_id: 7, overall_score: 73, price_vs_market_score: 85, landlord_reputation_score: 70, maintenance_score: 62, lease_clarity_score: 75, created_at: "2026-02-13T00:00:00" },
  8: { id: 8, listing_id: 8, overall_score: 91, price_vs_market_score: 84, landlord_reputation_score: 96, maintenance_score: 92, lease_clarity_score: 91, created_at: "2026-02-09T00:00:00" },
};

export const mockReviews: Record<number, ReviewResponse[]> = {
  1: [
    { id: 101, student_id: 10, property_id: 1, landlord_id: 1, responsiveness: 5, maintenance_speed: 4, respect_privacy: 5, fairness_of_charges: 4, would_rent_again: true, comment: "Sarah was always quick to respond and super respectful. Only downside was a slow drain fix, but she got it sorted within a week. Would definitely rent again.", created_at: "2025-08-15T00:00:00" },
    { id: 102, student_id: 11, property_id: 1, landlord_id: 1, responsiveness: 5, maintenance_speed: 5, respect_privacy: 5, fairness_of_charges: 5, would_rent_again: true, comment: "Best landlord I've had in Guelph. Everything was handled professionally.", created_at: "2025-06-20T00:00:00" },
  ],
  2: [
    { id: 201, student_id: 12, property_id: 2, landlord_id: 2, responsiveness: 4, maintenance_speed: 4, respect_privacy: 5, fairness_of_charges: 4, would_rent_again: true, comment: "Great location near Stone Rd Mall. David was easy to communicate with.", created_at: "2025-09-01T00:00:00" },
  ],
  3: [
    { id: 301, student_id: 13, property_id: 3, landlord_id: 1, responsiveness: 4, maintenance_speed: 3, respect_privacy: 4, fairness_of_charges: 3, would_rent_again: true, comment: "Decent studio, cozy but small. Utilities included is a nice perk. Maintenance could be faster.", created_at: "2025-07-10T00:00:00" },
  ],
  5: [
    { id: 501, student_id: 14, property_id: 5, landlord_id: 2, responsiveness: 5, maintenance_speed: 5, respect_privacy: 5, fairness_of_charges: 5, would_rent_again: true, comment: "Incredible house, tons of space. David is the best landlord around. Highly recommend.", created_at: "2025-05-30T00:00:00" },
    { id: 502, student_id: 15, property_id: 5, landlord_id: 2, responsiveness: 5, maintenance_speed: 4, respect_privacy: 5, fairness_of_charges: 4, would_rent_again: true, comment: "Lived here for 2 years. Great experience overall.", created_at: "2025-04-15T00:00:00" },
    { id: 503, student_id: 16, property_id: 5, landlord_id: 2, responsiveness: 5, maintenance_speed: 5, respect_privacy: 5, fairness_of_charges: 5, would_rent_again: true, comment: "10/10 would rent again. Close to campus, big rooms, great landlord.", created_at: "2024-12-01T00:00:00" },
  ],
};

export function getListingImages(listingId: number): string[] {
  return LISTING_IMAGES[listingId] || [];
}

export function getMockListing(id: number): ListingDetailResponse | undefined {
  return mockListings.find((l) => l.id === id);
}

export function getMockHealthScore(listingId: number): HealthScoreResponse | undefined {
  return mockHealthScoreDetails[listingId];
}

export function getMockReviews(propertyId: number): ReviewResponse[] {
  return mockReviews[propertyId] || [];
}

export const mockCoordinates: Record<number, { lat: number; lng: number }> = {
  1: { lat: 43.5310, lng: -80.2262 },
  2: { lat: 43.5380, lng: -80.2480 },
  3: { lat: 43.5305, lng: -80.2290 },
  4: { lat: 43.5180, lng: -80.2400 },
  5: { lat: 43.5285, lng: -80.2310 },
  6: { lat: 43.5340, lng: -80.2350 },
  7: { lat: 43.5230, lng: -80.2520 },
  8: { lat: 43.5190, lng: -80.2280 },
};
