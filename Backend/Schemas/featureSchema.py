from datetime import date
from typing import Annotated, Optional
from pydantic import BaseModel, BeforeValidator
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


# ── Legacy value normalization ──────────────────────────────────────────────
# `pet_policy` / `smoking_policy` are free-text VARCHAR columns. Rows created
# before these enums existed stored boolean-ish toggle values ("no"/"yes"). The
# old frontend toggle meant: not toggled → "no" → policy is "not allowed". These
# BeforeValidators map those legacy strings onto the enum so response models
# never 500 on old data, and stale rows display the right label instead of
# "Unknown". New writes already go through the enum on create/update.
_LEGACY_POLICY = {"no": "not_allowed", "yes": "allowed", "outside": "outside_only"}

def _normalize_pet_policy(value):
    if isinstance(value, PetPolicy):
        return value
    if isinstance(value, str):
        value = _LEGACY_POLICY.get(value, value)
        if value in PetPolicy._value2member_map_:
            return value
    return PetPolicy.UNKNOWN

def _normalize_smoking_policy(value):
    if isinstance(value, SmokingPolicy):
        return value
    if isinstance(value, str):
        value = _LEGACY_POLICY.get(value, value)
        if value in SmokingPolicy._value2member_map_:
            return value
    return SmokingPolicy.UNKNOWN

# Drop-in replacements for `SmokingPolicy` / `PetPolicy` in response schemas.
PetPolicyField = Annotated[PetPolicy, BeforeValidator(_normalize_pet_policy)]
SmokingPolicyField = Annotated[SmokingPolicy, BeforeValidator(_normalize_smoking_policy)]

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
    pet_policy: PetPolicyField = PetPolicy.UNKNOWN
    smoking_policy: SmokingPolicyField = SmokingPolicy.UNKNOWN

class ListingTerms(BaseModel):
    lease_type: Optional[str] = None
    move_in_date: Optional[date] = None
    has_flexible_move_in: bool = False
    gender_preference: Optional[str] = None

class SubletTerms(BaseModel):
    negotiable_price: Optional[bool] = None
    flexible_dates: Optional[bool] = None
    roommates_staying: Optional[bool] = None
    private_room: Optional[bool] = None
    entire_place: Optional[bool] = None
    verified_place: Optional[bool] = None
