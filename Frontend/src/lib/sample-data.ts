/**
 * Seeded demo rows shown during onboarding to showcase the UI.
 * These are real DB records (so every link/action works) but are clearly
 * badged as samples. Update the ids if the demo rows are re-seeded.
 */
export const SAMPLE_IDS = {
  listings: [13],
  sublets: [15],
  marketplace: [12],
} as const;

export const isSampleListing = (id: number | string) => SAMPLE_IDS.listings.includes(Number(id) as never);
export const isSampleSublet = (id: number | string) => SAMPLE_IDS.sublets.includes(Number(id) as never);
export const isSampleMarketplaceItem = (id: number | string) => SAMPLE_IDS.marketplace.includes(Number(id) as never);
