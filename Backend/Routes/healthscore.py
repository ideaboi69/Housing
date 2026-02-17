from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from tables import get_db, User, Landlord, Property, Listing, Review, HousingHealthScore
from Schemas.healthscoreSchema import HealthScoreResponse
from Utils.security import get_current_user
from helpers import compute_price_vs_market, compute_landlord_reputation, compute_maintenance_score, compute_lease_clarity, compute_overall_score

health_score_router = APIRouter()

# Calculate score for listing
@health_score_router.post("/{listing_id}/compute", response_model=HealthScoreResponse, status_code=status.HTTP_200_OK)
def compute_health_score(listing_id: int, db: Session = Depends(get_db)):
    """Compute (or recompute) the housing health score for a listing."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    prop = db.query(Property).filter(Property.id == listing.property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    landlord_id = prop.landlord_id

    # compute all sub-scores
    price_score = compute_price_vs_market(listing, db)
    reputation_score = compute_landlord_reputation(landlord_id, db)
    maintenance_score = compute_maintenance_score(landlord_id, db)
    clarity_score = compute_lease_clarity(listing, prop)
    overall = compute_overall_score(price_score, reputation_score, maintenance_score, clarity_score)

    # upsert: update existing or create new
    existing = db.query(HousingHealthScore).filter(HousingHealthScore.listing_id == listing_id).first()

    if existing:
        existing.price_vs_market_score = price_score
        existing.landlord_reputation_score = reputation_score
        existing.maintenance_score = maintenance_score
        existing.lease_clarity_score = clarity_score
        existing.overall_score = overall
        existing.created_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return HealthScoreResponse.model_validate(existing)
    else:
        health_score = HousingHealthScore(
            listing_id=listing_id,
            price_vs_market_score=price_score,
            landlord_reputation_score=reputation_score,
            maintenance_score=maintenance_score,
            lease_clarity_score=clarity_score,
            overall_score=overall,
            created_at=datetime.utcnow(),
        )
        db.add(health_score)
        db.commit()
        db.refresh(health_score)
        return HealthScoreResponse.model_validate(health_score)

# Get score for a listing (public)
@health_score_router.get("/{listing_id}", response_model=HealthScoreResponse)
def get_health_score(listing_id: int, db: Session = Depends(get_db)):
    score = db.query(HousingHealthScore).filter(HousingHealthScore.listing_id == listing_id).first()
    if not score:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health score not computed yet for this listing")

    return HealthScoreResponse.model_validate(score)