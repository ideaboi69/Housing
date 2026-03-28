import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Form, Request, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from tables import *
from Schemas.userSchema import UserRole, UserCreate, UserUpdate, UserLogin, UserResponse, TokenResponse, PasswordChange, ForgotPasswordRequest, ResetPasswordRequest, NotificationPreferencesUpdate, NotificationPreferencesResponse
from helpers import check_uoguelph_email, cascade_delete_user
from Utils.security import hash_password, verify_password, create_access_token, get_current_user, validate_password, create_password_reset_token, decode_password_reset_token
from Utils.email_token import create_email_verification_token, decode_email_verification_token
from Utils.email import send_verification_email, send_password_reset_email
from Schemas.subletSchema import SubletStatus
from Schemas.postSchema import PostStatus
from Schemas.marketplaceSchema import ItemStatus
from Schemas.convoSchema import SenderType
from Schemas.viewingSchema import BookingStatus
from Schemas.roommateSchema import InviteStatus, RequestStatus
from Utils.rate_limit import limiter
from Utils.cloudinary import upload_image_to_cloudinary, delete_image_from_cloudinary
from config import settings

user_router = APIRouter()

# Create User Account
@user_router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register_users(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    if not check_uoguelph_email(payload.email):
        raise HTTPException(status_code=400, detail="Only @uoguelph.ca emails are allowed")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    
    validate_password(payload.password)

    user_count = db.query(User).count()
    is_og = user_count < 100

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

    access_token = create_access_token({"user_id": user.id, "role": user.role.value})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )

