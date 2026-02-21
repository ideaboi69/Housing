import enum
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

# Enum
class SenderType(str, enum.Enum):
    STUDENT = "student"
    LANDLORD = "landlord"

class MessageCreate(BaseModel):
    content: str

class StartConversation(BaseModel):
    listing_id: int
    content: str  # first message

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_type: str
    sender_id: int
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    user_id: int
    landlord_id: int
    listing_id: int
    created_at: datetime
    updated_at: datetime
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0

    class Config:
        from_attributes = True

class ConversationDetailResponse(BaseModel):
    id: int
    user_id: int
    landlord_id: int
    listing_id: int
    messages: list[MessageResponse]

    class Config:
        from_attributes = True