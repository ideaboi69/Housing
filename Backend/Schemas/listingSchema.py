from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
from decimal import Decimal
import enum

# Enum
class LeaseType(str, enum.Enum):
    EIGHT_MONTH = "8_month"
    TEN_MONTH = "10_month"
    TWELVE_MONTH = "12_month"
    FLEXIBLE = "flexible"

class GenderPreference(str, enum.Enum):
    ANY = "any"
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class ListingStatus(str, enum.Enum):
    ACTIVE = "active"
    RENTED = "rented"
    EXPIRED = "expired"

# Request
class ListingCreate(BaseModel):
    property_id: int
    rent_per_room: Decimal
    rent_total: Decimal
    lease_type: LeaseType
    move_in_date: date
    is_sublet: bool = False
    sublet_start_date: Optional[date] = None
    sublet_end_date: Optional[date] = None
    gender_preference: Optional[GenderPreference] = None 

class ListingUpdate(BaseModel):
    rent_per_room: Optional[Decimal] = None
    rent_total: Optional[Decimal] = None
    lease_type: Optional[str] = None
    move_in_date: Optional[date] = None
    is_sublet: Optional[bool] = None
    sublet_start_date: Optional[date] = None
    sublet_end_date: Optional[date] = None
    gender_preference: Optional[str] = None
    status: Optional[ListingStatus] = None

class SubletConvert(BaseModel):
    sublet_start_date: date
    sublet_end_date: date
    gender_preference: Optional[str] = None

# Response
class ListingImageResponse(BaseModel):
    id: int
    image_url: str
    display_order: int

    class Config:
        from_attributes = True

class ListingResponse(BaseModel):
    id: int
    property_id: int
    rent_per_room: Decimal
    rent_total: Decimal
    lease_type: str
    move_in_date: date
    is_sublet: bool
    sublet_start_date: Optional[date] = None
    sublet_end_date: Optional[date] = None
    gender_preference: Optional[str] = None
    status: str
    view_count: int
    images: list[ListingImageResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ListingDetailResponse(BaseModel):
    """Full listing with property info baked in — what students see when browsing."""
    id: int
    rent_per_room: Decimal
    rent_total: Decimal
    lease_type: str
    move_in_date: date
    is_sublet: bool
    sublet_start_date: Optional[date] = None
    sublet_end_date: Optional[date] = None
    gender_preference: Optional[str] = None
    status: str
    view_count: int
    images: list[ListingImageResponse] = []
    created_at: datetime
    # property info
    property_id: int
    title: str
    address: str
    property_type: str
    total_rooms: int
    bathrooms: int
    is_furnished: bool
    has_parking: bool
    has_laundry: bool
    utilities_included: bool
    estimated_utility_cost: Optional[Decimal] = None
    distance_to_campus_km: Optional[Decimal] = None
    walk_time_minutes: Optional[int] = None
    bus_time_minutes: Optional[int] = None
    # landlord info
    landlord_id: int
    landlord_name: str
    landlord_verified: bool

