-- Landlord organizations (property-management teams)
-- A landlord_org groups multiple landlord logins (agents) under one company so
-- they share a single inbox. Solo landlords keep org_id NULL and are unaffected.
--
-- Run once against the Neon database. create_all() does NOT add tables/columns
-- to an existing schema reliably, so apply this manually.

CREATE TABLE IF NOT EXISTS landlord_orgs (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE landlords ADD COLUMN IF NOT EXISTS org_id   INTEGER REFERENCES landlord_orgs(id);
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS org_role VARCHAR(20);

CREATE INDEX IF NOT EXISTS ix_landlords_org ON landlords (org_id);
