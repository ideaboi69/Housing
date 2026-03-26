from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
from decimal import Decimal
from Schemas.propertySchema import PropertyType
from Schemas.listingSchema import LeaseType, GenderPreference

# Request
class LandlordInviteCreate(BaseModel):
    address: str
    postal_code: Optional[str] = None
    property_type: Optional[PropertyType] = None
    total_rooms: Optional[int] = None
    bathrooms: Optional[int] = None
    is_furnished: bool = False
    has_parking: bool = False
    has_laundry: bool = False
    utilities_included: bool = False
    estimated_utility_cost: Optional[Decimal] = None
    distance_to_campus_km: Optional[Decimal] = None
    nearest_bus_route: Optional[str] = None
    rent_per_room: Optional[Decimal] = None
    rent_total: Optional[Decimal] = None
    lease_type: Optional[LeaseType] = None
    move_in_date: Optional[date] = None
    gender_preference: Optional[GenderPreference] = None

# Response
class LandlordInviteResponse(BaseModel):
    id: int
    group_id: int
    group_name: str
    token: str
    invite_url: str
    status: str
    address: str
    postal_code: Optional[str] = None
    property_type: Optional[PropertyType] = None
    total_rooms: Optional[int] = None
    bathrooms: Optional[int] = None
    is_furnished: bool
    has_parking: bool
    has_laundry: bool
    utilities_included: bool
    estimated_utility_cost: Optional[Decimal] = None
    distance_to_campus_km: Optional[Decimal] = None
    nearest_bus_route: Optional[str] = None
    rent_per_room: Optional[Decimal] = None
    rent_total: Optional[Decimal] = None
    lease_type: Optional[LeaseType] = None
    move_in_date: Optional[date] = None
    gender_preference: Optional[GenderPreference] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Response
class LandlordInviteDetailResponse(BaseModel):
    id: int
    group_name: str
    group_description: Optional[str] = None
    group_size: int
    address: str
    postal_code: Optional[str] = None
    property_type: Optional[PropertyType] = None
    total_rooms: Optional[int] = None
    bathrooms: Optional[int] = None
    is_furnished: bool
    has_parking: bool
    has_laundry: bool
    utilities_included: bool
    estimated_utility_cost: Optional[Decimal] = None
    distance_to_campus_km: Optional[Decimal] = None
    nearest_bus_route: Optional[str] = None
    rent_per_room: Optional[Decimal] = None
    rent_total: Optional[Decimal] = None
    lease_type: Optional[LeaseType] = None
    move_in_date: Optional[date] = None
    gender_preference: Optional[GenderPreference] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True