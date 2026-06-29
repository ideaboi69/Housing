-- Apartment building-level bed/bath ranges.
-- Landlord manually enters these for apartments (e.g. "1-3 bed · 1-2 bath").
-- They override the values computed from active unit listings in the
-- BuildingResponse, and are NULL for houses / rooms / townhouses (which
-- continue to use Property.total_rooms / bathrooms directly).
--
-- Run once against the Neon database. create_all() does NOT add columns to
-- existing tables, so this must be applied manually.

ALTER TABLE properties ADD COLUMN IF NOT EXISTS bed_min  INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bed_max  INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bath_min INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bath_max INTEGER;
