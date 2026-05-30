from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
from decimal import Decimal
import enum
from Schemas.featureSchema import ListingPolicies, ListingTerms, SpaceAmenities

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
    DRAFT = "draft"
    ACTIVE = "active"
    RENTED = "rented"
    EXPIRED = "expired"

# Request
class ListingRoomCreate(BaseModel):
    label: Optional[str] = None
    rent: Decimal
    display_order: int = 0

class ListingCreate(BaseModel):
    property_id: int
    rent_per_room: Optional[Decimal] = None 
    rent_total: Optional[Decimal] = None 
    per_room_pricing: bool = False
    rooms: Optional[list[ListingRoomCreate]] = None
    lease_type: LeaseType
    move_in_date: date
    is_sublet: bool = False
    sublet_start_date: Optional[date] = None
    sublet_end_date: Optional[date] = None
    gender_preference: Optional[GenderPreference] = None

class ListingRoomUpdate(BaseModel):
    label: Optional[str] = None
    rent: Optional[Decimal] = None
    is_available: Optional[bool] = None
    display_order: Optional[int] = None

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
        
class ListingImageReorder(BaseModel):
    image_ids: list[int]

class ListingRoomResponse(BaseModel):
    id: int
    label: Optional[str] = None
    rent: Decimal
    is_available: bool
    display_order: int

    class Config:
        from_attributes = True

class ListingResponse(BaseModel):
    id: int
    property_id: int
    rent_per_room: Decimal
    rent_total: Decimal
    rent_min: Decimal
    rent_max: Decimal
    per_room_pricing: bool
    rooms: list[ListingRoomResponse] = []
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
    rent_min: Decimal
    rent_max: Decimal
    per_room_pricing: bool
    rooms: list[ListingRoomResponse] = []
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
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    property_type: str
    total_rooms: int
    bathrooms: int
    is_furnished: bool
    has_parking: bool
    has_laundry: bool
    utilities_included: bool
    pet_friendly: Optional[bool] = None
    has_air_conditioning: Optional[bool] = None
    has_wifi: Optional[bool] = None
    has_dishwasher: Optional[bool] = None
    has_gym: Optional[bool] = None
    has_elevator: Optional[bool] = None
    has_backyard: Optional[bool] = None
    has_balcony: Optional[bool] = None
    smoking_allowed: Optional[bool] = None
    wheelchair_accessible: Optional[bool] = None
    pet_policy: Optional[str] = None
    smoking_policy: Optional[str] = None
    estimated_utility_cost: Optional[Decimal] = None
    distance_to_campus_km: Optional[Decimal] = None
    walk_time_minutes: Optional[int] = None
    bus_time_minutes: Optional[int] = None
    drive_time_minutes: Optional[int] = None
    nearest_bus_route: Optional[str] = None
    amenities: SpaceAmenities
    policies: ListingPolicies
    terms: ListingTerms
    # landlord info
    landlord_id: int
    landlord_name: str
    landlord_verified: bool
