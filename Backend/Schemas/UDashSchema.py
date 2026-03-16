from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal
import enum

# Enums
class LeaseTermPreference(str, enum.Enum):
    FOUR_MONTHS = "4_months"
    EIGHT_MONTHS = "8_months"
    TWELVE_MONTHS = "12_months"
    FLEXIBLE = "flexible"

class PreferredArea(str, enum.Enum):
    NEAR_CAMPUS = "near_campus"
    DOWNTOWN = "downtown"
    SOUTH_END = "south_end"
    EAST_END = "east_end"
    WEST_END = "west_end"
    STONE_RD = "stone_rd"

class PropertyTypePreference(str, enum.Enum):
    HOUSE = "house"
    APARTMENT = "apartment"
    BASEMENT = "basement"
    TOWNHOUSE = "townhouse"
    STUDIO = "studio"

class MustHave(str, enum.Enum):
    FURNISHED = "furnished"
    PARKING = "parking"
    UTILITIES_INCLUDED = "utilities_included"
    IN_UNIT_LAUNDRY = "in_unit_laundry"
    AC = "ac"
    PET_FRIENDLY = "pet_friendly"
    DISHWASHER = "dishwasher"

class SleepSchedule(str, enum.Enum):
    EARLY_BIRD = "early_bird"
    NIGHT_OWL = "night_owl"
    FLEXIBLE = "flexible"

class Cleanliness(str, enum.Enum):
    VERY_CLEAN = "very_clean"
    MODERATE = "moderate"
    RELAXED = "relaxed"

class NoiseLevel(str, enum.Enum):
    QUIET = "quiet"
    MODERATE = "moderate"
    LIVELY = "lively"

class GuestsSocial(str, enum.Enum):
    RARELY = "rarely"
    SOMETIMES = "sometimes"
    LOVE_HOSTING = "love_hosting"

class StudentYear(str, enum.Enum):
    FIRST = "1st"
    SECOND = "2nd"
    THIRD = "3rd"
    FOURTH = "4th"
    FIFTH_PLUS = "5th+"
    MASTERS = "masters"
    PHD = "phd"

# Profile
class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    program: Optional[str] = None
    year: Optional[StudentYear] = None
    bio: Optional[str] = Field(None, max_length=200)

class ProfileResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    profile_photo_url: Optional[str] = None
    program: Optional[str] = None
    year: Optional[StudentYear] = None
    bio: Optional[str] = None
    email_verified: bool
    is_writable: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Housing preference
class HousingPreferencesUpdate(BaseModel):
    budget: Optional[Decimal] = None
    move_in_date: Optional[date] = None
    lease_term: Optional[LeaseTermPreference] = None
    preferred_areas: Optional[list[PreferredArea]] = None
    property_types: Optional[list[PropertyTypePreference]] = None
    must_haves: Optional[list[MustHave]] = None

class HousingPreferencesResponse(BaseModel):
    id: int
    user_id: int
    budget: Optional[Decimal] = None
    move_in_date: Optional[date] = None
    lease_term: Optional[LeaseTermPreference] = None
    preferred_areas: list[str] = []
    property_types: list[str] = []
    must_haves: list[str] = []
    updated_at: datetime

    class Config:
        from_attributes = True

# Roommate profile
class RoommateProfileUpdate(BaseModel):
    is_visible: Optional[bool] = None
    sleep_schedule: Optional[SleepSchedule] = None
    cleanliness: Optional[Cleanliness] = None
    noise_level: Optional[NoiseLevel] = None
    guests_social: Optional[GuestsSocial] = None
    vibe_tags: Optional[list[str]] = Field(None, max_length=5)

class RoommateProfileResponse(BaseModel):
    id: int
    user_id: int
    is_visible: bool
    sleep_schedule: Optional[SleepSchedule] = None
    cleanliness: Optional[Cleanliness] = None
    noise_level: Optional[NoiseLevel] = None
    guests_social: Optional[GuestsSocial] = None
    vibe_tags: list[str] = []
    updated_at: datetime

    class Config:
        from_attributes = True

# Notification Preferences
class NotificationPreferencesUpdate(BaseModel):
    new_listings_matching: Optional[bool] = None
    price_drops_saved: Optional[bool] = None
    new_roommate_matches: Optional[bool] = None
    weekly_bubble_digest: Optional[bool] = None
    cribb_news_updates: Optional[bool] = None

class NotificationPreferencesResponse(BaseModel):
    id: int
    user_id: int
    new_listings_matching: bool
    price_drops_saved: bool
    new_roommate_matches: bool
    weekly_bubble_digest: bool
    cribb_news_updates: bool
    updated_at: datetime

    class Config:
        from_attributes = True

# Account & Security
class ChangePassword(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class ChangeEmail(BaseModel):
    new_email: str
    password: str 