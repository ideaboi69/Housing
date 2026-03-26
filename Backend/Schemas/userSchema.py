from datetime import date, datetime
import enum
from fastapi import UploadFile, File
from typing import List
from enum import Enum
from pydantic import BaseModel, HttpUrl, condecimal, EmailStr, field_validator
from typing import Annotated, Optional, Literal

#Enums
class UserRole(str, enum.Enum):
    STUDENT = "student"
    LANDLORD = "landlord"
    WRITER = "writer"
    ADMIN = "admin"

# UDashboard Enums 
class StudentYear(str, enum.Enum):
    FIRST = "1st"
    SECOND = "2nd"
    THIRD = "3rd"
    FOURTH = "4th"
    FIFTH_PLUS = "5th+"
    MASTERS = "masters"
    PHD = "phd"

class LeaseTermPreference(str, enum.Enum):
    FOUR_MONTHS = "4_months"
    EIGHT_MONTHS = "8_months"
    TWELVE_MONTHS = "12_months"
    FLEXIBLE = "flexible"

# Request
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("email")
    @classmethod
    def email_must_be_uoguelph(cls, v):
        if not v.endswith("@uoguelph.ca"):
            raise ValueError("Must use a @uoguelph.ca email")
        return v

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    program: Optional[str] = None
    year: Optional[StudentYear] = None
    bio: Optional[str] = None
 
    @field_validator("email")
    @classmethod
    def email_must_be_uoguelph(cls, v):
        if v and not v.endswith("@uoguelph.ca"):
            raise ValueError("Must use a @uoguelph.ca email")
        return v
 
    @field_validator("bio")
    @classmethod
    def bio_max_length(cls, v):
        if v and len(v) > 200:
            raise ValueError("Bio must be 200 characters or less")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

# Response    
class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    email_verified: bool
    is_early_adopter: bool = False
    profile_photo_url: Optional[str] = None
    program: Optional[str] = None
    year: Optional[StudentYear] = None
    bio: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# User Notification Preferences 
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