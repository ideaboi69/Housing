/**
 * Single source of truth for landlord-facing listing status display + bucketing.
 * Replaces the copies that were duplicated across the dashboard and property pages.
 *
 * Lifecycle: draft → under_review → active, plus rented/expired (archived).
 */

export type ListingStatusBucket = "active" | "draft" | "review" | "archived";

export function getListingStatusBucket(status: string): ListingStatusBucket {
  const s = status.toLowerCase();
  if (s === "active") return "active";
  if (s === "under_review") return "review";
  if (s === "draft" || s === "pending") return "draft";
  return "archived";
}

export function getListingStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === "active") return "Active";
  if (s === "under_review") return "Under Review";
  if (s === "draft" || s === "pending") return "Draft";
  if (s === "rented" || s === "leased") return "Rented";
  if (s === "expired") return "Expired";
  if (s === "archived") return "Archived";
  return s.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

/** Tailwind classes for a status pill, keyed off the bucket. */
export function getListingStatusTone(status: string): string {
  switch (getListingStatusBucket(status)) {
    case "active":
      return "bg-[#4ADE80]/10 text-[#239B55]";
    case "review":
      return "bg-[#FFB627]/15 text-[#A66A00]";
    case "draft":
      return "bg-[#E9EEF7] text-[#1B2D45]";
    default:
      return "bg-[#1B2D45]/[0.06] text-[#1B2D45]/70";
  }
}

/** Active listings can be taken down; draft/under-review/expired can be published. */
export function isToggleableStatus(status: string): boolean {
  const bucket = getListingStatusBucket(status);
  return bucket === "active" || bucket === "draft" || bucket === "review" || status.toLowerCase() === "expired";
}
