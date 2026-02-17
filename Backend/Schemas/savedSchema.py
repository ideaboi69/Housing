from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel

class SavedListingResponse(BaseModel):
    id: int
    student_id: int
    listing_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SavedListingDetailResponse(BaseModel):
    """Saved listing with full listing + property info baked in."""
    id: int
    listing_id: int
    saved_at: datetime
    # listing info
    rent_per_room: Decimal
    rent_total: Decimal
    lease_type: str
    move_in_date: Optional[str] = None
    is_sublet: bool
    status: str
    # property info
    title: str
    address: str
    property_type: str
    is_furnished: bool
    has_parking: bool
    distance_to_campus_km: Optional[Decimal] = None