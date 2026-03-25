from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from tables import get_db, User, Landlord, Property, Listing, ListingImage, Review, Flag, SavedListing, HousingHealthScore, Admin, Writer, Post
from Schemas.adminSchema import AdminCreate, AdminLogin, AdminResponse, AdminTokenResponse, AdminUserResponse, AdminLandlordResponse, AdminListingResponse, AdminStatsResponse
from Schemas.userSchema import UserRole
from Schemas.landlordSchema import LandlordUpdate, LandlordResponse
from Schemas.flagSchema import FlagStatus
from Schemas.writerSchema import WriterStatus, WriterResponse
from Schemas.postSchema import PostResponse, PostListResponse
from helpers import require_admin, cascade_delete_landlord
from Utils.security import get_current_user, hash_password, create_access_token, verify_password, validate_password
from Utils.cloudinary import delete_image_from_cloudinary
from Utils.email import send_approval_email, send_rejection_email, send_revoked_email
from Utils.rate_limit import limiter
from config import settings

admin_router = APIRouter()

# CREATE AN ADMIN ACCOUNT
@admin_router.post("/register", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
def create_admin(payload: AdminCreate, db: Session = Depends(get_db), current_admin: Admin = Depends(require_admin)):
    existing = db.query(Admin).filter(Admin.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admin already exists")

    validate_password(payload.password)

    admin = Admin(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    return AdminResponse.model_validate(admin)

# ADMIN LOGIN
@admin_router.post("/login")
@limiter.limit("10/minute")
def admin_login(request: Request,form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == form_data.username).first()

    if not admin or not verify_password(form_data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is deactivated")

    token = create_access_token({"user_id": admin.id, "role": "admin"})

    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "first_name": admin.first_name,
            "last_name": admin.last_name,
            "is_active": admin.is_active,
        },
    }

# SEED FIRST ADMIN (protected with secret key)
@admin_router.post("/seed", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
def seed_admin(payload: AdminCreate, secret: str, db: Session = Depends(get_db)):
    """One-time endpoint to create the first admin. Requires ADMIN_SECRET."""
    if secret != settings.ADMIN_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid secret")

    existing = db.query(Admin).filter(Admin.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admin already exists")

    admin = Admin(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    return AdminResponse.model_validate(admin)

# ADMIN DASHBOARD
@admin_router.get("/stats", response_model=AdminStatsResponse)
def get_website_stats(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return AdminStatsResponse(
        total_users=db.query(User).count(),
        total_landlords=db.query(Landlord).count(),
        total_properties=db.query(Property).count(),
        total_listings=db.query(Listing).count(),
        total_reviews=db.query(Review).count(),
        total_flags_pending=db.query(Flag).filter(Flag.status == FlagStatus.PENDING).count(),
    )

# USER ENDPOINTS
@admin_router.patch("/users/{user_id}/verify", status_code=status.HTTP_200_OK)
def verify_user_account(user_id: int, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.email_verified:
        raise HTTPException(status_code=400, detail="User is already verified")

    user.email_verified = True
    db.commit()

    return {"message": f"User {user.first_name} {user.last_name} has been manually verified"}

@admin_router.get("/users", response_model=list[AdminUserResponse])
def list_all_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    users = db.query(User).all()
    return [AdminUserResponse.model_validate(u) for u in users]

# MUST be above /users/{user_id} to avoid "pending-writers" being matched as a user_id
@admin_router.get("/users/pending-writers", response_model=list[AdminUserResponse])
def list_pending_write_requests(db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    users = db.query(User).filter(User.write_access_requested == True,User.is_writable == False).all()
    return [AdminUserResponse.model_validate(u) for u in users]

@admin_router.get("/users/{user_id}", response_model=AdminUserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return AdminUserResponse.model_validate(user)

@admin_router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.query(Review).filter(Review.student_id == user.id).delete()
    db.query(SavedListing).filter(SavedListing.student_id == user.id).delete()
    db.query(Flag).filter(Flag.reporter_id == user.id).delete()

    db.delete(user)
    db.commit()

    return None

# LANDLORD ENDPOINTS
@admin_router.get("/landlords", response_model=list[AdminLandlordResponse])
def list_all_landlords(db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    landlords = db.query(Landlord).all()
    return [
        AdminLandlordResponse(
            id=l.id,
            first_name=l.first_name,
            last_name=l.last_name,
            email=l.email,
            company_name=l.company_name,
            phone=l.phone,
            identity_verified=l.identity_verified,
        )
        for l in landlords
    ]

@admin_router.get("/landlords/{landlord_id}", response_model=AdminLandlordResponse)
def get_landlord_by_id(landlord_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return AdminLandlordResponse(
            id=landlord.id,
            first_name=landlord.first_name,
            last_name=landlord.last_name,
            email=landlord.email,
            company_name=landlord.company_name,
            phone=landlord.phone,
            identity_verified=landlord.identity_verified)

@admin_router.delete("/landlords/{landlord_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_landlord(landlord_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Delete a landlord profile and cascade delete all their properties, listings, etc"""
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord not found")

    cascade_delete_landlord(landlord, db)
    db.commit()

    return None

@admin_router.patch("/landlords/{landlord_id}/verify", status_code=status.HTTP_200_OK)
def verify_landlord(landlord_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Admin approves a landlord's identity verification."""
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord not found")

    if landlord.identity_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Landlord is already verified")

    landlord.identity_verified = True
    db.commit()

    return {"message": f"Landlord {landlord_id} is now verified"}

@admin_router.patch("/landlords/{landlord_id}/unverify", status_code=status.HTTP_200_OK)
def unverify_landlord(landlord_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Admin revokes a landlord's identity verification."""
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord not found")

    if not landlord.identity_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Landlord is not verified")

    landlord.identity_verified = False
    db.commit()

    return {"message": f"Landlord {landlord_id} verification revoked"}

# LISTING ENDPOINTS
@admin_router.get("/listings", response_model=list[AdminListingResponse])
def list_all_listings(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    listings = db.query(Listing).all()
    return [AdminListingResponse.model_validate(l) for l in listings]

@admin_router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(listing_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    images = db.query(ListingImage).filter(ListingImage.listing_id == listing.id).all()
    for image in images:
        delete_image_from_cloudinary(image.image_url)

    db.query(ListingImage).filter(ListingImage.listing_id == listing.id).delete()
    db.query(HousingHealthScore).filter(HousingHealthScore.listing_id == listing.id).delete()
    db.query(SavedListing).filter(SavedListing.listing_id == listing.id).delete()
    db.query(Flag).filter(Flag.listing_id == listing.id).delete()

    db.delete(listing)
    db.commit()

    return None

# REVIEW ENDPOINT
@admin_router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    db.query(Flag).filter(Flag.review_id == review.id).delete()
    db.delete(review)
    db.commit()

    return None

# FLAG ENDPOINTS
@admin_router.get("/flags", response_model=None)
def list_pending_flags(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    flags = db.query(Flag).filter(Flag.status == FlagStatus.PENDING).all()
    return [
        {
            "id": f.id,
            "reporter_id": f.reporter_id,
            "listing_id": f.listing_id,
            "review_id": f.review_id,
            "reason": f.reason,
            "status": f.status.value if hasattr(f.status, "value") else f.status,
            "created_at": str(f.created_at),
        }
        for f in flags
    ]


@admin_router.patch("/flags/{flag_id}/resolve", status_code=status.HTTP_200_OK)
def resolve_flag(flag_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    flag = db.query(Flag).filter(Flag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flag not found")

    flag.status = FlagStatus.RESOLVED  
    db.commit()

    return {"message": f"Flag {flag_id} resolved"}


@admin_router.patch("/flags/{flag_id}/dismiss", status_code=status.HTTP_200_OK)
def dismiss_flag(flag_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    flag = db.query(Flag).filter(Flag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flag not found")

    flag.status = FlagStatus.REVIEWED  
    db.commit()

    return {"message": f"Flag {flag_id} dismissed"}

# WRITER ENDPOINTS
@admin_router.get("/writers", response_model=list[WriterResponse])
def list_all_writers(db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    writers = db.query(Writer).order_by(Writer.created_at.desc()).all()
    return [WriterResponse.model_validate(w) for w in writers]

@admin_router.get("/writers/pending", response_model=list[WriterResponse])
def list_pending_writers(db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    writers = db.query(Writer).filter(Writer.status == WriterStatus.PENDING).all()
    return [WriterResponse.model_validate(w) for w in writers]

@admin_router.patch("/writers/{writer_id}/approve", status_code=status.HTTP_200_OK)
def approve_writer(writer_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    writer = db.query(Writer).filter(Writer.id == writer_id).first()
    if not writer:
        raise HTTPException(status_code=404, detail="Writer not found")

    if writer.status == WriterStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Writer already approved")

    writer.status = WriterStatus.APPROVED
    db.commit()
    
    background_tasks.add_task(
        send_approval_email,
        to_email=writer.email,
        name=writer.first_name,
        account_type="writer",
    )

    return {"message": f"Writer '{writer.business_name}' approved"}

@admin_router.patch("/writers/{writer_id}/reject", status_code=status.HTTP_200_OK)
def reject_writer(writer_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    writer = db.query(Writer).filter(Writer.id == writer_id).first()
    if not writer:
        raise HTTPException(status_code=404, detail="Writer not found")

    writer.status = WriterStatus.REJECTED
    db.commit()

    background_tasks.add_task(
        send_rejection_email,
        to_email=writer.email,
        name=writer.first_name,
        account_type="writer",
    )

    return {"message": f"Writer '{writer.business_name}' rejected"}

@admin_router.patch("/writers/{writer_id}/revoke", status_code=status.HTTP_200_OK)
def revoke_writer(writer_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    writer = db.query(Writer).filter(Writer.id == writer_id).first()
    if not writer:
        raise HTTPException(status_code=404, detail="Writer not found")

    if writer.status != WriterStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Writer is not currently approved")

    writer.status = WriterStatus.REVOKED
    db.commit()

    background_tasks.add_task(
        send_revoked_email,
        to_email=writer.email,
        name=writer.first_name,
        account_type="writer",
    )

    return {"message": f"Writer '{writer.business_name}' access revoked"}

@admin_router.delete("/writers/{writer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_writer(writer_id: int, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    writer = db.query(Writer).filter(Writer.id == writer_id).first()
    if not writer:
        raise HTTPException(status_code=404, detail="Writer not found")

    posts = db.query(Post).filter(Post.writer_id == writer.id).all()
    for post in posts:
        if post.cover_image_url:
            delete_image_from_cloudinary(post.cover_image_url)
    db.query(Post).filter(Post.writer_id == writer.id).delete()

    db.delete(writer)
    db.commit()

# STUDENT WRITE ENDPOINTS
@admin_router.patch("/users/{user_id}/grant-write", status_code=status.HTTP_200_OK)
def grant_write_access(user_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_writable:
        raise HTTPException(status_code=400, detail="User already has write access")

    user.is_writable = True
    user.write_access_requested = False 
    db.commit()

    background_tasks.add_task(
        send_approval_email,
        to_email=user.email,
        name=user.first_name,
        account_type="student",
    )

    return {"message": f"Write access granted to {user.first_name} {user.last_name}"}

@admin_router.patch("/users/{user_id}/reject-write", status_code=status.HTTP_200_OK)
def reject_write_access(user_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.write_access_requested:
        raise HTTPException(status_code=400, detail="No pending request from this user")

    user.write_access_requested = False
    db.commit()

    background_tasks.add_task(
        send_rejection_email,
        to_email=user.email,
        name=user.first_name,
        account_type="student",
    )

    return {"message": f"Write request rejected for {user.first_name} {user.last_name}"}

@admin_router.patch("/users/{user_id}/revoke-write", status_code=status.HTTP_200_OK)
def revoke_write_access(user_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_writable:
        raise HTTPException(status_code=400, detail="User doesn't have write access")

    user.is_writable = False
    user.write_access_requested = False
    db.commit()

    background_tasks.add_task(
        send_revoked_email,
        to_email=user.email,
        name=user.first_name,
        account_type="student",
    )

    return {"message": f"Write access revoked for {user.first_name} {user.last_name}"}

@admin_router.patch("/users/{user_id}/grant-og", status_code=status.HTTP_200_OK)
def grant_og_badge(user_id: int, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
 
    if user.is_early_adopter:
        raise HTTPException(status_code=400, detail="User already has OG badge")
 
    user.is_early_adopter = True
    db.commit()
 
    return {"message": f"OG badge granted to {user.first_name} {user.last_name}"}
 
@admin_router.patch("/users/{user_id}/revoke-og", status_code=status.HTTP_200_OK)
def revoke_og_badge(user_id: int, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
 
    if not user.is_early_adopter:
        raise HTTPException(status_code=400, detail="User doesn't have OG badge")
 
    user.is_early_adopter = False
    db.commit()
 
    return {"message": f"OG badge revoked for {user.first_name} {user.last_name}"}

# POST ENDPOINTS
@admin_router.get("/posts", response_model=list[PostListResponse])
def list_all_posts(db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    return [PostListResponse.model_validate(p) for p in posts]

@admin_router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_post(post_id: int, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.cover_image_url:
        delete_image_from_cloudinary(post.cover_image_url)

    db.delete(post)
    db.commit()