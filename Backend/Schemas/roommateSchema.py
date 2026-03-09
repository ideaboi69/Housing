import enum
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime

# ENUMS
class SleepSchedule(str, enum.Enum):
    EARLY_BIRD = "early_bird"
    NIGHT_OWL = "night_owl"
    FLEXIBLE = "flexible"

class Cleanliness(str, enum.Enum):
    VERY_TIDY = "very_tidy"
    REASONABLY_CLEAN = "reasonably_clean"
    RELAXED = "relaxed"

class NoiseLevel(str, enum.Enum):
    QUIET = "quiet"
    MODERATE = "moderate"
    LOUD = "loud"

class GuestFrequency(str, enum.Enum):
    RARELY = "rarely"
    SOMETIMES = "sometimes"
    OFTEN = "often"

class StudyHabits(str, enum.Enum):
    AT_HOME = "at_home"
    LIBRARY = "library"
    MIX = "mix"

class SmokingVaping(str, enum.Enum):
    NO_SMOKING = "no_smoking"
    OUTSIDE_ONLY = "outside_only"
    I_SMOKE = "i_smoke"

class PetPreference(str, enum.Enum):
    NO_PETS = "no_pets"
    FINE_WITH_PETS = "fine_with_pets"
    I_HAVE_A_PET = "i_have_a_pet"

class KitchenUse(str, enum.Enum):
    COOK_DAILY = "cook_daily"
    FEW_TIMES_WEEK = "few_times_week"
    TAKEOUT = "takeout"

class BudgetRange(str, enum.Enum):
    UNDER_500 = "under_500"
    RANGE_500_650 = "500_650"
    RANGE_650_800 = "650_800"
    OVER_800 = "800_plus"

class RoommateTiming(str, enum.Enum):
    FALL_2026 = "fall_2026"
    WINTER_2027 = "winter_2027"
    SUMMER_2026 = "summer_2026"
    FLEXIBLE = "flexible"

class GenderHousingPref(str, enum.Enum):
    MIXED_GENDER = "mixed_gender"
    SAME_GENDER = "same_gender"
    NO_PREFERENCE = "no_preference"

class RoommateSearchType(str, enum.Enum):
    ON_MY_OWN = "on_my_own"
    HAVE_FRIENDS = "have_friends"

class GroupMemberRole(str, enum.Enum):
    OWNER = "owner"
    MEMBER = "member"

class InviteStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"

class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"

class QuizSubmit(BaseModel):
    sleep_schedule: SleepSchedule
    cleanliness: Cleanliness
    noise_level: NoiseLevel
    guests: GuestFrequency
    study_habits: StudyHabits
    smoking: SmokingVaping
    pets: PetPreference
    kitchen_use: KitchenUse
    budget_range: BudgetRange
    roommate_timing: RoommateTiming
    gender_housing_pref: GenderHousingPref
    search_type: RoommateSearchType
    roommates_needed: Optional[int] = None  # only for "on_my_own"

class RoommateProfileResponse(BaseModel):
    id: int
    user_id: int
    is_visible: bool
    sleep_schedule: Optional[SleepSchedule] = None
    cleanliness: Optional[Cleanliness] = None
    noise_level: Optional[NoiseLevel] = None
    guests: Optional[GuestFrequency] = None
    study_habits: Optional[StudyHabits] = None
    smoking: Optional[SmokingVaping] = None
    pets: Optional[PetPreference] = None
    kitchen_use: Optional[KitchenUse] = None
    budget_range: Optional[BudgetRange] = None
    roommate_timing: Optional[RoommateTiming] = None
    gender_housing_pref: Optional[GenderHousingPref] = None
    search_type: Optional[RoommateSearchType] = None
    roommates_needed: Optional[int] = None
    lifestyle_tags: list[str] = []
    quiz_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class IndividualCardResponse(BaseModel):
    """What you see on the Individuals tab."""
    user_id: int
    first_name: str
    last_initial: str
    year: Optional[str] = None
    program: Optional[str] = None
    bio: Optional[str] = None
    budget_range: Optional[BudgetRange] = None
    roommate_timing: Optional[RoommateTiming] = None
    lifestyle_tags: list[str] = []
    compatibility_score: int = 0
    profile_photo_url: Optional[str] = None

# ──────────────────────────────────────────────
# GROUPS
# ──────────────────────────────────────────────
class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    current_size: int
    spots_needed: int
    rent_per_person: Optional[Decimal] = None
    utilities_included: bool = False
    move_in_timing: Optional[RoommateTiming] = None
    gender_preference: Optional[GenderHousingPref] = None
    has_place: bool = False
    address: Optional[str] = None

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    spots_needed: Optional[int] = None
    rent_per_person: Optional[Decimal] = None
    utilities_included: Optional[bool] = None
    move_in_timing: Optional[RoommateTiming] = None
    gender_preference: Optional[GenderHousingPref] = None
    has_place: Optional[bool] = None
    address: Optional[str] = None

class GroupMemberResponse(BaseModel):
    user_id: int
    first_name: str
    last_initial: str
    role: str
    profile_photo_url: Optional[str] = None
    joined_at: datetime

class GroupCardResponse(BaseModel):
    """What you see on the Groups tab."""
    id: int
    name: str
    description: Optional[str] = None
    current_size: int
    total_capacity: int
    spots_remaining: int
    rent_per_person: Optional[Decimal] = None
    utilities_included: bool
    move_in_timing: Optional[RoommateTiming] = None
    gender_preference: Optional[GenderHousingPref] = None
    has_place: bool
    address: Optional[str] = None
    is_verified: bool
    members: list[GroupMemberResponse] = []
    compatibility_score: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class GroupDetailResponse(GroupCardResponse):
    owner_id: int
    is_active: bool

# ──────────────────────────────────────────────
# INVITES & REQUESTS
# ──────────────────────────────────────────────
class InviteCreate(BaseModel):
    invited_user_id: int
    message: Optional[str] = None

class RequestCreate(BaseModel):
    group_id: int
    message: Optional[str] = None

class InviteResponse(BaseModel):
    id: int
    group_id: int
    group_name: str
    invited_user_id: int
    invited_user_name: str
    invited_by_id: int
    message: Optional[str] = None
    status: InviteStatus
    created_at: datetime

    class Config:
        from_attributes = True

class RequestResponse(BaseModel):
    id: int
    group_id: int
    group_name: str
    user_id: int
    user_name: str
    message: Optional[str] = None
    status: RequestStatus
    lifestyle_tags: list[str] = []
    compatibility_score: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileCompletionCheck(BaseModel):
    """What the frontend uses to decide whether to show the completion popup."""
    is_complete: bool
    fields: dict  # pre-filled values + nulls for missing
    missing_fields: list[str]

class ProfileCompletionSubmit(BaseModel):
    """User fills in missing fields from the popup."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    program: Optional[str] = None
    year: Optional[str] = None
    bio: Optional[str] = None