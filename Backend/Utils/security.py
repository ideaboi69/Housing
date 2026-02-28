from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt, ExpiredSignatureError
import bcrypt
from sqlalchemy.orm import Session
from config import settings
from tables import get_db, User, Landlord, Admin, Writer
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
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least 1 uppercase letter")
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least 1 number")
    return password

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
    if role =="writer":
        user =db.query(Writer).get(user_id)
    else:
        user = db.query(User).get(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

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
        return writer

    elif role == UserRole.STUDENT.value:
        user = db.query(User).get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not user.email_verified:
            raise HTTPException(status_code=403, detail="Verify your email first")
        if not user.is_writable:
            raise HTTPException(status_code=403, detail="You don't have write access. Request it first.")
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