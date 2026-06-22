"""
End-to-end Cribb AI content pipeline.

Cron entry-point: `run_biweekly_generation()`.
Flow: pick pillar → gather sources → generate → insert as DRAFT → email review link.
"""

from __future__ import annotations
import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from tables import Local_Session, Writer, Post
from Schemas.postSchema import PostCategory, PostStatus
from config import settings
from Utils.email import send_cribb_draft_review_email

from .prompts import (
    pick_pillar,
    deals_prompt,
    events_prompt,
    evergreen_prompt,
    EVERGREEN_TOPICS,
)
from .scraper import gather_deals_sources, gather_events_sources
from .generator import generate_post, GeneratedPost

logger = logging.getLogger(__name__)


# ─── Helpers ───────────────────────────────────────────────────────────────

def _get_ai_writer(db: Session) -> Writer | None:
    """Look up the official Cribb writer by configured email."""
    writer = db.query(Writer).filter(Writer.email == settings.CRIBB_AI_WRITER_EMAIL).first()
    if not writer:
        logger.error(f"AI writer not found (email={settings.CRIBB_AI_WRITER_EMAIL})")
        return None
    if not writer.is_official:
        logger.error(f"Writer {writer.email} found but is_official=False")
        return None
    return writer


def _count_ai_posts(db: Session, writer_id: int) -> int:
    """Pillar rotation uses total AI-generated post count under the Cribb writer."""
    return db.query(Post).filter(Post.writer_id == writer_id, Post.is_ai_draft == True).count()  # noqa: E712


def _pick_evergreen_topic(db: Session, writer_id: int) -> str:
    """Choose an evergreen topic that hasn't been used in the last 6 months."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=180)
    recent_titles = {
        t for (t,) in db.query(Post.title).filter(
            Post.writer_id == writer_id,
            Post.created_at >= cutoff,
        ).all()
    }
    # Pick first topic whose title isn't a near-match in recent posts
    for topic in EVERGREEN_TOPICS:
        if not any(topic.lower() in title.lower() for title in recent_titles):
            return topic
    # All recently used → fall back to least-recent
    return EVERGREEN_TOPICS[0]


def _slugify(title: str) -> str:
    base = "".join(c.lower() if c.isalnum() else "-" for c in title).strip("-")
    base = "-".join(filter(None, base.split("-")))[:80] or "cribb-post"
    return f"{base}-{uuid.uuid4().hex[:6]}"


def _insert_draft(db: Session, writer: Writer, post_data: GeneratedPost) -> Post:
    category_enum = PostCategory[post_data["category"]]
    post = Post(
        title=post_data["title"],
        slug=_slugify(post_data["title"]),
        content=post_data["content"],
        preview=post_data["preview"],
        category=category_enum,
        writer_id=writer.id,
        status=PostStatus.DRAFT,
        is_ai_draft=True,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


# ─── Main entry point ──────────────────────────────────────────────────────

def run_biweekly_generation() -> None:
    """Called by APScheduler. Idempotent — safe to retry."""
    logger.info("Cribb AI bi-weekly generation starting")
    db: Session = Local_Session()
    try:
        writer = _get_ai_writer(db)
        if not writer:
            return  # already logged

        post_count = _count_ai_posts(db, writer.id)
        pillar = pick_pillar(post_count)
        logger.info(f"Pillar selected: {pillar} (post count: {post_count})")

        # Build prompt based on pillar
        if pillar == "deals":
            sources = gather_deals_sources()
            if not any(v.strip() for v in sources.values()):
                logger.warning("All deal sources returned empty — generating with fallback")
            prompt = deals_prompt(sources)
        elif pillar == "events":
            sources = gather_events_sources()
            if not any(v.strip() for v in sources.values()):
                logger.warning("All event sources returned empty — skipping this cycle")
                return
            prompt = events_prompt(sources)
        elif pillar == "evergreen":
            topic = _pick_evergreen_topic(db, writer.id)
            logger.info(f"Evergreen topic: {topic}")
            prompt = evergreen_prompt(topic)
        else:
            logger.error(f"Unknown pillar: {pillar}")
            return

        # Generate via Claude
        try:
            post_data = generate_post(prompt)
        except Exception as e:
            logger.exception(f"Claude generation failed: {e}")
            return

        # Insert as DRAFT
        post = _insert_draft(db, writer, post_data)
        logger.info(f"Draft inserted: id={post.id}, title={post.title[:60]}")

        # Email review link
        try:
            edit_url = f"{settings.FRONTEND_URL}/writer?edit={post.id}"
            send_cribb_draft_review_email(
                to_email=settings.CRIBB_REVIEW_EMAIL,
                title=post.title,
                preview=post.preview or "",
                category=post.category.value,
                pillar=pillar,
                edit_url=edit_url,
            )
            logger.info(f"Review email sent to {settings.CRIBB_REVIEW_EMAIL}")
        except Exception as e:
            logger.exception(f"Review email failed: {e}")
            # Don't roll back — draft is saved, OJ can find it manually

    finally:
        db.close()
