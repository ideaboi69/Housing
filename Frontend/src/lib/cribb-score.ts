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
  { lat: 43.5015, lng: -80.2238 }, // Zehrs/Longos (Pergola Commons — south end)
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

/**
 * Bus-time scoring (primary signal for campus distance in Guelph).
 *
 * Walking isn't realistic here — closest off-campus housing is ~30 min walk in
 * the best case — and driving varies wildly by who has a car. Bus time is the
 * universal student commute measure, so it anchors the location score.
 *
 *   ≤ 12 min → 95 (golden zone, near-campus residences)
 *   ≤ 15 min → 90 (still golden)
 *   ≤ 22 min → 82 (comfy 80s)
 *   ≤ 30 min → 75 (high 70s)
 *   ≤ 40 min → 68 (low 70s / high 60s)
 *   41 min+  → 50 (capped — doesn't keep falling)
 */
function busScore(minutes: number): number {
  if (minutes <= 12) return 95;
  if (minutes <= 15) return 90;
  if (minutes <= 22) return 82;
  if (minutes <= 30) return 75;
  if (minutes <= 40) return 68;
  return 50;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Composite Location score.
 *
 * Campus distance is scored via bus time (see {@link busScore}). When bus time
 * isn't available we fall back to a haversine distance estimate so the score
 * still works on older mock rows.
 *
 * Weights: campus 60% + groceries 25% + downtown 15%.
 */
export function computeLocationScore(opts: {
  lat?: number | null;
  lng?: number | null;
  busMinutes?: number | null;
  walkMinutes?: number | null;
  distanceKm?: number | null;
}): number {
  const { lat, lng, busMinutes, walkMinutes, distanceKm } = opts;

  let campus: number;
  if (busMinutes != null && busMinutes > 0) {
    campus = busScore(busMinutes);
  } else if (walkMinutes != null && walkMinutes > 0 && walkMinutes <= 20) {
    // Treat a very short walk as roughly equivalent to a short bus ride —
    // anyone walking under 20 min is effectively in the golden zone.
    campus = busScore(Math.max(8, walkMinutes - 4));
  } else if (distanceKm != null && distanceKm > 0) {
    campus = distanceScore(distanceKm);
  } else if (lat != null && lng != null) {
    campus = distanceScore(haversineKm({ lat, lng }, CAMPUS));
  } else {
    campus = 50;
  }

  let grocery = 50;
  let downtown = 50;
  if (lat != null && lng != null) {
    grocery = distanceScore(Math.min(...GROCERIES.map((g) => haversineKm({ lat, lng }, g))));
    downtown = distanceScore(haversineKm({ lat, lng }, DOWNTOWN));
  }

  return round1(campus * 0.6 + grocery * 0.25 + downtown * 0.15);
}

/**
 * Per-amenity weights for the amenity sub-score.
 *
 * The weights reflect what actually matters for Guelph student rentals:
 *   - Laundry is the top priority
 *   - has_air_conditioning covers AC *and* heating — they're the same HVAC
 *     system here, so the field doubles as a climate-control signal
 *   - Furnished is a bonus when present and *doesn't penalize* when absent
 *     (see {@link computeAmenityScore}) — most Guelph rentals aren't furnished
 *   - Utilities-included is a billing convenience (rent vs. pay separately),
 *     weighted moderately — becoming the norm so its absence shouldn't crush
 *   - Wifi same story — increasingly bundled
 *   - Parking sits middle (some students need it, many don't)
 *   - Gym and smoking-allowed are intentionally excluded
 */
const AMENITY_WEIGHTS = {
  has_laundry: 20,
  has_air_conditioning: 22, // AC + heating share this signal
  is_furnished: 12, // bonus only — see scoring rules below
  utilities_included: 10,
  has_wifi: 8,
  has_dishwasher: 8,
  has_parking: 5,
  pet_friendly: 4,
  has_elevator: 3,
  has_backyard: 3,
  has_balcony: 2,
  wheelchair_accessible: 3,
} as const;

type AmenityWeightKey = keyof typeof AMENITY_WEIGHTS;

// Kept exported for any callers that imported the old constant.
const AMENITY_KEYS = Object.keys(AMENITY_WEIGHTS) as AmenityWeightKey[];

/**
 * Amenity score.
 *
 * Each amenity earns its weight in points when present. The final score is
 * `earned / earnable * 100`. The trick: a missing `is_furnished` is excluded
 * from *both* sides, so unfurnished places can still reach 100 by nailing the
 * rest of the list — they aren't artificially capped just for matching the
 * Guelph norm of being unfurnished.
 */
export function computeAmenityScore(
  amenities: Partial<Record<AmenityWeightKey, boolean>>,
  petFriendly?: boolean
): number {
  let earned = 0;
  let earnable = 0;

  for (const key of AMENITY_KEYS) {
    const weight = AMENITY_WEIGHTS[key];
    const present = key === "pet_friendly" ? Boolean(petFriendly) : Boolean(amenities[key]);

    if (key === "is_furnished") {
      // Furnished: pure bonus. Counts toward both numerator and denominator
      // only when present, so its absence never pulls the score down.
      if (present) {
        earned += weight;
        earnable += weight;
      }
      continue;
    }

    earnable += weight;
    if (present) earned += weight;
  }

  if (earnable === 0) return 0;
  return round1((earned / earnable) * 100);
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
