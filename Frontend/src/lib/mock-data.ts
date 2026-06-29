import type { ListingDetailResponse, HealthScoreResponse, ReviewResponse, BuildingResponse, BuildingUnitResponse } from "@/types";

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
  // Maple House Residences (apartment building, property_id 100) — unit types
  101: ["/demo/listings/apartment.jpg", "/demo/listings/studio.jpg"],
  102: ["/demo/listings/apartment.jpg", "/demo/listings/house.jpg"],
  103: ["/demo/listings/apartment.jpg", "/demo/listings/townhouse.jpg"],
};

export const mockListings : ListingDetailResponse[] = [
  { id: 1, rent_per_room: 725, rent_total: 2175, rent_min: 2175, rent_max: 2175, per_room_pricing: false, rooms: [], lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: "any", status: "active", view_count: 245, created_at: "2026-01-15T10:30:00", updated_at: "2026-02-15T10:30:00", property_id: 1, title: "Cozy Townhouse on College Ave", address: "118 College Ave W, Guelph", property_type: "townhouse", total_rooms: 3, bathrooms: 2, is_furnished: true, has_parking: false, has_laundry: true, utilities_included: false, pet_friendly: false, has_air_conditioning: false, has_wifi: true, has_dishwasher: false, has_gym: false, has_elevator: false, has_backyard: true, has_balcony: false, smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: 45, distance_to_campus_km: 0.4, walk_time_minutes: 5, bus_time_minutes: null, landlord_id: 1, landlord_name: "Sarah Mitchell", landlord_verified: true },
  { id: 2, rent_per_room: 650, rent_total: 1300, rent_min: 1300, rent_max: 1300, per_room_pricing: false, rooms: [], lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: "any", status: "active", view_count: 312, created_at: "2026-01-20T14:15:00", updated_at: "2026-02-15T10:30:00", property_id: 2, title: "Sunny 2BR near Stone Rd Mall", address: "45 Stone Rd W, Unit 302, Guelph", property_type: "apartment", total_rooms: 2, bathrooms: 1, is_furnished: false, has_parking: true, has_laundry: false, utilities_included: false, pet_friendly: true, has_air_conditioning: false, has_wifi: true, has_dishwasher: false, has_gym: false, has_elevator: false, has_backyard: false, has_balcony: false, smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: 55, distance_to_campus_km: 1.2, walk_time_minutes: 12, bus_time_minutes: 5, landlord_id: 2, landlord_name: "David Chen", landlord_verified: true },
  { id: 3, rent_per_room: 680, rent_total: 680,  rent_min: 680,  rent_max: 680,  per_room_pricing: false, rooms: [], lease_type: "8_month", move_in_date: "2027-01-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: null, status: "active", view_count: 134, created_at: "2026-02-01T09:00:00", updated_at: "2026-02-15T10:30:00", property_id: 3, title: "Bright Studio on Gordon St", address: "220 Gordon St, Unit 4B, Guelph", property_type: "apartment", total_rooms: 1, bathrooms: 1, is_furnished: true, has_parking: false, has_laundry: false, utilities_included: true, pet_friendly: false, has_air_conditioning: true, has_wifi: true, has_dishwasher: false, has_gym: false, has_elevator: true, has_backyard: false, has_balcony: false, smoking_allowed: false, wheelchair_accessible: true, estimated_utility_cost: null, distance_to_campus_km: 0.5, walk_time_minutes: 6, bus_time_minutes: null, landlord_id: 1, landlord_name: "Sarah Mitchell", landlord_verified: true },
  { id: 4, rent_per_room: 550, rent_total: 2200, rent_min: 2200, rent_max: 2200, per_room_pricing: false, rooms: [], lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: null, status: "active", view_count: 89, created_at: "2026-02-10T16:45:00", updated_at: "2026-02-15T10:30:00", property_id: 4, title: "Renovated Bungalow on Harvard", address: "33 Harvard Rd, Guelph", property_type: "house", total_rooms: 4, bathrooms: 2, is_furnished: false, has_parking: true, has_laundry: true, utilities_included: false, pet_friendly: true, has_air_conditioning: false, has_wifi: false, has_dishwasher: true, has_gym: false, has_elevator: false, has_backyard: true, has_balcony: false, smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: 60, distance_to_campus_km: 2.5, walk_time_minutes: 18, bus_time_minutes: 8, landlord_id: 3, landlord_name: "Mike Patterson", landlord_verified: false },
  { id: 5, rent_per_room: 875, rent_total: 4375, rent_min: 4375, rent_max: 4375, per_room_pricing: false, rooms: [], lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: null, status: "active", view_count: 198, created_at: "2026-01-25T11:20:00", updated_at: "2026-02-15T10:30:00", property_id: 5, title: "Spacious House near Campus", address: "87 Edinburgh Rd S, Guelph", property_type: "house", total_rooms: 5, bathrooms: 3, is_furnished: false, has_parking: true, has_laundry: true, utilities_included: false, pet_friendly: false, has_air_conditioning: false, has_wifi: true, has_dishwasher: true, has_gym: false, has_elevator: false, has_backyard: true, has_balcony: true, smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: 50, distance_to_campus_km: 0.7, walk_time_minutes: 8, bus_time_minutes: null, landlord_id: 2, landlord_name: "David Chen", landlord_verified: true },
  { id: 6, rent_per_room: 750, rent_total: 2250, rent_min: 2250, rent_max: 2250, per_room_pricing: false, rooms: [], lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: null, status: "active", view_count: 156, created_at: "2026-02-05T13:30:00", updated_at: "2026-02-15T10:30:00", property_id: 6, title: "Modern Apartment with Balcony", address: "415 Gordon St, Unit B, Guelph", property_type: "apartment", total_rooms: 3, bathrooms: 1, is_furnished: false, has_parking: false, has_laundry: true, utilities_included: false, pet_friendly: false, has_air_conditioning: true, has_wifi: true, has_dishwasher: false, has_gym: false, has_elevator: true, has_backyard: false, has_balcony: true, smoking_allowed: false, wheelchair_accessible: false, estimated_utility_cost: 40, distance_to_campus_km: 0.9, walk_time_minutes: 10, bus_time_minutes: 4, landlord_id: 3, landlord_name: "Mike Patterson", landlord_verified: false },
  { id: 7, rent_per_room: 620, rent_total: 1860, rent_min: 1860, rent_max: 1860, per_room_pricing: false, rooms: [], lease_type: "8_month", move_in_date: "2026-05-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: null, status: "active", view_count: 67, created_at: "2026-02-12T08:00:00", updated_at: "2026-02-15T10:30:00", property_id: 7, title: "Charming Duplex with Yard", address: "90 Suffolk St W, Guelph", property_type: "townhouse", total_rooms: 3, bathrooms: 1, is_furnished: false, has_parking: false, has_laundry: false, utilities_included: false, pet_friendly: false, has_air_conditioning: false, has_wifi: false, has_dishwasher: false, has_gym: false, has_elevator: false, has_backyard: true, has_balcony: false, smoking_allowed: true, wheelchair_accessible: false, estimated_utility_cost: 50, distance_to_campus_km: 1.8, walk_time_minutes: 15, bus_time_minutes: 6, landlord_id: 1, landlord_name: "Sarah Mitchell", landlord_verified: true },
  { id: 8, rent_per_room: 780, rent_total: 1560, rent_min: 1560, rent_max: 1560, per_room_pricing: false, rooms: [], lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: null, status: "active", view_count: 203, created_at: "2026-02-08T15:00:00", updated_at: "2026-02-15T10:30:00", property_id: 8, title: "New Build near Kortright", address: "150 Kortright Rd W, Unit 210, Guelph", property_type: "apartment", total_rooms: 2, bathrooms: 1, is_furnished: true, has_parking: true, has_laundry: true, utilities_included: true, pet_friendly: false, has_air_conditioning: true, has_wifi: true, has_dishwasher: true, has_gym: true, has_elevator: true, has_backyard: false, has_balcony: true, smoking_allowed: false, wheelchair_accessible: true, estimated_utility_cost: null, distance_to_campus_km: 2.8, walk_time_minutes: 22, bus_time_minutes: 10, landlord_id: 2, landlord_name: "David Chen", landlord_verified: true },

  // ── Maple House Residences — apartment building (property_id 100, 3 unit types) ──
  { id: 101, rent_per_room: 1750, rent_total: 1750, rent_min: 1750, rent_max: 1750, per_room_pricing: false, rooms: [], unit_label: "1 Bedroom", beds: 1, baths: 1, sqft: 560, units_total: 12, units_available: 4, lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: "any", status: "active", view_count: 320, created_at: "2026-03-01T10:00:00", updated_at: "2026-03-10T10:00:00", property_id: 100, title: "Maple House Residences", address: "200 Maple St, Guelph", property_type: "apartment", total_rooms: 1, bathrooms: 1, is_furnished: true, has_parking: true, has_laundry: true, utilities_included: false, pet_friendly: true, has_air_conditioning: true, has_wifi: true, has_dishwasher: true, has_gym: true, has_elevator: true, has_backyard: false, has_balcony: true, smoking_allowed: false, wheelchair_accessible: true, estimated_utility_cost: 60, distance_to_campus_km: 0.6, walk_time_minutes: 7, bus_time_minutes: 4, drive_time_minutes: 3, landlord_id: 2, landlord_name: "David Chen", landlord_verified: true, images: [{ id: 1011, image_url: "/demo/listings/apartment.jpg", display_order: 0, is_floor_plan: false }, { id: 1012, image_url: "/demo/listings/studio.jpg", display_order: 1, is_floor_plan: false }, { id: 1013, image_url: "/demo/floorplans/1bed.svg", display_order: 2, is_floor_plan: true }] },
  { id: 102, rent_per_room: 2400, rent_total: 2400, rent_min: 2400, rent_max: 2400, per_room_pricing: false, rooms: [], unit_label: "2 Bedroom", beds: 2, baths: 1, sqft: 780, units_total: 10, units_available: 2, lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: "any", status: "active", view_count: 280, created_at: "2026-03-01T10:00:00", updated_at: "2026-03-10T10:00:00", property_id: 100, title: "Maple House Residences", address: "200 Maple St, Guelph", property_type: "apartment", total_rooms: 2, bathrooms: 1, is_furnished: true, has_parking: true, has_laundry: true, utilities_included: false, pet_friendly: true, has_air_conditioning: true, has_wifi: true, has_dishwasher: true, has_gym: true, has_elevator: true, has_backyard: false, has_balcony: true, smoking_allowed: false, wheelchair_accessible: true, estimated_utility_cost: 75, distance_to_campus_km: 0.6, walk_time_minutes: 7, bus_time_minutes: 4, drive_time_minutes: 3, landlord_id: 2, landlord_name: "David Chen", landlord_verified: true, images: [{ id: 1021, image_url: "/demo/listings/apartment.jpg", display_order: 0, is_floor_plan: false }, { id: 1022, image_url: "/demo/listings/house.jpg", display_order: 1, is_floor_plan: false }, { id: 1023, image_url: "/demo/floorplans/2bed.svg", display_order: 2, is_floor_plan: true }] },
  { id: 103, rent_per_room: 3150, rent_total: 3150, rent_min: 3150, rent_max: 3150, per_room_pricing: false, rooms: [], unit_label: "3 Bedroom", beds: 3, baths: 2, sqft: 1050, units_total: 6, units_available: 1, lease_type: "12_month", move_in_date: "2026-09-01", is_sublet: false, sublet_start_date: null, sublet_end_date: null, gender_preference: "any", status: "active", view_count: 190, created_at: "2026-03-01T10:00:00", updated_at: "2026-03-10T10:00:00", property_id: 100, title: "Maple House Residences", address: "200 Maple St, Guelph", property_type: "apartment", total_rooms: 3, bathrooms: 2, is_furnished: true, has_parking: true, has_laundry: true, utilities_included: false, pet_friendly: true, has_air_conditioning: true, has_wifi: true, has_dishwasher: true, has_gym: true, has_elevator: true, has_backyard: false, has_balcony: true, smoking_allowed: false, wheelchair_accessible: true, estimated_utility_cost: 95, distance_to_campus_km: 0.6, walk_time_minutes: 7, bus_time_minutes: 4, drive_time_minutes: 3, landlord_id: 2, landlord_name: "David Chen", landlord_verified: true, images: [{ id: 1031, image_url: "/demo/listings/apartment.jpg", display_order: 0, is_floor_plan: false }, { id: 1032, image_url: "/demo/listings/townhouse.jpg", display_order: 1, is_floor_plan: false }, { id: 1033, image_url: "/demo/floorplans/2bed.svg", display_order: 2, is_floor_plan: true }] },
];

export const mockHealthScores: Record<number, number> = {
  1: 88, 2: 92, 3: 79, 4: 86, 5: 95, 6: 81, 7: 73, 8: 91,
  101: 89, 102: 87, 103: 90,
};

export const mockHealthScoreDetails: Record<number, HealthScoreResponse> = {
  // overall_score = Price·0.30 + Location(proximity)·0.40 + Amenities·0.20 + Completeness(clarity)·0.10
  1: { id: 1, listing_id: 1, overall_score: 84, price_vs_market_score: 82, proximity_score: 86, amenity_score: 78, landlord_reputation_score: 94, maintenance_score: 85, lease_clarity_score: 90, review_count: 0, created_at: "2026-01-16T00:00:00" },
  2: { id: 2, listing_id: 2, overall_score: 91, price_vs_market_score: 95, proximity_score: 90, amenity_score: 85, landlord_reputation_score: 91, maintenance_score: 88, lease_clarity_score: 93, review_count: 0, created_at: "2026-01-21T00:00:00" },
  3: { id: 3, listing_id: 3, overall_score: 76, price_vs_market_score: 72, proximity_score: 80, amenity_score: 70, landlord_reputation_score: 94, maintenance_score: 68, lease_clarity_score: 82, review_count: 0, created_at: "2026-02-02T00:00:00" },
  4: { id: 4, listing_id: 4, overall_score: 80, price_vs_market_score: 90, proximity_score: 70, amenity_score: 80, landlord_reputation_score: 78, maintenance_score: 84, lease_clarity_score: 92, review_count: 0, created_at: "2026-02-11T00:00:00" },
  101: { id: 101, listing_id: 101, overall_score: 89, price_vs_market_score: 86, proximity_score: 94, amenity_score: 90, landlord_reputation_score: 91, maintenance_score: 88, lease_clarity_score: 92, review_count: 0, created_at: "2026-03-02T00:00:00" },
  102: { id: 102, listing_id: 102, overall_score: 87, price_vs_market_score: 84, proximity_score: 94, amenity_score: 90, landlord_reputation_score: 91, maintenance_score: 88, lease_clarity_score: 92, review_count: 0, created_at: "2026-03-02T00:00:00" },
  103: { id: 103, listing_id: 103, overall_score: 90, price_vs_market_score: 88, proximity_score: 94, amenity_score: 92, landlord_reputation_score: 91, maintenance_score: 88, lease_clarity_score: 92, review_count: 0, created_at: "2026-03-02T00:00:00" },
  5: { id: 5, listing_id: 5, overall_score: 92, price_vs_market_score: 88, proximity_score: 95, amenity_score: 88, landlord_reputation_score: 98, maintenance_score: 96, lease_clarity_score: 97, review_count: 0, created_at: "2026-01-26T00:00:00" },
  6: { id: 6, listing_id: 6, overall_score: 76, price_vs_market_score: 78, proximity_score: 75, amenity_score: 72, landlord_reputation_score: 76, maintenance_score: 88, lease_clarity_score: 82, review_count: 0, created_at: "2026-02-06T00:00:00" },
  7: { id: 7, listing_id: 7, overall_score: 71, price_vs_market_score: 85, proximity_score: 65, amenity_score: 60, landlord_reputation_score: 70, maintenance_score: 62, lease_clarity_score: 75, review_count: 0, created_at: "2026-02-13T00:00:00" },
  8: { id: 8, listing_id: 8, overall_score: 88, price_vs_market_score: 84, proximity_score: 92, amenity_score: 86, landlord_reputation_score: 96, maintenance_score: 92, lease_clarity_score: 91, review_count: 0, created_at: "2026-02-09T00:00:00" },
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

/**
 * Build a BuildingResponse from the mock apartment units sharing a property_id.
 * Used as a fallback by the building detail page when the API has no data
 * (e.g. local dev / sample buildings).
 */
export function getMockBuilding(propertyId: number): BuildingResponse | undefined {
  const units = mockListings.filter(
    (l) => l.property_id === propertyId && l.property_type === "apartment"
  );
  if (units.length === 0) return undefined;

  const sorted = [...units].sort((a, b) => Number(a.rent_total) - Number(b.rent_total));
  const first = sorted[0];
  const rents = sorted.map((u) => Number(u.rent_total)).filter((r) => r > 0);
  const beds = sorted.map((u) => (u.beds ?? u.total_rooms)).filter((b): b is number => b != null);

  const buildingImages = Array.from(
    new Set(
      sorted.flatMap((u) =>
        (u.images ?? []).filter((img) => !img.is_floor_plan).map((img) => img.image_url)
      )
    )
  ).map((url, i) => ({ id: 90000 + i, image_url: url, display_order: i, is_floor_plan: false }));

  const unitResponses: BuildingUnitResponse[] = sorted.map((u) => ({
    id: u.id,
    unit_label: u.unit_label ?? null,
    beds: u.beds ?? u.total_rooms ?? null,
    baths: u.baths ?? u.bathrooms ?? null,
    sqft: u.sqft ?? null,
    rent: Number(u.rent_total),
    lease_type: u.lease_type,
    units_total: u.units_total ?? null,
    units_available: u.units_available ?? null,
    status: u.status,
    floor_plan_image: u.images?.find((img) => img.is_floor_plan)?.image_url ?? null,
    images: (u.images ?? []).filter((img) => !img.is_floor_plan),
    overall_score: mockHealthScores[u.id] ?? null,
  }));

  return {
    id: propertyId,
    title: first.title,
    address: first.address,
    latitude: first.latitude ?? null,
    longitude: first.longitude ?? null,
    property_type: "apartment",
    price_min: rents.length ? Math.min(...rents) : null,
    price_max: rents.length ? Math.max(...rents) : null,
    bed_min: beds.length ? Math.min(...beds) : null,
    bed_max: beds.length ? Math.max(...beds) : null,
    unit_count: sorted.length,
    is_furnished: first.is_furnished,
    has_parking: first.has_parking,
    has_laundry: first.has_laundry,
    utilities_included: first.utilities_included,
    has_wifi: first.has_wifi,
    has_air_conditioning: first.has_air_conditioning,
    has_dishwasher: first.has_dishwasher,
    has_gym: first.has_gym,
    has_elevator: first.has_elevator,
    has_balcony: first.has_balcony,
    wheelchair_accessible: first.wheelchair_accessible,
    estimated_utility_cost: first.estimated_utility_cost ?? null,
    distance_to_campus_km: first.distance_to_campus_km ?? null,
    walk_time_minutes: first.walk_time_minutes ?? null,
    bus_time_minutes: first.bus_time_minutes ?? null,
    drive_time_minutes: first.drive_time_minutes ?? null,
    images: buildingImages,
    landlord_id: first.landlord_id,
    landlord_name: first.landlord_name,
    landlord_verified: first.landlord_verified,
    units: unitResponses,
  };
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
  100: { lat: 43.5298, lng: -80.2275 },
  101: { lat: 43.5298, lng: -80.2275 },
  102: { lat: 43.5298, lng: -80.2275 },
  103: { lat: 43.5298, lng: -80.2275 },
};

export type LandlordAnalyticsPeriod = "7d" | "30d" | "90d" | "all";

export interface LandlordDailyMetric {
  date: string;
  views: number;
  saves: number;
  inquiries: number;
  responseRate: number;
  responseMinutes: number;
}

export interface LandlordListingPerformance {
  listingId: number;
  propertyId: number;
  title: string;
  room: string;
  status: "active" | "draft" | "archived";
  listedAt: string;
  moveInDate: string;
  lastActivityAt: string;
  views: number;
  saves: number;
  inquiries: number;
}

export interface LandlordListingDailyMetric {
  listingId: number;
  date: string;
  views: number;
  saves: number;
  inquiries: number;
}

export interface LandlordScoreBreakdown {
  price: number;
  location: number;
  amenities: number;
  reviews: number;
}

const ANALYTICS_TODAY = new Date("2026-06-07T12:00:00-04:00");
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export const mockLandlordAnalyticsUpdatedAt = "2026-06-07T11:58:00-04:00";

export const mockLandlordDailyMetrics: LandlordDailyMetric[] = Array.from({ length: 120 }, (_, index) => {
  const daysAgo = 119 - index;
  const date = new Date(ANALYTICS_TODAY);
  date.setDate(ANALYTICS_TODAY.getDate() - daysAgo);

  const weeklyPulse = Math.sin(index / 4.2) * 8;
  const leasingSeasonLift = index > 72 ? (index - 72) * 0.42 : 0;
  const weekendDip = [0, 6].includes(date.getDay()) ? -5 : 0;
  const campaignSpike = [86, 87, 103, 104, 105].includes(index) ? 18 : 0;
  const views = Math.max(18, Math.round(42 + weeklyPulse + leasingSeasonLift + weekendDip + campaignSpike + (index % 5)));
  const saves = Math.max(2, Math.round(views * (0.13 + ((index % 7) * 0.006))));
  const inquiries = Math.max(1, Math.round(views * (0.05 + ((index % 6) * 0.004))));
  const responseRate = Math.min(98, Math.round(82 + (index / 120) * 10 + Math.sin(index / 9) * 3));
  const responseMinutes = Math.max(18, Math.round(64 - (index / 120) * 22 + Math.cos(index / 8) * 5));

  return { date: isoDate(date), views, saves, inquiries, responseRate, responseMinutes };
});

export const mockLandlordListingPerformance: LandlordListingPerformance[] = [
  {
    listingId: 1,
    propertyId: 1,
    title: "Cozy Townhouse on College Ave",
    room: "Room 1",
    status: "active",
    listedAt: "2026-04-18T10:30:00-04:00",
    moveInDate: "2026-09-01",
    lastActivityAt: "2026-06-07T10:44:00-04:00",
    views: 186,
    saves: 31,
    inquiries: 14,
  },
  {
    listingId: 3,
    propertyId: 3,
    title: "Bright Studio on Gordon St",
    room: "Studio",
    status: "active",
    listedAt: "2026-05-06T09:00:00-04:00",
    moveInDate: "2027-01-01",
    lastActivityAt: "2026-06-06T17:10:00-04:00",
    views: 118,
    saves: 19,
    inquiries: 8,
  },
  {
    listingId: 7,
    propertyId: 7,
    title: "Charming Duplex with Yard",
    room: "Room 2",
    status: "active",
    listedAt: "2026-05-22T08:00:00-04:00",
    moveInDate: "2026-07-01",
    lastActivityAt: "2026-06-07T08:16:00-04:00",
    views: 94,
    saves: 11,
    inquiries: 6,
  },
  {
    listingId: 901,
    propertyId: 1,
    title: "Cozy Townhouse on College Ave",
    room: "Room 3",
    status: "draft",
    listedAt: "2026-06-02T12:20:00-04:00",
    moveInDate: "2026-09-01",
    lastActivityAt: "2026-06-07T09:02:00-04:00",
    views: 0,
    saves: 0,
    inquiries: 0,
  },
  {
    listingId: 902,
    propertyId: 3,
    title: "Bright Studio on Gordon St",
    room: "Parking spot",
    status: "archived",
    listedAt: "2026-03-12T09:00:00-04:00",
    moveInDate: "2026-05-01",
    lastActivityAt: "2026-05-25T14:12:00-04:00",
    views: 61,
    saves: 4,
    inquiries: 2,
  },
];

export const mockLandlordListingDailyMetrics: LandlordListingDailyMetric[] = mockLandlordListingPerformance.flatMap((listing, listingIndex) => (
  Array.from({ length: 60 }, (_, index) => {
    const date = new Date(ANALYTICS_TODAY);
    date.setDate(ANALYTICS_TODAY.getDate() - (59 - index));

    if (listing.status === "draft") {
      return { listingId: listing.listingId, date: isoDate(date), views: 0, saves: 0, inquiries: 0 };
    }

    const listedDate = new Date(listing.listedAt);
    if (date < listedDate || listing.status === "archived") {
      const archivedLift = listing.status === "archived" && date < new Date("2026-05-24T00:00:00-04:00") ? 1 : 0;
      return {
        listingId: listing.listingId,
        date: isoDate(date),
        views: archivedLift ? Math.max(0, Math.round(1 + Math.sin(index / 3))) : 0,
        saves: 0,
        inquiries: 0,
      };
    }

    const age = Math.max(1, index - listingIndex * 3);
    const demand = listing.listingId === 1 ? 6.1 : listing.listingId === 3 ? 3.9 : listing.listingId === 7 ? 3.1 : 1.3;
    const weeklyPulse = Math.sin((index + listingIndex) / 4) * 1.6;
    const launchLift = age < 10 ? 2.4 : 0;
    const views = Math.max(0, Math.round(demand + weeklyPulse + launchLift + ((index + listingIndex) % 3)));
    const saves = Math.max(0, Math.round(views * (listing.listingId === 1 ? 0.18 : 0.13)));
    const inquiryCadence = listing.listingId === 1 ? 2 : listing.listingId === 3 ? 4 : listing.listingId === 7 ? 5 : 8;
    const inquiries = views > 0 && (index + listingIndex) % inquiryCadence === 0 ? 1 : 0;

    return { listingId: listing.listingId, date: isoDate(date), views, saves, inquiries };
  })
));

export const mockLandlordScoreBreakdown: LandlordScoreBreakdown = {
  price: 86,
  location: 94,
  amenities: 81,
  reviews: 90,
};

export const mockLandlordAttention = {
  viewingsThisWeek: 2,
  approachingMoveIns: 1,
};
