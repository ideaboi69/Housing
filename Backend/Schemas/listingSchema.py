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
    # Apartment unit-type fields (only used when the parent property is an apartment)
    unit_label: Optional[str] = None
    beds: Optional[int] = None
    baths: Optional[int] = None
    sqft: Optional[int] = None
    units_total: Optional[int] = None
    units_available: Optional[int] = None
    lease_type: LeaseType
    move_in_date: Optional[date] = None
    has_flexible_move_in: bool = False
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
    unit_label: Optional[str] = None
    beds: Optional[int] = None
    baths: Optional[int] = None
    sqft: Optional[int] = None
    units_total: Optional[int] = None
    units_available: Optional[int] = None
    lease_type: Optional[str] = None
    move_in_date: Optional[date] = None
    has_flexible_move_in: Optional[bool] = None
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
    is_floor_plan: bool = False

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
    unit_label: Optional[str] = None
    beds: Optional[int] = None
    baths: Optional[int] = None
    sqft: Optional[int] = None
    units_total: Optional[int] = None
    units_available: Optional[int] = None
    lease_type: str
    move_in_date: Optional[date] = None
    has_flexible_move_in: bool = False
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
    unit_label: Optional[str] = None
    beds: Optional[int] = None
    baths: Optional[int] = None
    sqft: Optional[int] = None
    units_total: Optional[int] = None
    units_available: Optional[int] = None
    lease_type: str
    move_in_date: Optional[date] = None
    has_flexible_move_in: bool = False
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
    description: Optional[str] = None
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
    nearby_places: Optional[dict] = None
    amenities: SpaceAmenities
    policies: ListingPolicies
    terms: ListingTerms
    # landlord info
    landlord_id: int
    landlord_name: str
    landlord_company_name: Optional[str] = None
    landlord_verified: bool
    landlord_is_early_adopter: bool = False


class PopularListingResponse(ListingDetailResponse):
    """ListingDetailResponse + Cribb Score, used by GET /api/listings/popular.

    `overall_score` is null when no HousingHealthScore row exists yet for the listing.
    """
    overall_score: Optional[float] = None


# ── Apartment building (2-level: building → unit types) ──────────────

class BuildingUnitResponse(BaseModel):
    """One unit type / floor plan inside an apartment building."""
    id: int  # the underlying Listing id (links to /browse/[id])
    unit_label: Optional[str] = None
    beds: Optional[int] = None
    baths: Optional[int] = None
    sqft: Optional[int] = None
    rent: Decimal  # monthly rent for this unit type
    lease_type: str
    units_total: Optional[int] = None
    units_available: Optional[int] = None
    status: str
    floor_plan_image: Optional[str] = None  # the is_floor_plan diagram, if uploaded
    images: list[ListingImageResponse] = []
    overall_score: Optional[float] = None


class BuildingResponse(BaseModel):
    """An apartment building (Property) plus its unit-type listings.

    Powers the Residen-style building detail page: building-level hero +
    a list of unit types, each with its own price/beds/baths/floor plan.
    """
    id: int  # property id
    title: str
    address: str
    description: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    property_type: str
    # building-level summary across active units
    price_min: Optional[Decimal] = None
    price_max: Optional[Decimal] = None
    bed_min: Optional[int] = None
    bed_max: Optional[int] = None
    bath_min: Optional[int] = None
    bath_max: Optional[int] = None
    unit_count: int = 0
    # building info
    amenities: SpaceAmenities
    policies: ListingPolicies
    is_furnished: bool = False
    has_parking: bool = False
    has_laundry: bool = False
    utilities_included: bool = False
    has_wifi: bool = False
    has_air_conditioning: bool = False
    has_dishwasher: bool = False
    has_gym: bool = False
    has_elevator: bool = False
    has_balcony: bool = False
    wheelchair_accessible: bool = False
    estimated_utility_cost: Optional[Decimal] = None
    distance_to_campus_km: Optional[Decimal] = None
    walk_time_minutes: Optional[int] = None
    bus_time_minutes: Optional[int] = None
    drive_time_minutes: Optional[int] = None
    nearest_bus_route: Optional[str] = None
    images: list[ListingImageResponse] = []
    # landlord info
    landlord_id: int
    landlord_name: str
    landlord_company_name: Optional[str] = None
    landlord_verified: bool
    landlord_is_early_adopter: bool = False
    units: list[BuildingUnitResponse] = []
