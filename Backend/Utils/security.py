from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt, ExpiredSignatureError
import bcrypt
import secrets
import hashlib
from sqlalchemy.orm import Session
from config import settings
from tables import get_db, User, Landlord, Admin, Writer, RefreshToken
from Schemas.writerSchema import WriterStatus
from Schemas.userSchema import UserRole
import re

post_bearer = HTTPBearer(auto_error=False)

# Declaring various authentication methods for each user type
user_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/users/login/swagger",scheme_name="UserAuth")
landlord_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/landlords/login",scheme_name="LandlordAuth")
admin_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/admin/login", scheme_name="AdminAuth")
writer_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/writers/login", scheme_name="WriterAuth")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def validate_password(password: str) -> str:
    errors = []
    if len(password) < 8:
        errors.append("at least 8 characters")
    if not re.search(r"[A-Z]", password):
        errors.append("one uppercase letter")
    if not re.search(r"[a-z]", password):
        errors.append("one lowercase letter")
    if not re.search(r"[0-9]", password):
        errors.append("one number")
    if not re.search(r"[^A-Za-z0-9]", password):
        errors.append("one special character")
    if errors:
        raise HTTPException(
            status_code=400,
            detail=f"Password must contain: {', '.join(errors)}"
        )
    return password

def create_password_reset_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    return jwt.encode(
        {"email": email, "purpose": "password_reset", "exp": expire},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )

def decode_password_reset_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("purpose") != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid reset token")
        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid reset token")
        return email
    except ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid reset link. Please request a new one.")

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        ) 

def _check_token_version(payload: dict, user) -> None:
    if payload.get("tv", 0) != getattr(user, "token_version", 0):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(token: str = Depends(user_oauth2), db: Session = Depends(get_db)):
    payload = decode_access_token(token)

    user_id = payload.get("user_id")
    role = payload.get("role")

    if user_id is None or role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    if role == UserRole.LANDLORD.value:
        user = db.query(Landlord).get(user_id)
    elif role == UserRole.WRITER.value:
        user = db.query(Writer).get(user_id)
    else:
        user = db.query(User).get(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    _check_token_version(payload, user)
    return user

def get_current_student(token: str = Depends(user_oauth2), db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    user_id = payload.get("user_id")
    role = payload.get("role")

    if user_id is None or role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    if role != UserRole.STUDENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students only",
        )

    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email first",
        )

    _check_token_version(payload, user)
    return user

def get_current_landlord(token: str = Depends(landlord_oauth2), db: Session = Depends(get_db)):
    payload = decode_access_token(token)

    if payload.get("role") != UserRole.LANDLORD.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Landlord access required",
        )

    landlord = db.query(Landlord).get(payload["user_id"])
    if not landlord:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Landlord not found",
        )

    _check_token_version(payload, landlord)
    return landlord

def get_current_admin(token: str = Depends(admin_oauth2), db: Session = Depends(get_db)):
    payload = decode_access_token(token)

    if payload.get("role") != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    admin = db.query(Admin).get(payload["user_id"])
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")

    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is deactivated")

    _check_token_version(payload, admin)
    return admin

def get_current_writer(token: str = Depends(writer_oauth2), db: Session = Depends(get_db)):
    payload = decode_access_token(token)

    if payload.get("role") != UserRole.WRITER.value:
        raise HTTPException(status_code=403, detail="Writer access required")

    writer = db.query(Writer).get(payload["user_id"])
    if not writer:
        raise HTTPException(status_code=404, detail="Writer not found")

    if writer.status != WriterStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Your account is not approved yet")

    _check_token_version(payload, writer)
    return writer

