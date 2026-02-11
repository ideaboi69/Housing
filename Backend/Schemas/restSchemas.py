from datetime import date, datetime
import enum
from fastapi import UploadFile, File
from typing import List
from enum import Enum
from pydantic import BaseModel, HttpUrl, condecimal, EmailStr, field_validator
from typing import Annotated, Optional, Literal

class PropertyType(str, enum.Enum):
    HOUSE = "house"
    APARTMENT = "apartment"
    TOWNHOUSE = "townhouse"
    ROOM = "room"

class LeaseType(str, enum.Enum):
    EIGHT_MONTH = "8_month"
    TEN_MONTH = "10_month"
    TWELVE_MONTH = "12_month"
    FLEXIBLE = "flexible"

class GenderPreference(str, enum.Enum):
    ANY = "any"
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class ListingStatus(str, enum.Enum):
    ACTIVE = "active"
    RENTED = "rented"
    EXPIRED = "expired"

class FlagStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
