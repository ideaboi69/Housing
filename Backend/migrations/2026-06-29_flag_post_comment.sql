-- Allow flagging Bubble comments (report → moderation). Run once.
ALTER TABLE flags ADD COLUMN IF NOT EXISTS post_comment_id INTEGER REFERENCES post_comments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS ix_flags_post_comment ON flags(post_comment_id);
