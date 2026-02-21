from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, EmailStr
from decimal import Decimal
from Schemas.listingSchema import GenderPreference
import enum 

# Enums
class RoomType(str, enum.Enum):
    SHARED = "shared"
    PRIVATE = "private"

class SubletStatus(str, enum.Enum):
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
    nearest_bus_route: int
    room_type: RoomType
    total_rooms: int
    bathrooms: int
    is_furnished: bool
    has_parking: bool
    has_laundry: bool
    utilities_included: bool
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
    distance_to_campus_km: Decimal
    walk_time_minutes: int
    drive_time_minutes: int
    bus_time_minutes: int
    nearest_bus_route: int
    status: SubletStatus
    primary_image: Optional[str] = None
    posted_by: str
    created_at: datetime

    class Config:
        from_attributes = True