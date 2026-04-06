from datetime import datetime
from typing import Optional
from pydantic import BaseModel

# Response
class HealthScoreResponse(BaseModel):
    id: int
    listing_id: int
    price_vs_market_score: Optional[float] = None
    landlord_reputation_score: Optional[float] = None
    maintenance_score: Optional[float] = None
    lease_clarity_score: Optional[float] = None
    amenity_score: Optional[float] = None
    proximity_score: Optional[float] = None
    review_count: int = 0
    overall_score: Optional[float] = None
    created_at: datetime
 
    class Config:
        from_attributes = True