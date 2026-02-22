from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt, ExpiredSignatureError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from config import settings
from tables import get_db, User, Landlord, Admin

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
user_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/users/login",scheme_name="UserAuth")
landlord_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/landlords/login",scheme_name="LandlordAuth")
admin_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/admin/login", scheme_name="AdminAuth")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

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

    if role == "landlord":
        user = db.query(Landlord).get(user_id)
    else:
        user = db.query(User).get(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user

def get_current_landlord(token: str = Depends(landlord_oauth2), db: Session = Depends(get_db)):
    payload = decode_access_token(token)

    if payload.get("role") != "landlord":
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

    if payload.get("role") != "admin":
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