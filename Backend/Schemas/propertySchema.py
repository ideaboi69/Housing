from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from decimal import Decimal
import enum

# Enum
class PropertyType(str, enum.Enum):
    HOUSE = "house"
    APARTMENT = "apartment"
    TOWNHOUSE = "townhouse"
    ROOM = "room"

class PropertyRange(str, enum.Enum):
    ONE = "1"
    TWO_TO_FIVE = "2-5"
    SIX_TO_TEN = "6-10"
    TEN_PLUS ="10+"

# Request
class PropertyCreate(BaseModel):
    title: str
    address: str
    postal_code: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    property_type: PropertyType
    total_rooms: int
    bathrooms: int
    is_furnished: bool = False
    has_parking: bool = False
    has_laundry: bool = False
    utilities_included: bool = False
    estimated_utility_cost: Decimal
    distance_to_campus_km: Decimal
    walk_time_minutes: int
    drive_time_minutes: int
    bus_time_minutes: int
    nearest_bus_route: str

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    property_type: Optional[PropertyType] = None
    total_rooms: Optional[int] = None
    bathrooms: Optional[int] = None
    is_furnished: Optional[bool] = None
    has_parking: Optional[bool] = None
    has_laundry: Optional[bool] = None
    utilities_included: Optional[bool] = None
    estimated_utility_cost: Optional[Decimal] = None
    distance_to_campus_km: Optional[Decimal] = None
    walk_time_minutes: Optional[int] = None
    drive_time_minutes: Optional[int] = None
    bus_time_minutes: Optional[int] = None
    nearest_bus_route: Optional[str] = None

# Response
class PropertyResponse(BaseModel):
    id: int
    landlord_id: int
    title: str
    address: str
    postal_code: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    property_type: PropertyType
    total_rooms: int
    bathrooms: int
    is_furnished: bool
    has_parking: bool
    has_laundry: bool
    utilities_included: bool
    estimated_utility_cost: Decimal
    distance_to_campus_km: Decimal
    walk_time_minutes:int
    drive_time_minutes: int
    bus_time_minutes: int
    nearest_bus_route: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True