def get_current_author( credentials: HTTPAuthorizationCredentials = Security(post_bearer), db: Session = Depends(get_db)):
    """Accepts both student and writer tokens for post endpoints."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("user_id")
    role = payload.get("role")

    if role ==  UserRole.WRITER.value:
        writer = db.query(Writer).get(user_id)
        if not writer:
            raise HTTPException(status_code=404, detail="Writer not found")
        if writer.status != WriterStatus.APPROVED:
            raise HTTPException(status_code=403, detail="Your writer account is not approved yet")
        _check_token_version(payload, writer)
        return writer

    elif role == UserRole.STUDENT.value:
        user = db.query(User).get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not user.email_verified:
            raise HTTPException(status_code=403, detail="Verify your email first")
        if not user.is_writable:
            raise HTTPException(status_code=403, detail="You don't have write access. Request it first.")
        _check_token_version(payload, user)
        return user

    else:
        raise HTTPException(status_code=403, detail="Only students and writers can create posts")

def require_role(required_role: str):
    """Dependency that checks if the current user has a specific role."""

    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.value != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires '{required_role}' role",
            )
        return current_user

    return role_checker

# ── Refresh Token helpers ──────────────────────────────────

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def _get_user_by_role(user_id: int, role: str, db: Session):
    if role == UserRole.STUDENT.value:
        return db.query(User).get(user_id)
    elif role == UserRole.LANDLORD.value:
        return db.query(Landlord).get(user_id)
    elif role == UserRole.WRITER.value:
        return db.query(Writer).get(user_id)
    elif role == UserRole.ADMIN.value:
        return db.query(Admin).get(user_id)
    return None

def create_refresh_token_for_user(user_id: int, role: str, db: Session) -> str:
    """Create a refresh token, store its SHA-256 hash in DB, return the raw token."""
    raw_token = secrets.token_urlsafe(64)
    token_hash = _hash_token(raw_token)
    family_id = secrets.token_urlsafe(32)

    refresh = RefreshToken(
        token_hash=token_hash,
        user_id=user_id,
        role=role,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        family_id=family_id,
    )
    db.add(refresh)
    db.flush()
    return raw_token

def rotate_refresh_token(raw_token: str, db: Session):
    """
    Validate a refresh token, revoke it, issue a new access + refresh pair.

    Stolen-token detection: if a *revoked* token is presented, the entire
    token family is nuked — every session spawned from the same login is
    invalidated, forcing a fresh login on all devices.

    Returns (new_access_token, new_refresh_token, role, user).
    """
    token_hash = _hash_token(raw_token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    if not stored:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # ── Stolen-token detection ──
    if stored.is_revoked:
        db.query(RefreshToken).filter(
            RefreshToken.family_id == stored.family_id
        ).update({"is_revoked": True}, synchronize_session=False)
        db.commit()
        raise HTTPException(
            status_code=401,
            detail="Token reuse detected. All sessions revoked. Please log in again.",
        )

    # ── Expiry check ──
    stored_exp = stored.expires_at
    if stored_exp.tzinfo is None:
        stored_exp = stored_exp.replace(tzinfo=timezone.utc)
    if stored_exp < datetime.now(timezone.utc):
        stored.is_revoked = True
        db.commit()
        raise HTTPException(status_code=401, detail="Refresh token expired. Please log in again.")

    # ── Look up user ──
    user = _get_user_by_role(stored.user_id, stored.role, db)
    if not user:
        stored.is_revoked = True
        db.commit()
        raise HTTPException(status_code=401, detail="User not found")

    # ── Revoke old, issue new (rotation) ──
    stored.is_revoked = True
    new_raw_token = secrets.token_urlsafe(64)
    new_token_hash = _hash_token(new_raw_token)
    stored.replaced_by = new_token_hash

    new_refresh = RefreshToken(
        token_hash=new_token_hash,
        user_id=stored.user_id,
        role=stored.role,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        family_id=stored.family_id,
    )
    db.add(new_refresh)

    # ── Build new access token ──
    token_data = {
        "user_id": stored.user_id,
        "role": stored.role,
        "tv": getattr(user, "token_version", 0),
    }
    if stored.role == UserRole.LANDLORD.value:
        token_data["verified"] = getattr(user, "identity_verified", False)

    new_access_token = create_access_token(token_data)
    db.commit()

    return new_access_token, new_raw_token, stored.role, user

def revoke_refresh_token(raw_token: str, db: Session) -> None:
    """Revoke a single refresh token (regular logout)."""
    token_hash = _hash_token(raw_token)
    db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash
    ).update({"is_revoked": True}, synchronize_session=False)
    db.commit()

def revoke_all_refresh_tokens(user_id: int, role: str, db: Session) -> None:
    """Revoke every active refresh token for a user (logout-all, password change/reset)."""
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.role == role,
        RefreshToken.is_revoked == False,
    ).update({"is_revoked": True}, synchronize_session=False)