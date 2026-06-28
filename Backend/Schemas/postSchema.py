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

class PostFeatureUpdate(BaseModel):
    is_featured: bool
    featured_order: Optional[int] = None
    featured_until: Optional[date] = None

class PostImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool
    display_order: int

    class Config:
        from_attributes = True

class PostImageReorder(BaseModel):
    image_ids: list[int]

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
    author_id: Optional[int] = None
    author_photo_url: Optional[str] = None
    author_is_official: bool = False
    status: PostStatus
    view_count: int
    upvote_count: int = 0
    user_has_upvoted: bool = False
    event_date: Optional[date] = None
    event_location: Optional[str] = None
    event_link: Optional[str] = None
    deal_expires: Optional[date] = None
    is_featured: bool = False
    featured_order: Optional[int] = None
    featured_until: Optional[date] = None
    images: list[PostImageResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PostListResponse(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    preview: Optional[str] = None
    cover_image_url: Optional[str] = None
    category: PostCategory
    author_name: str
    author_type: str
    author_id: Optional[int] = None
    author_photo_url: Optional[str] = None
    author_is_official: bool = False
    status: PostStatus
    view_count: int
    upvote_count: int = 0
    user_has_upvoted: bool = False
    event_date: Optional[date] = None
    deal_expires: Optional[date] = None
    is_featured: bool = False
    featured_order: Optional[int] = None
    featured_until: Optional[date] = None
    images: list[PostImageResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
