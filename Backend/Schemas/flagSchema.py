from datetime import datetime
from typing import Optional
from pydantic import BaseModel, model_validator
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
    marketplace_item_id: Optional[int] = None
    sublet_id: Optional[int] = None
    reason: str
 
    @model_validator(mode="after")
    def at_least_one_target(self):
        targets = [self.listing_id, self.review_id, self.marketplace_item_id, self.sublet_id]
        if not any(t is not None for t in targets):
            raise ValueError("Must provide at least one of: listing_id, review_id, marketplace_item_id, sublet_id")
        if sum(t is not None for t in targets) > 1:
            raise ValueError("Flag only one item at a time")
        return self

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