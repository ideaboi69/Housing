-- Bubble post comments (replies) + comment likes/upvotes.
-- Students and writers can reply to posts; one level of threading. Run once.

CREATE TABLE IF NOT EXISTS post_comments (
    id                SERIAL PRIMARY KEY,
    post_id           INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES post_comments(id) ON DELETE CASCADE,
    content           TEXT NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_post_comments_post   ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS ix_post_comments_parent ON post_comments(parent_comment_id);

CREATE TABLE IF NOT EXISTS post_comment_likes (
    id         SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS ix_post_comment_likes_comment ON post_comment_likes(comment_id);
