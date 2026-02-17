from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
import enum

# Enum
class FlagStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"

# Request
class FlagCreate(BaseModel):
    listing_id: Optional[int] = None
    review_id: Optional[int] = None
    reason: str

# Response
class FlagResponse(BaseModel):
    id: int
    reporter_id: int
    listing_id: Optional[int] = None
    review_id: Optional[int] = None
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True