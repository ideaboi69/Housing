import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from tables import get_db
from tables import User, Landlord
from Schemas.userSchema import UserRole, UserCreate, UserUpdate, UserLogin, UserResponse, TokenResponse, PasswordChange
from helpers import check_uoguelph_email
from Utils.security import hash_password, verify_password, create_access_token, get_current_user, validate_password
from Utils.email_token import create_email_verification_token, decode_email_verification_token
from Utils.email import send_verification_email
from config import settings

user_router = APIRouter()

# Create User Account
@user_router.post("/register", status_code=status.HTTP_201_CREATED)
def register_users(payload: UserCreate, db: Session = Depends(get_db)):

    if not check_uoguelph_email(payload.email):
        raise HTTPException(status_code=400, detail="Only @uoguelph.ca emails are allowed")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    
    validate_password(payload.password)

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=UserRole.STUDENT,
        email_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    email_token = create_email_verification_token(user.email)
    send_verification_email(user.email, user.first_name, email_token)

    return {
        "message": "Account created. Please check your email to verify your account.",
        "user_id": user.id,
    }

# User Login
# JSON login for frontend
@user_router.post("/login")
def user_login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"user_id": user.id, "role": user.role.value})

    return {
        "access_token": token, 
        "token_type": "bearer", 
        "user": {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.value,
        "email_verified": user.email_verified,
        "is_writable": user.is_writable,
        },
    }

# Login for swagger 
@user_router.post("/login/swagger")
def user_login_swagger(payload: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.username).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"user_id": user.id, "role": user.role.value})

    return {"access_token": token, "token_type": "bearer"}

# Verify email
@user_router.get("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(token: str, db: Session = Depends(get_db)):
    email = decode_email_verification_token(token)

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.email_verified:
        return {"message": "Email already verified"}

    user.email_verified = True
    db.commit()

    access_token = create_access_token({"user_id": user.id, "role": user.role.value})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )

# Resend verification 
@user_router.post("/resend-verification", status_code=status.HTTP_200_OK)
def resend_verification(email: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return {"message": "A verification link has been sent."}

    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    email_token = create_email_verification_token(user.email)
    send_verification_email(user.email, user.first_name, email_token)

    return {"message": "A verification link has been sent."}

# Viewing and updating user profiles
@user_router.get("/me", response_model=UserResponse)
def view_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@user_router.patch("/me", response_model=UserResponse)
def update_user_profile(payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.email and payload.email != current_user.email:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")
        
        if payload.email and not check_uoguelph_email(payload.email):
            raise HTTPException(status_code=400, detail="Only @uoguelph.ca emails are allowed")
        current_user.email = payload.email
        current_user.email_verified = False  # re-verify on email change

    if payload.first_name:
        current_user.first_name = payload.first_name
    if payload.last_name:
        current_user.last_name = payload.last_name

    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)

# Changing Password
@user_router.patch("/me/password", status_code=status.HTTP_200_OK)
def change_password(payload: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password updated successfully"}

@user_router.post("/request-write-access", status_code=status.HTTP_200_OK)
def request_write_access( reason: str = Form(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.is_writable:
        raise HTTPException(status_code=400, detail="You already have write access")

    if not current_user.email_verified:
        raise HTTPException(status_code=403, detail="Verify your email first")
    
    if current_user.write_access_requested:
        raise HTTPException(status_code=400, detail="You've already submitted a request")

    current_user.write_access_requested = True
    db.commit()

    try:
        httpx.post(
            settings.FORMSPREE_ENDPOINT,
            json={
                "type": "Student Write Access Request",
                "name": f"{current_user.first_name} {current_user.last_name}",
                "email": current_user.email,
                "user_id": current_user.id,
                "reason": reason,
            },
        )
    except Exception:
        pass
    return {"message": "Your request has been submitted. You'll be notified once reviewed."}

# Delete Account
@user_router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    landlord = db.query(Landlord).filter(Landlord.user_id == current_user.id).first() # if user has a landlord profile, delete that first
    if landlord:
        db.delete(landlord)

    db.delete(current_user)
    db.commit()

    return {"message": "Account has been deleted successfully"}

# Get user by ID
@user_router.get("/{user_id}", response_model=UserResponse)
def get_user_profile_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse.model_validate(user)