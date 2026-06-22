"""
Firecrawl wrappers for the Cribb AI content pipeline.

Each source has its own scrape function so we can shape the output for the LLM
prompt (deals vs events vs news). Each returns a list of structured items.
Failures degrade gracefully — a dead source returns [] so the pipeline keeps going.
"""

from __future__ import annotations
import logging
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)


def _client():
    """Lazy import + initialize so a missing key only blows up at runtime."""
    if not settings.FIRECRAWL_API_KEY:
        raise RuntimeError("FIRECRAWL_API_KEY is not configured")
    from firecrawl import FirecrawlApp
    return FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)


def _safe_scrape(url: str, *, only_main: bool = True) -> Optional[str]:
    """Returns markdown content or None on failure."""
    try:
        app = _client()
        result = app.scrape_url(url, params={"formats": ["markdown"], "onlyMainContent": only_main})
        # Firecrawl returns {"markdown": "...", "metadata": {...}}
        if isinstance(result, dict):
            return result.get("markdown") or result.get("content")
        return None
    except Exception as e:
        logger.warning(f"Firecrawl scrape failed for {url}: {e}")
        return None


# ─── Source-specific scrapers ──────────────────────────────────────────────

def scrape_uoguelph_subreddit() -> str:
    """r/uoguelph for student-mentioned deals, events, and chatter."""
    url = "https://www.reddit.com/r/uoguelph/.json?limit=25"
    md = _safe_scrape(url, only_main=False)
    return md or ""


def scrape_downtown_guelph_events() -> str:
    """Downtown Guelph BIA events calendar."""
    md = _safe_scrape("https://downtownguelph.com/events/")
    return md or ""


def scrape_eventbrite_guelph() -> str:
    """Eventbrite events in Guelph."""
    md = _safe_scrape("https://www.eventbrite.ca/d/canada--guelph/events/")
    return md or ""


def scrape_uoguelph_news() -> str:
    """Official UoG news for campus announcements."""
    md = _safe_scrape("https://news.uoguelph.ca/")
    return md or ""


# ─── Bundles per pillar ────────────────────────────────────────────────────

def gather_deals_sources() -> dict[str, str]:
    """Sources that tend to surface deals / discounts."""
    return {
        "r/uoguelph": scrape_uoguelph_subreddit(),
    }


def gather_events_sources() -> dict[str, str]:
    """Sources for what's happening in Guelph."""
    return {
        "Downtown Guelph BIA": scrape_downtown_guelph_events(),
        "Eventbrite Guelph": scrape_eventbrite_guelph(),
        "UoG News": scrape_uoguelph_news(),
    }
