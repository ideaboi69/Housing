from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from tables import get_db, RefreshToken
from Utils.security import rotate_refresh_token, revoke_refresh_token, _hash_token, _get_user_by_role
from Schemas.authSchema import RefreshRequest, LogoutRequest, SecurityEventType
from helpers import log_security_event

auth_router = APIRouter()

@auth_router.post("/refresh", status_code=status.HTTP_200_OK)
def refresh(request: Request, payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        new_access, new_refresh, role, user = rotate_refresh_token(payload.refresh_token, db)
    except HTTPException as e:
        if "Token reuse detected" in str(e.detail):
            token_hash = _hash_token(payload.refresh_token)
            stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
            if stored:
                log_security_event(db, stored.user_id, stored.role, SecurityEventType.TOKEN_REUSE_DETECTED, request, metadata={"family_id": stored.family_id})
                db.commit()
        raise
    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
    }

@auth_router.post("/logout", status_code=status.HTTP_200_OK)
def logout(request: Request, payload: LogoutRequest, db: Session = Depends(get_db)):
    token_hash = _hash_token(payload.refresh_token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if stored and not stored.is_revoked:
        log_security_event(db, stored.user_id, stored.role, SecurityEventType.SIGN_OUT, request)
    revoke_refresh_token(payload.refresh_token, db)
    return {"message": "Logged out successfully"}
