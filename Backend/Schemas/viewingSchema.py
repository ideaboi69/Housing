from datetime import datetime, date, time
from typing import Optional
from pydantic import BaseModel, model_validator
from decimal import Decimal
import enum

#  Enums
class ViewingSlotStatus(str, enum.Enum):
    AVAILABLE = "available"
    BOOKED = "booked"
    CANCELLED = "cancelled"

class BookingStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    CANCELLED_BY_STUDENT = "cancelled_by_student"
    CANCELLED_BY_LANDLORD = "cancelled_by_landlord"
    COMPLETED = "completed"

# Requests
class AvailabilityCreate(BaseModel):
    listing_id: Optional[int] = None
    sublet_id: Optional[int] = None
    date: date
    start_time: time
    end_time: time

    @model_validator(mode="after")
    def check_one_type(self):
        if self.listing_id and self.sublet_id:
            raise ValueError("Provide either listing_id or sublet_id, not both")
        if not self.listing_id and not self.sublet_id:
            raise ValueError("Provide either listing_id or sublet_id")
        return self

class BulkAvailabilityCreate(BaseModel):
    listing_id: Optional[int] = None
    sublet_id: Optional[int] = None
    dates: list[AvailabilityCreate]

    @model_validator(mode="after")
    def check_one_type(self):
        if self.listing_id and self.sublet_id:
            raise ValueError("Provide either listing_id or sublet_id, not both")
        if not self.listing_id and not self.sublet_id:
            raise ValueError("Provide either listing_id or sublet_id")
        return self

class BookingCreate(BaseModel):
    slot_id: int
    notes: Optional[str] = None

# Responses
class ViewingSlotResponse(BaseModel):
    id: int
    listing_id: Optional[int] = None
    sublet_id: Optional[int] = None
    date: date
    start_time: time
    end_time: time
    status: ViewingSlotStatus

    class Config:
        from_attributes = True

class AvailabilityResponse(BaseModel):
    id: int
    listing_id: Optional[int] = None
    sublet_id: Optional[int] = None
    date: date
    start_time: time
    end_time: time
    slots: list[ViewingSlotResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

class BookingResponse(BaseModel):
    id: int
    slot_id: int
    listing_id: Optional[int] = None
    sublet_id: Optional[int] = None
    student_id: int
    student_name: str
    landlord_id: Optional[int] = None
    landlord_name: str
    date: date
    start_time: time
    end_time: time
    status: BookingStatus
    notes: Optional[str] = None
    listing_title: str
    listing_address: str
    created_at: datetime

    class Config:
        from_attributes = True