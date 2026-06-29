-- Apartment listings (2-level: building -> unit types)
-- Adds per-unit-type fields to the listings table. For apartment buildings,
-- each listing row is a unit type / floor plan (e.g. "1 Bed", "Studio").
-- These columns stay NULL for houses/rooms/townhouses, which continue to use
-- the parent property's total_rooms / bathrooms.
--
-- Run once against the Neon database. create_all() does NOT add columns to
-- existing tables, so this must be applied manually.

ALTER TABLE listings ADD COLUMN IF NOT EXISTS unit_label      VARCHAR(80);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS beds            INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS baths           INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sqft            INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS units_total     INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS units_available INTEGER;
