from datetime import datetime
from typing import Optional
from pydantic import BaseModel

# Request 
class LandlordUpdate(BaseModel):
    company_name: Optional[str] = None
    phone: Optional[str] = None

# Response 
class LandlordResponse(BaseModel):
    id: int
    user_id: int
    identity_verified: bool
    company_name: Optional[str]
    phone: Optional[str]

    class Config:
        from_attributes = True

class LandlordPublicResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    company_name: Optional[str]
    identity_verified: bool
    avg_responsiveness: Optional[float] = None
    avg_maintenance_speed: Optional[float] = None
    avg_respect_privacy: Optional[float] = None
    avg_fairness_of_charges: Optional[float] = None
    would_rent_again_pct: Optional[float] = None
    total_reviews: int = 0
    total_properties: int = 0

class LandlordPropertyResponse(BaseModel):
    id: int
    title: str
    address: str
    property_type: str
    total_rooms: int
    bathrooms: int
    is_furnished: bool
    has_parking: bool
    has_laundry: bool

    class Config:
        from_attributes = True

class LandlordReviewResponse(BaseModel):
    id: int
    student_id: int
    property_id: int
    responsiveness: int
    maintenance_speed: int
    respect_privacy: int
    fairness_of_charges: int
    would_rent_again: bool
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True