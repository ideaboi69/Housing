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

    @field_validator("email")
    @classmethod
    def email_must_be_uoguelph(cls, v):
        if v and not v.endswith("@uoguelph.ca"):
            raise ValueError("Must use a @uoguelph.ca email")
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

#Request & Response    
class UserResponse(BaseModel):
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

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse