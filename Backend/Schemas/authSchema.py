from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import enum

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class SecurityEventType(str, enum.Enum):
    SIGN_IN = "sign_in"
    SIGN_IN_FAILED = "sign_in_failed"
    SIGN_OUT = "sign_out"
    SIGN_OUT_ALL = "sign_out_all"
    PASSWORD_CHANGED = "password_changed"
    PASSWORD_RESET_REQUESTED = "password_reset_requested"
    PASSWORD_RESET_COMPLETED = "password_reset_completed"
    EMAIL_VERIFIED = "email_verified"
    EMAIL_CHANGED = "email_changed"
    TOKEN_REUSE_DETECTED = "token_reuse_detected"
    ACCOUNT_CREATED = "account_created"

class SecurityEventResponse(BaseModel):
    id: int
    event_type: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True
