from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GroupChatMessageCreate(BaseModel):
    content: str

class GroupChatMessageUpdate(BaseModel):
    content: str

class GroupChatMessageResponse(BaseModel):
    id: int
    group_id: int
    sender_id: int
    sender_name: str
    sender_initial: str
    sender_photo_url: Optional[str] = None
    content: str
    is_pinned: bool
    is_own: bool = False
    is_deleted: bool = False
    edited_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GroupChatHistoryResponse(BaseModel):
    messages: list[GroupChatMessageResponse]
    pinned: list[GroupChatMessageResponse]
    has_more: bool

class GroupChatUnreadResponse(BaseModel):
    group_id: int
    unread_count: int

class GroupChatMarkReadRequest(BaseModel):
    last_read_message_id: int