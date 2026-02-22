from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
from decimal import Decimal
import enum

# Enum
class MarketplaceCategory(str, enum.Enum):
    FURNITURE = "furniture"
    APPLIANCES = "appliances"
    KITCHENWARE = "kitchenware"
    ELECTRONICS = "electronics"
    DECOR = "decor"
    CLEANING = "cleaning"
    STORAGE = "storage"
    LIGHTING = "lighting"
    BEDDING = "bedding"
    BATHROOM = "bathroom"
    OTHER = "other"

class ItemCondition(str, enum.Enum):
    NEW = "new"
    LIKE_NEW = "like_new"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"

class ItemStatus(str, enum.Enum):
    AVAILABLE = "available"
    SOLD = "sold"
    RESERVED = "reserved"
    REMOVED = "removed"

class PricingType(str, enum.Enum):
    FREE = "free"
    FIXED = "fixed"
    NEGOTIABLE = "negotiable"

# Requests
class MarketplaceItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: MarketplaceCategory
    condition: ItemCondition
    pricing_type: PricingType
    price: Optional[Decimal] = None
    pickup_location: str
    pickup_notes: Optional[str] = None

class MarketplaceItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[MarketplaceCategory] = None
    condition: Optional[ItemCondition] = None
    pricing_type: Optional[PricingType] = None
    price: Optional[Decimal] = None
    pickup_location: Optional[str] = None
    pickup_notes: Optional[str] = None
    status: Optional[ItemStatus] = None

class MarketplaceMessageCreate(BaseModel):
    content: str

class StartMarketplaceConversation(BaseModel):
    item_id: int
    content: str

# Responses 
class MarketplaceImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool

    class Config:
        from_attributes = True


class MarketplaceItemResponse(BaseModel):
    id: int
    seller_id: int
    seller_name: str
    title: str
    description: Optional[str] = None
    category: MarketplaceCategory
    condition: ItemCondition
    pricing_type: PricingType
    price: Optional[Decimal] = None
    pickup_location: str
    pickup_notes: Optional[str] = None
    status: ItemStatus
    view_count: int
    images: list[MarketplaceImageResponse] = []
    primary_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MarketplaceItemListResponse(BaseModel):
    id: int
    title: str
    category: MarketplaceCategory
    condition: ItemCondition
    pricing_type: PricingType
    price: Optional[Decimal] = None
    status: ItemStatus
    seller_name: str
    primary_image: Optional[str] = None
    view_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class MarketplaceMessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MarketplaceConversationResponse(BaseModel):
    id: int
    item_id: int
    item_title: str
    buyer_id: int
    buyer_name: str
    seller_id: int
    seller_name: str
    last_message: Optional[MarketplaceMessageResponse] = None
    unread_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MarketplaceConversationDetailResponse(BaseModel):
    id: int
    item_id: int
    item_title: str
    buyer_id: int
    buyer_name: str
    seller_id: int
    seller_name: str
    messages: list[MarketplaceMessageResponse]

    class Config:
        from_attributes = True