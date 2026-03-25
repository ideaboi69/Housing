from datetime import datetime
from typing import Optional
from pydantic import BaseModel

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
    rent_per_room: float
    rent_total: float
    lease_type: str
    status: str
    is_sublet: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AdminStatsResponse(BaseModel):
    total_users: int
    total_landlords: int
    total_properties: int
    total_listings: int
    total_reviews: int
    total_flags_pending: int