from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from tables import get_db, User, Landlord, Property, Listing, Review, HousingHealthScore
from Schemas.healthscoreSchema import HealthScoreResponse
from Utils.security import get_current_user
from helpers import compute_price_vs_market, compute_landlord_reputation, compute_maintenance_score, compute_lease_clarity, compute_amenity_score, compute_proximity_score, compute_overall_score, compute_and_save

health_score_router = APIRouter()

# Calculate score for listing
@health_score_router.post("/{listing_id}/compute", response_model=HealthScoreResponse, status_code=status.HTTP_200_OK)
def compute_health_score(listing_id: int, db: Session = Depends(get_db)):
    """Compute (or recompute) the Cribb Score for a listing."""
    result = compute_and_save(listing_id, db)
    return HealthScoreResponse.model_validate(result)
 
# Get score for a listing (public)
@health_score_router.get("/{listing_id}", response_model=HealthScoreResponse)
def get_health_score(listing_id: int, db: Session = Depends(get_db)):
    score = db.query(HousingHealthScore).filter(HousingHealthScore.listing_id == listing_id).first()
    if not score:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health score not computed yet for this listing")

    return HealthScoreResponse.model_validate(score)