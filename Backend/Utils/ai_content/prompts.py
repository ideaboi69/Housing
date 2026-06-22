"""
Pillar definitions, evergreen topic seed list, and Claude prompts for each pillar.

Voice rule that applies to all pillars: short, scannable, no AI filler, no "in today's
fast-paced world" garbage. Plain student-friendly language. ~400-600 words max.
"""

from __future__ import annotations
from datetime import datetime


# ─── Pillar rotation ───────────────────────────────────────────────────────

PILLAR_ROTATION = ["deals", "events", "deals", "evergreen"]


def pick_pillar(ai_post_count: int) -> str:
    """Deterministic pillar selection based on number of AI posts so far."""
    return PILLAR_ROTATION[ai_post_count % len(PILLAR_ROTATION)]


# ─── Evergreen topic seed list ─────────────────────────────────────────────
# Pipeline picks one not used in the last N months by checking past titles.

EVERGREEN_TOPICS = [
    "How to read your Ontario lease before signing",
    "Tenant rights 101 every Guelph renter should know",
    "Surviving your first off-campus winter in Guelph",
    "Bus 101: getting around Guelph without a car",
    "Roommate dealbreakers checklist before you sign together",
    "What to inspect during an apartment viewing",
    "Setting up utilities for the first time (Alectra, Enbridge, internet)",
    "Subletting your room while you're on co-op — the basics",
    "Move-out cleaning checklist to get your deposit back",
    "What to do when your landlord won't fix something",
]


# ─── Shared voice constraints (injected into every prompt) ─────────────────

VOICE_BLOCK = """
VOICE RULES (mandatory):
- Write like a student texting another student. Casual, direct, useful.
- Short paragraphs. Bullet lists where it helps. No walls of text.
- Cap the body at ~500 words. Tight is better than long.
- No phrases like "in today's fast-paced world", "navigate the landscape",
  "elevate your experience", or any other AI cliche.
- No marketing fluff. No exclamation marks. Don't hype.
- Specific over general. "Tuesday $0.50 wings at Boston Pizza" beats
  "great deals on wings".
- Cribb voice = honest friend who's lived in Guelph for years.
- Sign off with "— The Cribb Team" at the end.

OUTPUT FORMAT (mandatory — return exactly this JSON, no preamble):
{
  "title": "Short punchy title, under 70 chars",
  "preview": "One sentence, under 160 chars, sells the click",
  "category": "DEAL" | "EVENT" | "LIFESTYLE" | "NEWS" | "FOOD" | "OTHER",
  "content": "Full markdown post body. ~400-500 words."
}
"""


# ─── Pillar-specific prompts ───────────────────────────────────────────────

def deals_prompt(scraped_sources: dict[str, str]) -> str:
    today = datetime.now().strftime("%A, %B %d, %Y")
    sources_block = "\n\n".join(
        f"=== SOURCE: {name} ===\n{content[:4000]}"
        for name, content in scraped_sources.items()
        if content.strip()
    )
    if not sources_block:
        sources_block = "(No source data available — write a general 'check these spots for student deals' post using common Guelph student knowledge.)"

    return f"""You're writing a Cribb post titled along the lines of "This Week's Guelph Student Deals" (today is {today}).

Pull 4-6 actual student-relevant deals from the scraped source data below. Each deal should be:
- A line for what + where (e.g. "$5 lunch combo at Suzy Q Burgers on Quebec St")
- A line for when it's valid (day/time, or "ongoing")
- Skip anything that's not actually a deal (just an ad, just a menu mention)

If you can't find enough real deals from the source, fill with widely-known Guelph student deals (e.g. Tim Hortons student discount, GO Transit student fare) — but mark those clearly as "ongoing student perks" so they don't look like fresh finds.

{VOICE_BLOCK}

Category MUST be "DEAL".

SCRAPED SOURCES:
{sources_block}
"""


def events_prompt(scraped_sources: dict[str, str]) -> str:
    today = datetime.now().strftime("%A, %B %d, %Y")
    sources_block = "\n\n".join(
        f"=== SOURCE: {name} ===\n{content[:4000]}"
        for name, content in scraped_sources.items()
        if content.strip()
    )
    if not sources_block:
        sources_block = "(No source data available — skip this post; respond with content explaining you couldn't find current events.)"

    return f"""You're writing a Cribb post titled along the lines of "What's On in Guelph This Week" (today is {today}).

Pull 4-6 real upcoming events from the scraped sources. Each event:
- Name + venue
- Date + time
- One-line "why a student would care"
- Free / paid (price if known)

Mix it up — campus event, downtown event, music, sports, food festival, etc. Skip anything more than 2 weeks out (we'll cover it next cycle).

{VOICE_BLOCK}

Category MUST be "EVENT".

SCRAPED SOURCES:
{sources_block}
"""


def evergreen_prompt(topic: str) -> str:
    return f"""You're writing a Cribb evergreen guide post on this topic: "{topic}"

Make it genuinely useful for a first-time Guelph student renter. Specific actionable advice, not generic. Use bullet lists for checklists, short sections for clarity. Where it makes sense, mention Guelph-specific things (Stone Road, GO Bus, specific neighbourhoods, UoG calendar, Ontario tenant law where relevant).

Avoid disclaimers like "consult a professional" — keep it practical. If it's legal-ish (tenant rights), state what the law actually says with confidence.

{VOICE_BLOCK}

Category MUST be one of: "LIFESTYLE", "OTHER". Pick the closest fit.

Topic: {topic}
"""
