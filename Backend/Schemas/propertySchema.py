from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from decimal import Decimal
import enum
from Schemas.featureSchema import ListingPolicies, PetPolicy, SmokingPolicy, SpaceAmenities

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
    distance_to_campus_km: Decimal
    walk_time_minutes:int
    drive_time_minutes: int
    bus_time_minutes: int
    nearest_bus_route: str
    amenities: SpaceAmenities
    policies: ListingPolicies
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
