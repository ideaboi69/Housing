-- In-app notifications feed for students (Bubble replies/comments, extensible). Run once.
CREATE TABLE IF NOT EXISTS notifications (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(40) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    body        VARCHAR(500),
    link        VARCHAR(500),
    actor_name  VARCHAR(160),
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_notifications_user ON notifications(user_id, is_read);
