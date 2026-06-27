/**
 * Cribb Score (frontend mirror of Backend/helpers.py).
 *
 * Property Score = Price 30% + Location 40% + Amenities 20% + Completeness 10%
 * Location       = Campus 60% + Groceries 25% + Downtown 15%
 * Gym is intentionally excluded from the math (informational only).
 *
 * With < 3 reviews the overall score is 100% Property Score, which is the
 * case for all mock/demo content — so this util returns the property score.
 */

export const CRIBB_WEIGHTS = {
  price: 0.3,
  location: 0.4,
  amenity: 0.2,
  completeness: 0.1,
} as const;

// Fixed Guelph reference points (kept in sync with the backend).
const CAMPUS = { lat: 43.5327, lng: -80.2261 }; // University Centre
const DOWNTOWN = { lat: 43.5448, lng: -80.2482 };
const GROCERIES = [
  { lat: 43.5185, lng: -80.2523 }, // Zehrs (Stone Road)
  { lat: 43.5148, lng: -80.256 }, // Walmart Supercentre
  { lat: 43.546, lng: -80.231 }, // FreshCo (Eramosa)
  { lat: 43.542, lng: -80.271 }, // Metro (Paisley)
  { lat: 43.558, lng: -80.253 }, // Food Basics (Speedvale)
];

// Rough Guelph sublet/room market baseline used for the price sub-score in
// mock content (the backend compares against live same-type listing averages).
export const MARKET_RENT_BASELINE = 850;

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function distanceScore(km: number): number {
  if (km <= 0.5) return 100;
  if (km <= 1.0) return 90;
  if (km <= 2.0) return 75;
  if (km <= 3.0) return 60;
  if (km <= 5.0) return 40;
  return 20;
}

function walkScore(minutes: number): number {
  if (minutes <= 10) return 100;
  if (minutes <= 15) return 90;
  if (minutes <= 20) return 75;
  if (minutes <= 30) return 60;
  if (minutes <= 45) return 40;
  return 20;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Composite Location score: campus 50% + groceries 25% + downtown 25%. */
export function computeLocationScore(opts: {
  lat?: number | null;
  lng?: number | null;
  walkMinutes?: number | null;
  distanceKm?: number | null;
}): number {
  const { lat, lng, walkMinutes, distanceKm } = opts;

  let campus: number;
  if (walkMinutes != null && walkMinutes > 0) campus = walkScore(walkMinutes);
  else if (distanceKm != null && distanceKm > 0) campus = distanceScore(distanceKm);
  else if (lat != null && lng != null) campus = distanceScore(haversineKm({ lat, lng }, CAMPUS));
  else campus = 50;

  let grocery = 50;
  let downtown = 50;
  if (lat != null && lng != null) {
    grocery = distanceScore(Math.min(...GROCERIES.map((g) => haversineKm({ lat, lng }, g))));
    downtown = distanceScore(haversineKm({ lat, lng }, DOWNTOWN));
  }

  return round1(campus * 0.6 + grocery * 0.25 + downtown * 0.15);
}

// Amenity fields that count toward the score (gym excluded).
const AMENITY_KEYS = [
  "is_furnished",
  "has_parking",
  "has_laundry",
  "utilities_included",
  "has_wifi",
  "has_air_conditioning",
  "has_dishwasher",
  "has_elevator",
  "has_backyard",
  "has_balcony",
  "wheelchair_accessible",
] as const;

/** Amenity score: base 20 + share of amenities present (incl. pet-friendliness). */
export function computeAmenityScore(
  amenities: Partial<Record<(typeof AMENITY_KEYS)[number], boolean>>,
  petFriendly?: boolean
): number {
  const total = AMENITY_KEYS.length + 1; // +1 for the pet slot
  let count = AMENITY_KEYS.reduce((n, key) => n + (amenities[key] ? 1 : 0), 0);
  if (petFriendly) count += 1;
  return round1(20 + (count / total) * 80);
}

/** Price-vs-market score. Cheaper than baseline → higher. */
export function computePriceScore(rent: number, marketAvg = MARKET_RENT_BASELINE): number {
  if (!marketAvg) return 50;
  const ratio = rent / marketAvg;
  return round1(Math.max(0, Math.min(100, 100 - (ratio - 0.5) * 100)));
}

/** Listing completeness: share of the provided presence-checks that pass. */
export function computeCompletenessScore(checks: boolean[]): number {
  if (checks.length === 0) return 50;
  const passed = checks.filter(Boolean).length;
  return round1((passed / checks.length) * 100);
}

/** Combine the four property sub-scores into the overall Cribb Score. */
export function computeOverallScore(parts: {
  price: number;
  location: number;
  amenity: number;
  completeness: number;
}): number {
  return Math.round(
    parts.price * CRIBB_WEIGHTS.price +
      parts.location * CRIBB_WEIGHTS.location +
      parts.amenity * CRIBB_WEIGHTS.amenity +
      parts.completeness * CRIBB_WEIGHTS.completeness
  );
}

type ReviewRatings = {
  responsiveness: number;
  maintenance_speed: number;
  respect_privacy: number;
  fairness_of_charges: number;
};

/** Average of the four review categories (1-5) scaled to 0-100. Null when no reviews. */
export function computeReviewScore(reviews: ReviewRatings[]): number | null {
  if (reviews.length === 0) return null;
  const avg =
    reviews.reduce(
      (sum, r) =>
        sum +
        (r.responsiveness + r.maintenance_speed + r.respect_privacy + r.fairness_of_charges) / 4,
      0
    ) / reviews.length;
  return Math.round(((avg - 1) / 4) * 100);
}

/**
 * Blend the property score with the tenant-review score using the same dynamic
 * weighting as the backend:
 *   < 3 reviews → 100% property (reviews shown but don't count yet)
 *   3-4 reviews → 70% property / 30% reviews
 *   5+ reviews  → 50% / 50%
 */
export function blendWithReviews(
  propertyScore: number,
  reviewScore: number | null,
  reviewCount: number
): number {
  if (reviewCount < 3 || reviewScore == null) return Math.round(propertyScore);
  if (reviewCount < 5) return Math.round(propertyScore * 0.7 + reviewScore * 0.3);
  return Math.round(propertyScore * 0.5 + reviewScore * 0.5);
}
