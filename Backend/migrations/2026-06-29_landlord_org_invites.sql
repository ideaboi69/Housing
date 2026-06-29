-- Landlord org email invites
-- An org owner invites an agent by email; the invitee opens the tokenised link,
-- signs in/up as a landlord, and accepts to join the org (shared inbox).
--
-- Run once against the Neon database (create_all() won't add tables reliably).

CREATE TABLE IF NOT EXISTS landlord_org_invites (
    id           SERIAL PRIMARY KEY,
    org_id       INTEGER NOT NULL REFERENCES landlord_orgs(id),
    email        VARCHAR(255) NOT NULL,
    token        VARCHAR(64) NOT NULL UNIQUE,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    invited_by   INTEGER NOT NULL REFERENCES landlords(id),
    accepted_by  INTEGER REFERENCES landlords(id),
    created_at   TIMESTAMPTZ DEFAULT now(),
    accepted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_org_invites_token ON landlord_org_invites (token);
CREATE INDEX IF NOT EXISTS ix_org_invites_org   ON landlord_org_invites (org_id);
