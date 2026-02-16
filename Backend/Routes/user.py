from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from tables import get_db
from tables import User, Landlord
from Schemas.userSchema import (UserRole, UserCreate, UserUpdate, UserLogin, UserResponse, TokenResponse, PasswordChange, RoleSwitch)
from helpers import check_uoguelph_email
from utils.security import (hash_password, verify_password, create_access_token, get_current_user)

user_router = APIRouter()

# Register and Login
@user_router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_users(payload: UserCreate, db: Session = Depends(get_db)):

    if not check_uoguelph_email(payload.email):
        raise HTTPException(status_code=400, detail="Only @uoguelph.ca emails are allowed")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=UserRole.STUDENT,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"user_id": user.id, "role": user.role.value})

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )

@user_router.post("/login", response_model=TokenResponse)
def user_login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"user_id": user.id, "role": user.role.value})

    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

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


# Switch roles from student to landlord
@user_router.patch("/me/role", response_model=UserResponse)
def switch_role(payload: RoleSwitch, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.role == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot switch to admin role")
    
    if payload.role == UserRole.LANDLORD:
        current_user.role = UserRole.LANDLORD

        existing_profile = db.query(Landlord).filter(Landlord.user_id == current_user.id).first()
        if not existing_profile:
            landlord = Landlord(
                user_id=current_user.id,
                company_name=payload.company_name,
                phone=payload.phone
            )
            db.add(landlord)

    elif payload.role == UserRole.STUDENT:
        current_user.role = UserRole.STUDENT
        # landlord profile stays in db — they might switch back

    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)

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