from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
from decimal import Decimal
import enum

# Enum
class WriterStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVOKED = "revoked"

# Request
class WriterRegister(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    business_name: str
    business_type: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    reason: str

# Response
class WriterResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    business_name: str
    business_type: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    status: WriterStatus
    created_at: datetime

    class Config:
        from_attributes = True


class WriterTokenResponse(BaseModel):
    access_token: str
    writer: WriterResponse
