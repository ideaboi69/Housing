from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, EmailStr
from decimal import Decimal
from Schemas.listingSchema import GenderPreference
from Schemas.featureSchema import ListingPolicies, PetPolicy, SmokingPolicy, SpaceAmenities, SubletTerms
import enum 

# Enums
class RoomType(str, enum.Enum):
    SHARED = "shared"
    PRIVATE = "private"

class SubletStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    RENTED = "rented"
    EXPIRED = "expired"
    REMOVED = "removed"

# Request
class SubletCreate(BaseModel):
    title: str
    address: str
    postal_code: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    distance_to_campus_km: Decimal
    walk_time_minutes: int
    drive_time_minutes: int
    bus_time_minutes: int
    nearest_bus_route: str
    room_type: RoomType
    total_rooms: int
    bathrooms: int
    is_furnished: bool = False
    has_parking: bool = False
    has_laundry: bool = False
    utilities_included: bool = False
    has_wifi: bool = False
    has_air_conditioning: bool = False
    has_dishwasher: bool = False
    has_gym: bool = False
    has_elevator: bool = False
    has_backyard: bool = False
    has_balcony: bool = False
    wheelchair_accessible: bool = False
    pet_policy: PetPolicy = PetPolicy.UNKNOWN
    smoking_policy: SmokingPolicy = SmokingPolicy.UNKNOWN
    estimated_utility_cost: Decimal 
    rent_per_month: float
    sublet_start_date: date
    sublet_end_date: date
    move_in_date: date
    gender_preference: Optional[GenderPreference] = None
    description: Optional[str] = None

class SubletUpdate(BaseModel):
    title: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    distance_to_campus_km: Optional[Decimal] = None
    walk_time_minutes: Optional[int] = None
    drive_time_minutes: Optional[int] = None
    bus_time_minutes: Optional[int] = None
    nearest_bus_route: Optional[str] = None
    room_type: Optional[RoomType] = None
    total_rooms: Optional[int] = None
    bathrooms: Optional[int] = None
    is_furnished: Optional[bool] = False
    has_parking: Optional[bool] = False
    has_laundry: Optional[bool] = False
    utilities_included: Optional[bool] = False
    has_wifi: Optional[bool] = None
    has_air_conditioning: Optional[bool] = None
    has_dishwasher: Optional[bool] = None
    has_gym: Optional[bool] = None
    has_elevator: Optional[bool] = None
    has_backyard: Optional[bool] = None
    has_balcony: Optional[bool] = None
    wheelchair_accessible: Optional[bool] = None
    pet_policy: Optional[PetPolicy] = None
    smoking_policy: Optional[SmokingPolicy] = None
    estimated_utility_cost: Optional[Decimal] = None
    rent_per_month: Optional[float] = None
    sublet_start_date: Optional[date] = None
    sublet_end_date: Optional[date] = None
    move_in_date: Optional[date] = None
    gender_preference: Optional[GenderPreference] = None
    description: Optional[str] = None
    status: Optional[SubletStatus] = None

class SubletImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool

    class Config:
        from_attributes = True

class SubletResponse(BaseModel):
    id: int
    user_id: int
    title: str
    address: str
    postal_code: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    distance_to_campus_km: Decimal
    walk_time_minutes: int
    drive_time_minutes: int
    bus_time_minutes: int 
    nearest_bus_route: str
    room_type: RoomType
    total_rooms: int
    bathrooms: int
    is_furnished: bool
    has_parking: bool
    has_laundry: bool
    utilities_included: bool
    has_wifi: bool
    has_air_conditioning: bool
    has_dishwasher: bool
    has_gym: bool
    has_elevator: bool
    has_backyard: bool
    has_balcony: bool
    wheelchair_accessible: bool
    pet_policy: PetPolicy
    smoking_policy: SmokingPolicy
    estimated_utility_cost: Decimal
    rent_per_month: Decimal
    sublet_start_date: date
    sublet_end_date: date
    move_in_date: date
    gender_preference: Optional[GenderPreference] = None
    status: SubletStatus
    view_count: int
    description: Optional[str] = None
    images: list[SubletImageResponse] = []
    posted_by: str  # user's name
    amenities: SpaceAmenities
    policies: ListingPolicies
    terms: SubletTerms
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SubletListResponse(BaseModel):
    id: int
    title: str
    address: str
    rent_per_month: Decimal
    sublet_start_date: date
    sublet_end_date: date
    room_type: RoomType
    total_rooms: int
    is_furnished: bool
    has_parking: bool
    has_laundry: bool
    utilities_included: bool
    has_wifi: bool
    pet_policy: PetPolicy
    smoking_policy: SmokingPolicy
    distance_to_campus_km: Decimal
    walk_time_minutes: int
    drive_time_minutes: int
    bus_time_minutes: int
    nearest_bus_route: str
    status: SubletStatus
    primary_image: Optional[str] = None
    images: list[SubletImageResponse] = []
    posted_by: str
    amenities: SpaceAmenities
    policies: ListingPolicies
    terms: SubletTerms
    created_at: datetime

    class Config:
        from_attributes = True
