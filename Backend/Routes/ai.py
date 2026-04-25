from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from tables import get_db, User, Listing, Property, Landlord, HousingHealthScore
from Utils.security import get_current_student
from Utils.rate_limit import limiter
from Schemas.aiSchema import CompareRequest, CompareResponse
from config import settings
from helpers import build_listing_prompt_data
import anthropic

ai_router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

@ai_router.post("/compare", response_model=CompareResponse)
@limiter.limit("10/hour")
def compare_listings(request: Request, payload: CompareRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    if not current_user.email_verified:
        raise HTTPException(status_code=403, detail="Verify your email to use AI comparison")

    if len(payload.listing_ids) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 listings to compare")
    if len(payload.listing_ids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 listings per comparison")

    # Remove duplicates
    listing_ids = list(set(payload.listing_ids))

    # Fetch all listings with their property and landlord data
    listings_data = []
    for lid in listing_ids:
        listing = db.query(Listing).filter(Listing.id == lid).first()
        if not listing:
            raise HTTPException(status_code=404, detail=f"Listing {lid} not found")

        prop = db.query(Property).filter(Property.id == listing.property_id).first()
        if not prop:
            continue

        landlord = db.query(Landlord).filter(Landlord.id == prop.landlord_id).first()
        if not landlord:
            continue

        health_score = db.query(HousingHealthScore).filter(
            HousingHealthScore.listing_id == lid
        ).first()
        score = health_score.total_score if health_score else None

        listings_data.append(build_listing_prompt_data(listing, prop, landlord, score))

    if len(listings_data) < 2:
        raise HTTPException(status_code=400, detail="Could not find enough valid listings to compare")

    # Build the prompt
    listings_text = "\n\n".join(listings_data)

    prompt = f"""You are a helpuful and very experienced housing advisor for University of Guelph students. Compare these {len(listings_data)} rental listings and provide a clear, concise summary.

{listings_text}

Provide your comparison in this format:
1. A brief overview of all listings (2-3 sentences)
2. Key differences (rent, location, amenities, distance to campus, commute to campus)
3. Pros and cons for each listing (keep it short — 2-3 bullet points each)
4. Your recommendation based on best overall value for a student

Keep the tone friendly and helpful. Be specific with numbers and details. Keep the entire response under 400 words."""

    # Call Claude API
    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            messages=[
                {"role": "user", "content": prompt}
            ],
        )
        summary = message.content[0].text

    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail="AI comparison service temporarily unavailable")
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate comparison")

    return CompareResponse(
        summary=summary,
        listings_compared=len(listings_data),
    )