# User Login
# JSON login for frontend
@user_router.post("/login")
@limiter.limit("10/minute")
def user_login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

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
@limiter.limit("10/minute")
def user_login_swagger(request: Request, payload: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

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

# Forgot Password — send reset link
@user_router.post("/forgot-password", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Always return success to prevent email enumeration
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        reset_token = create_password_reset_token(user.email)
        send_password_reset_email(user.email, user.first_name, reset_token)

    return {"message": "If an account exists with that email, a reset link has been sent."}

# Reset Password — set new password using token
@user_router.post("/reset-password", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = decode_password_reset_token(payload.token)

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    validate_password(payload.new_password)

    user.password_hash = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password has been reset successfully. You can now log in."}

# Refresh Token — issue a new access token if the current one is still valid
@user_router.post("/refresh", status_code=status.HTTP_200_OK)
def refresh_token(current_user: User = Depends(get_current_user)):
    token = create_access_token({"user_id": current_user.id, "role": current_user.role.value})
    return {"access_token": token, "token_type": "bearer"}

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
    if payload.program is not None:
        current_user.program = payload.program
    if payload.year is not None:
        current_user.year = payload.year
    if payload.bio is not None:
        current_user.bio = payload.bioye

    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)

# Changing Password
@user_router.patch("/me/password", status_code=status.HTTP_200_OK)
def change_password(payload: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    validate_password(payload.new_password)
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password updated successfully"}

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
 
# Upload profile photo
@user_router.post("/me/profile-photo", status_code=status.HTTP_200_OK)
async def upload_profile_photo(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image type. Allowed: JPEG, PNG, WebP")
 
    # Delete old photo if exists
    if current_user.profile_photo_url:
        delete_image_from_cloudinary(current_user.profile_photo_url)
 
    image_url = upload_image_to_cloudinary(file, folder=f"users/{current_user.id}")
    current_user.profile_photo_url = image_url
    db.commit()
 
    return {"profile_photo_url": image_url}
 
# Delete profile photo
@user_router.delete("/me/profile-photo", status_code=status.HTTP_200_OK)
def delete_profile_photo(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.profile_photo_url:
        raise HTTPException(status_code=400, detail="No profile photo to delete")
 
    delete_image_from_cloudinary(current_user.profile_photo_url)
    current_user.profile_photo_url = None
    db.commit()
 
    return {"message": "Profile photo removed"}

# Get notification preferences
@user_router.get("/me/notifications", response_model=NotificationPreferencesResponse)
def get_notification_preferences(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prefs = db.query(NotificationPreferences).filter(NotificationPreferences.user_id == current_user.id).first()
 
    if not prefs:
        prefs = NotificationPreferences(user_id=current_user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
 
    return NotificationPreferencesResponse.model_validate(prefs)
 
# Update notification preferences
@user_router.patch("/me/notifications", response_model=NotificationPreferencesResponse)
def update_notification_preferences(payload: NotificationPreferencesUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prefs = db.query(NotificationPreferences).filter(NotificationPreferences.user_id == current_user.id).first()
 
    if not prefs:
        prefs = NotificationPreferences(user_id=current_user.id)
        db.add(prefs)
        db.flush()
 
    if payload.new_listings_matching is not None:
        prefs.new_listings_matching = payload.new_listings_matching
    if payload.price_drops_saved is not None:
        prefs.price_drops_saved = payload.price_drops_saved
    if payload.new_roommate_matches is not None:
        prefs.new_roommate_matches = payload.new_roommate_matches
    if payload.weekly_bubble_digest is not None:
        prefs.weekly_bubble_digest = payload.weekly_bubble_digest
    if payload.cribb_news_updates is not None:
        prefs.cribb_news_updates = payload.cribb_news_updates
 
    db.commit()
    db.refresh(prefs)
 
    return NotificationPreferencesResponse.model_validate(prefs)

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
    cascade_delete_user(current_user, db)
    db.commit()

# Get user by ID
@user_router.get("/{user_id}", response_model=UserResponse)
def get_user_profile_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse.model_validate(user)

@user_router.get("/me/dashboard")
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    sublets_active = db.query(Sublet).filter(Sublet.user_id == user_id, Sublet.status == SubletStatus.ACTIVE).count()
    sublets_drafts = db.query(Sublet).filter(Sublet.user_id == user_id, Sublet.status == SubletStatus.DRAFT).count()
    sublets_total = db.query(Sublet).filter(Sublet.user_id == user_id).count()
    post_count = db.query(Post).filter(Post.user_id == user_id).count()
    saved_count = db.query(SavedListing).filter(SavedListing.student_id == user_id).count()

    marketplace_active = db.query(MarketplaceItem).filter(MarketplaceItem.seller_id == user_id, MarketplaceItem.status == ItemStatus.AVAILABLE).count()
    marketplace_sold = db.query(MarketplaceItem).filter(MarketplaceItem.seller_id == user_id, MarketplaceItem.status == ItemStatus.SOLD).count()
    marketplace_drafts = db.query(MarketplaceItem).filter(MarketplaceItem.seller_id == user_id, MarketplaceItem.status == ItemStatus.DRAFT).count()
    marketplace_views_result = db.query(sql_func.coalesce(sql_func.sum(MarketplaceItem.view_count), 0)).filter(MarketplaceItem.seller_id == user_id).scalar()
    marketplace_total_views = int(marketplace_views_result)
 
    try:
        marketplace_convo_ids = [c.id for c in db.query(MarketplaceConversation.id).filter(
            (MarketplaceConversation.seller_id == user_id) | (MarketplaceConversation.buyer_id == user_id)).all()]
        if marketplace_convo_ids:
            marketplace_unread = db.query(MarketplaceMessage).filter(
                MarketplaceMessage.conversation_id.in_(marketplace_convo_ids),
                MarketplaceMessage.is_read == False,
                MarketplaceMessage.sender_id != user_id,
            ).count()
        else:
            marketplace_unread = 0
    except Exception:
        marketplace_unread = 0

    # Viewings
    try:
        upcoming_viewings = db.query(ViewingBooking).filter(
            ViewingBooking.student_id == user_id,
            ViewingBooking.status == BookingStatus.CONFIRMED,
        ).count()
    except Exception:
        upcoming_viewings = 0

    # Unread messages
    try:
        convo_ids = [c.id for c in db.query(Conversation.id).filter(Conversation.user_id == user_id).all()]
        if convo_ids:
            unread_messages = db.query(Message).filter(
                Message.conversation_id.in_(convo_ids),
                Message.is_read == False,
                Message.sender_type == SenderType.LANDLORD,
            ).count()
        else:
            unread_messages = 0
    except Exception:
        unread_messages = 0

    reviews_written = db.query(Review).filter(Review.student_id == user_id).count()
    roommate_profile = db.query(RoommateProfile).filter(RoommateProfile.user_id == user_id).first()
    has_roommate_profile = roommate_profile is not None
    roommate_quiz_completed = roommate_profile.quiz_completed if roommate_profile else False
    owned_group = db.query(RoommateGroup).filter(RoommateGroup.owner_id == user_id, RoommateGroup.is_active == True).first()
    member_record = db.query(RoommateGroupMember).filter(RoommateGroupMember.user_id == user_id, RoommateGroupMember.is_active == True).first()
 
    if owned_group:
        is_in_group = True
        is_group_owner = True
        group_id = owned_group.id
        group_name = owned_group.name
    elif member_record:
        is_in_group = True
        is_group_owner = False
        group = db.query(RoommateGroup).filter(RoommateGroup.id == member_record.group_id).first()
        group_id = group.id if group else None
        group_name = group.name if group else None
    else:
        is_in_group = False
        is_group_owner = False
        group_id = None
        group_name = None
 
    pending_invites_received = db.query(RoommateInvite).filter(
        RoommateInvite.invited_user_id == user_id,
        RoommateInvite.status == InviteStatus.PENDING,
    ).count()
 
    pending_requests_sent = db.query(RoommateRequest).filter(
        RoommateRequest.user_id == user_id,
        RoommateRequest.status == RequestStatus.PENDING,
    ).count()
 
    # Profile completeness
    fields_to_check = [
        current_user.first_name,
        current_user.last_name,
        current_user.email_verified,
        current_user.program,
        current_user.year,
        current_user.bio,
        current_user.profile_photo_url,
    ]
    filled = sum(1 for f in fields_to_check if f)
    profile_completeness = round((filled / len(fields_to_check)) * 100)
 
    return {
        "sublets_active": sublets_active,
        "sublets_drafts": sublets_drafts,
        "sublets_total": sublets_total,
        "posts": post_count,
        "saved_listings": saved_count,
        "marketplace_active": marketplace_active,
        "marketplace_sold": marketplace_sold,
        "marketplace_drafts": marketplace_drafts,
        "marketplace_unread_messages": marketplace_unread,
        "marketplace_total_views": marketplace_total_views,
        "upcoming_viewings": upcoming_viewings,
        "unread_messages": unread_messages,
        "reviews_written": reviews_written,
        "has_roommate_profile": has_roommate_profile,
        "roommate_quiz_completed": roommate_quiz_completed,
        "is_in_group": is_in_group,
        "is_group_owner": is_group_owner,
        "group_id": group_id,
        "group_name": group_name,
        "pending_invites_received": pending_invites_received,
        "pending_requests_sent": pending_requests_sent,
        "profile_completeness": profile_completeness,
    }
