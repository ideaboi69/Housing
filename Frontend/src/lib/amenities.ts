import {
  Shirt, Car, Droplets, Zap, Dog, Snowflake, Wifi, UtensilsCrossed,
  Dumbbell, ArrowUpFromLine, Trees, Sun, Cigarette, Accessibility,
} from "lucide-react";

/**
 * STANDARD AMENITIES — single source of truth.
 * Used by both listing detail and sublet detail pages.
 * Every property/sublet is evaluated against this exact checklist.
 */
export const STANDARD_AMENITIES = [
  { key: "is_furnished", label: "Furnished", icon: Shirt, category: "essentials" },
  { key: "has_parking", label: "Parking", icon: Car, category: "essentials" },
  { key: "has_laundry", label: "In-Unit Laundry", icon: Droplets, category: "essentials" },
  { key: "utilities_included", label: "Utilities Included", icon: Zap, category: "essentials" },
  { key: "pet_friendly", label: "Pet Friendly", icon: Dog, category: "essentials" },
  { key: "has_air_conditioning", label: "Air Conditioning", icon: Snowflake, category: "comfort" },
  { key: "has_wifi", label: "WiFi Included", icon: Wifi, category: "comfort" },
  { key: "has_dishwasher", label: "Dishwasher", icon: UtensilsCrossed, category: "comfort" },
  { key: "has_gym", label: "Gym / Fitness", icon: Dumbbell, category: "building" },
  { key: "has_elevator", label: "Elevator", icon: ArrowUpFromLine, category: "building" },
  { key: "has_backyard", label: "Backyard / Yard", icon: Trees, category: "outdoor" },
  { key: "has_balcony", label: "Balcony / Patio", icon: Sun, category: "outdoor" },
  { key: "smoking_allowed", label: "Smoking Allowed", icon: Cigarette, category: "policy" },
  { key: "wheelchair_accessible", label: "Wheelchair Accessible", icon: Accessibility, category: "policy" },
] as const;

export type AmenityKey = typeof STANDARD_AMENITIES[number]["key"];

/**
 * Given any record with amenity boolean keys, returns the full checklist
 * with has/hasn't for each amenity.
 */
export function getAmenityChecklist(data: Record<string, unknown>): { key: string; label: string; icon: typeof Shirt; has: boolean; category: string }[] {
  return STANDARD_AMENITIES.map((a) => ({
    ...a,
    has: data[a.key] === true,
  }));
}