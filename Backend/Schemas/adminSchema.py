from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from enum import Enum as PyEnum

# OG-badge enum
class AccountType(str, PyEnum):
    user = "user"
    landlord = "landlord"
    writer = "writer"

# Request
class AdminCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

class AdminLogin(BaseModel):
    email: str
    password: str

# Response
class AdminResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AdminTokenResponse(BaseModel):
    access_token: str
    admin: AdminResponse

class AdminUserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    email_verified: bool
    is_early_adopter: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AdminLandlordResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    company_name: Optional[str]
    phone: Optional[str]
    identity_verified: bool

    class Config:
        from_attributes = True

class AdminListingResponse(BaseModel):
    id: int
    property_id: int
    property_title: str = ""
    address: str = ""
    rent_per_room: float
    rent_total: float
    lease_type: str
    status: str
    is_sublet: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AdminSubletResponse(BaseModel):
    id: int
    user_id: int
    owner_name: str = ""
    owner_email: str = ""
    title: str
    address: str
    rent: float
    room_type: str
    start_date: datetime
    end_date: datetime
    status: str
    view_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class AdminStatsResponse(BaseModel):
    total_users: int
    total_landlords: int
    total_properties: int
    total_listings: int
    listings_under_review: int = 0
    total_reviews: int
    total_flags_pending: int
    total_marketplace_items: int = 0
    total_sublets: int = 0
    total_posts: int = 0
    total_writers: int = 0
    total_roommate_groups: int = 0
    total_roommate_profiles: int = 0

# Send emails to students who wanna sublet their lisitngs early
class SubletOnboardingEmailRequest(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None