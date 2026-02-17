from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
import enum

# Request
class ReviewCreate(BaseModel):
    property_id: int
    responsiveness: int
    maintenance_speed: int
    respect_privacy: int
    fairness_of_charges: int
    would_rent_again: bool
    comment: Optional[str] = None

    @field_validator("responsiveness", "maintenance_speed", "respect_privacy", "fairness_of_charges")
    @classmethod
    def rating_range(cls, v):
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5")
        return v

class ReviewUpdate(BaseModel):
    responsiveness: Optional[int] = None
    maintenance_speed: Optional[int] = None
    respect_privacy: Optional[int] = None
    fairness_of_charges: Optional[int] = None
    would_rent_again: Optional[bool] = None
    comment: Optional[str] = None

    @field_validator("responsiveness", "maintenance_speed", "respect_privacy", "fairness_of_charges")
    @classmethod
    def rating_range(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError("Rating must be between 1 and 5")
        return v

# Response
class ReviewResponse(BaseModel):
    id: int
    student_id: int
    property_id: int
    landlord_id: int
    responsiveness: int
    maintenance_speed: int
    respect_privacy: int
    fairness_of_charges: int
    would_rent_again: bool
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FlagStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
