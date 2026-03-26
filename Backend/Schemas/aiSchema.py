from datetime import datetime
from typing import Optional
from pydantic import BaseModel, model_validator

class CompareRequest(BaseModel):
    listing_ids: list[int]
 
class CompareResponse(BaseModel):
    summary: str
    listings_compared: int