from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from Schemas.propertySchema import PropertyRange
import enum

# Enums
class IDType(str, enum.Enum):
    DRIVERS_LICENSE = "drivers_license"
    PASSPORT = "passport"
    PROVINCIAL_ID = "provincial_id"

class DocumentType(str, enum.Enum):
    PROPERTY_TAX_BILL = "property_tax_bill"
    UTILITY_BILL = "utility_bill"
    MORTGAGE_STATEMENT = "mortgage_statement"
    PROPERTY_MANAGEMENT_LICENSE = "property_management_license"

class LandlordVerification(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

# Request 
class LandlordCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    company_name: Optional[str] = None
    phone: str
    no_of_property: PropertyRange

class LandlordLogin(BaseModel):
    email: str
    password: str

class LandlordUpdate(BaseModel):
    company_name: Optional[str] = None
    phone: Optional[str] = None

# Response 
class LandlordResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    phone: str
    no_of_property: PropertyRange
    company_name: Optional[str] = None
    identity_verified: bool

    class Config:
        from_attributes = True

class LandlordTokenResponse(BaseModel):
    access_token: str
    landlord: LandlordResponse

class LandlordPublicResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    company_name: Optional[str]
    identity_verified: bool
    avg_responsiveness: Optional[float] = None
    avg_maintenance_speed: Optional[float] = None
    avg_respect_privacy: Optional[float] = None
    avg_fairness_of_charges: Optional[float] = None
    would_rent_again_pct: Optional[float] = None
    total_reviews: int = 0
    total_properties: int = 0

class LandlordPropertyResponse(BaseModel):
    id: int
    title: str
    address: str
    property_type: str
    total_rooms: int
    bathrooms: int
    is_furnished: bool
    has_parking: bool
    has_laundry: bool

    class Config:
        from_attributes = True

class LandlordReviewResponse(BaseModel):
    id: int
    student_id: int
    property_id: int
    responsiveness: int
    maintenance_speed: int
    respect_privacy: int
    fairness_of_charges: int
    would_rent_again: bool
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True