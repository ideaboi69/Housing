"""
Claude call + JSON parse for AI-generated Bubble posts.
"""

from __future__ import annotations
import json
import logging
import re
from typing import TypedDict

import anthropic
from config import settings

logger = logging.getLogger(__name__)


class GeneratedPost(TypedDict):
    title: str
    preview: str
    category: str
    content: str


# Sonnet is the sweet spot for content gen — Haiku is too lossy, Opus is overkill.
MODEL = "claude-sonnet-4-6"


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def _extract_json(text: str) -> dict:
    """Pull the first JSON object out of the response, tolerating prose around it."""
    # Try direct parse first
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try code-fenced JSON block
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence_match:
        return json.loads(fence_match.group(1))

    # Fallback: greedy match on outer braces
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        return json.loads(brace_match.group(0))

    raise ValueError(f"Could not extract JSON from Claude response: {text[:200]}")


def generate_post(prompt: str) -> GeneratedPost:
    """Send a prompt to Claude, parse the JSON-formatted response, return a typed dict."""
    client = _client()
    response = client.messages.create(
        model=MODEL,
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    text_blocks = [b.text for b in response.content if hasattr(b, "text")]
    raw = "\n".join(text_blocks)

    parsed = _extract_json(raw)

    # Validate required keys
    for key in ("title", "preview", "category", "content"):
        if key not in parsed:
            raise ValueError(f"Generated post missing required field: {key}")

    # Normalize category
    allowed = {"DEAL", "EVENT", "LIFESTYLE", "NEWS", "FOOD", "OTHER"}
    if parsed["category"] not in allowed:
        logger.warning(f"Unexpected category '{parsed['category']}', defaulting to OTHER")
        parsed["category"] = "OTHER"

    # Clamp lengths
    parsed["title"] = parsed["title"][:255]
    parsed["preview"] = parsed["preview"][:500]

    return {
        "title": parsed["title"],
        "preview": parsed["preview"],
        "category": parsed["category"],
        "content": parsed["content"],
    }
