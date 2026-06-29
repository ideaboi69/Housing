-- Property description / overview
-- Adds a free-text overview to the properties table, surfaced on the frontend
-- as "About this home" (houses / rooms / townhouses) or "Building Overview"
-- (apartment buildings). NULL until the landlord writes one.
--
-- Run once against the Neon database. create_all() does NOT add columns to
-- existing tables, so this must be applied manually.

ALTER TABLE properties ADD COLUMN IF NOT EXISTS description TEXT;
