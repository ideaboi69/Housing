from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
from decimal import Decimal
import enum

# Enum
class PostStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class PostCategory(str, enum.Enum):
    EVENT = "event"
    DEAL = "deal"
    NEWS = "news"
    LIFESTYLE = "lifestyle"
    FOOD = "food"
    OTHER = "other"

# Request
class PostCreate(BaseModel):
    title: str
    content: str
    preview: Optional[str] = None
    category: PostCategory
    event_date: Optional[date] = None
    event_location: Optional[str] = None
    event_link: Optional[str] = None
    deal_expires: Optional[date] = None

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    preview: Optional[str] = None
    category: Optional[PostCategory] = None
    status: Optional[PostStatus] = None
    event_date: Optional[date] = None
    event_location: Optional[str] = None
    event_link: Optional[str] = None
    deal_expires: Optional[date] = None

class PostResponse(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    preview: Optional[str] = None
    cover_image_url: Optional[str] = None
    category: PostCategory
    author_name: str
    author_type: str
    status: PostStatus
    view_count: int
    event_date: Optional[date] = None
    event_location: Optional[str] = None
    event_link: Optional[str] = None
    deal_expires: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PostListResponse(BaseModel):
    id: int
    title: str
    slug: str
    preview: Optional[str] = None
    cover_image_url: Optional[str] = None
    category: PostCategory
    author_name: str
    author_type: str
    status: PostStatus
    view_count: int
    event_date: Optional[date] = None
    deal_expires: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True