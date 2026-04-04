from datetime import date
from typing import Optional
from pydantic import BaseModel
import enum


class AmenityValue(str, enum.Enum):
    YES = "yes"
    NO = "no"
    UNKNOWN = "unknown"


class PetPolicy(str, enum.Enum):
    ALLOWED = "allowed"
    NOT_ALLOWED = "not_allowed"
    CASE_BY_CASE = "case_by_case"
    UNKNOWN = "unknown"


class SmokingPolicy(str, enum.Enum):
    ALLOWED = "allowed"
    NOT_ALLOWED = "not_allowed"
    OUTSIDE_ONLY = "outside_only"
    UNKNOWN = "unknown"


class SpaceAmenities(BaseModel):
    furnished: AmenityValue
    utilities_included: AmenityValue
    parking: AmenityValue
    laundry: AmenityValue
    wifi: AmenityValue = AmenityValue.UNKNOWN
    air_conditioning: AmenityValue = AmenityValue.UNKNOWN
    dishwasher: AmenityValue = AmenityValue.UNKNOWN
    balcony: AmenityValue = AmenityValue.UNKNOWN
    backyard: AmenityValue = AmenityValue.UNKNOWN
    elevator: AmenityValue = AmenityValue.UNKNOWN
    gym: AmenityValue = AmenityValue.UNKNOWN
    wheelchair_accessible: AmenityValue = AmenityValue.UNKNOWN


class ListingPolicies(BaseModel):
    pet_policy: PetPolicy = PetPolicy.UNKNOWN
    smoking_policy: SmokingPolicy = SmokingPolicy.UNKNOWN


class ListingTerms(BaseModel):
    lease_type: Optional[str] = None
    move_in_date: Optional[date] = None
    gender_preference: Optional[str] = None


class SubletTerms(BaseModel):
    negotiable_price: Optional[bool] = None
    flexible_dates: Optional[bool] = None
    roommates_staying: Optional[bool] = None
    private_room: Optional[bool] = None
    entire_place: Optional[bool] = None
    verified_place: Optional[bool] = None
