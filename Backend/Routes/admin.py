from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
from tables import *
from Schemas.adminSchema import AdminCreate, AdminResponse, AdminUserResponse, AdminLandlordResponse, AdminListingResponse, AdminSubletResponse, AdminStatsResponse, AccountType, SubletOnboardingEmailRequest
from Schemas.subletSchema import SubletStatus
from Schemas.flagSchema import FlagStatus
from Schemas.writerSchema import WriterStatus, WriterResponse
from Schemas.postSchema import PostResponse, PostListResponse
from helpers import require_admin, cascade_delete_landlord, get_account_or_404, log_security_event
from Utils.security import hash_password, create_access_token, verify_password, validate_password, create_refresh_token_for_user
from Schemas.authSchema import SecurityEventType
from Utils.cloudinary import delete_image_from_cloudinary
from Utils.email import send_approval_email, send_rejection_email, send_revoked_email, send_sublet_onboarding_email, send_sublet_expired_email, send_listing_expired_email
from Schemas.listingSchema import ListingStatus
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
        if admin:
            log_security_event(db, admin.id, "admin", SecurityEventType.SIGN_IN_FAILED, request)
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is deactivated")

    token = create_access_token({"user_id": admin.id, "role": "admin", "tv": admin.token_version})
    refresh_token = create_refresh_token_for_user(admin.id, "admin", db)
    log_security_event(db, admin.id, "admin", SecurityEventType.SIGN_IN, request)
    db.commit()

    return {
        "access_token": token,
        "refresh_token": refresh_token,
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
        total_marketplace_items=db.query(MarketplaceItem).count(),
        total_sublets=db.query(Sublet).count(),
        total_posts=db.query(Post).count(),
        total_writers=db.query(Writer).count(),
        total_roommate_groups=db.query(RoommateGroup).count(),
        total_roommate_profiles=db.query(RoommateProfile).count(),
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

# Gotta put it here to prevent dynamic routing issues
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

# WRITE ENDPOINTS
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

# OG-badge
@admin_router.patch("/{account_type}/{account_id}/grant-og", status_code=status.HTTP_200_OK)
def grant_og_badge(account_type: AccountType, account_id: int, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    account, label = get_account_or_404(account_type, account_id, db)

    if account.is_early_adopter:
        raise HTTPException(status_code=400, detail=f"{label} already has OG badge")

    account.is_early_adopter = True
    db.commit()

    return {"message": f"OG badge granted to {account.first_name} {account.last_name}"}

@admin_router.patch("/{account_type}/{account_id}/revoke-og", status_code=status.HTTP_200_OK)
def revoke_og_badge(account_type: AccountType, account_id: int, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    account, label = get_account_or_404(account_type, account_id, db)

    if not account.is_early_adopter:
        raise HTTPException(status_code=400, detail=f"{label} doesn't have OG badge")

    account.is_early_adopter = False
    db.commit()

    return {"message": f"OG badge revoked for {account.first_name} {account.last_name}"}

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

@admin_router.get("/landlords/unverified", response_model=list[AdminLandlordResponse])
def list_unverified_landlords(db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    landlords = db.query(Landlord).filter(Landlord.identity_verified == False).all()
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

@admin_router.delete("/landlords/{landlord_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_landlord(landlord_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Delete a landlord profile and cascade delete all their properties, listings, etc"""
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord not found")

    cascade_delete_landlord(landlord, db)
    db.commit()

    return None

# LISTING ENDPOINTS
@admin_router.get("/listings", response_model=list[AdminListingResponse])
def list_all_listings(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    listings = db.query(Listing).all()
    results = []
    for l in listings:
        data = AdminListingResponse.model_validate(l)
        if l.property:
            data.property_title = l.property.title
            data.address = l.property.address
        results.append(data)
    return results

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

# CRIBB AI — MANUAL TRIGGER (for testing the bi-weekly cron without waiting for Sunday)
@admin_router.post("/cribb-ai/trigger", status_code=status.HTTP_200_OK)
def admin_trigger_cribb_ai(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
    pillar: Optional[str] = Query(None, description="Override pillar: deals, events, or evergreen"),
):
    """
    Manually fire one Cribb AI generation cycle. Same code path as the bi-weekly cron.
    Returns the new post ID + edit link, or a detailed error.
    Use the optional ?pillar= query to force a specific pillar instead of rotation.
    """
    # Preflight checks so we don't waste a Claude call on broken config
    from Utils.ai_content.pipeline import _get_ai_writer, _count_ai_posts, _pick_evergreen_topic, _insert_draft
    from Utils.ai_content.prompts import pick_pillar, deals_prompt, events_prompt, evergreen_prompt
    from Utils.ai_content.scraper import gather_deals_sources, gather_events_sources
    from Utils.ai_content.generator import generate_post
    from Utils.email import send_cribb_draft_review_email

    writer = _get_ai_writer(db)
    if not writer:
        raise HTTPException(status_code=400, detail=f"AI writer not found or is_official=False (email={settings.CRIBB_AI_WRITER_EMAIL}). Register + approve + flip is_official first.")

    if not settings.FIRECRAWL_API_KEY:
        raise HTTPException(status_code=400, detail="FIRECRAWL_API_KEY is not set in env")
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=400, detail="ANTHROPIC_API_KEY is not set in env")

    selected_pillar = pillar or pick_pillar(_count_ai_posts(db, writer.id))
    if selected_pillar not in ("deals", "events", "evergreen"):
        raise HTTPException(status_code=400, detail=f"Invalid pillar: {selected_pillar}")

    # Build prompt
    if selected_pillar == "deals":
        sources = gather_deals_sources()
        prompt = deals_prompt(sources)
        sources_summary = {k: bool(v.strip()) for k, v in sources.items()}
    elif selected_pillar == "events":
        sources = gather_events_sources()
        prompt = events_prompt(sources)
        sources_summary = {k: bool(v.strip()) for k, v in sources.items()}
    else:
        topic = _pick_evergreen_topic(db, writer.id)
        prompt = evergreen_prompt(topic)
        sources_summary = {"evergreen_topic": topic}

    # Generate via Claude
    try:
        post_data = generate_post(prompt)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude generation failed: {e}")

    # Insert draft
    try:
        post = _insert_draft(db, writer, post_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB insert failed: {e}")

    # Send review email (best-effort — draft already saved)
    email_status = "sent"
    edit_url = f"{settings.FRONTEND_URL}/writer?edit={post.id}"
    try:
        send_cribb_draft_review_email(
            to_email=settings.CRIBB_REVIEW_EMAIL,
            title=post.title,
            preview=post.preview or "",
            category=post.category.value,
            pillar=selected_pillar,
            edit_url=edit_url,
        )
    except Exception as e:
        email_status = f"failed: {e}"

    return {
        "post_id": post.id,
        "slug": post.slug,
        "title": post.title,
        "category": post.category.value,
        "pillar": selected_pillar,
        "sources_available": sources_summary,
        "edit_url": edit_url,
        "email_status": email_status,
        "note": "Draft is saved with status=DRAFT, is_ai_draft=TRUE. Delete via DELETE /api/admin/posts/{post_id} after review.",
    }

@admin_router.patch("/listings/{listing_id}/expire", status_code=status.HTTP_200_OK)
def admin_expire_listing(listing_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Force a listing to EXPIRED status and email the landlord so they can clean it up."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if listing.status == ListingStatus.EXPIRED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Listing is already expired")

    listing.status = ListingStatus.EXPIRED
    db.commit()
    db.refresh(listing)

    landlord = None
    if listing.property and listing.property.landlord_id:
        landlord = db.query(Landlord).filter(Landlord.id == listing.property.landlord_id).first()

    listing_title = listing.property.title if listing.property else f"Listing #{listing.id}"

    if landlord and landlord.email:
        background_tasks.add_task(send_listing_expired_email, landlord.email, landlord.first_name, listing_title)

    return {"message": "Listing expired and landlord notified", "listing_id": listing.id, "status": listing.status.value}

# SUBLET ENDPOINTS
@admin_router.get("/sublets", response_model=list[AdminSubletResponse])
def list_all_sublets(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
    status_filter: Optional[SubletStatus] = Query(None, alias="status"),
    user_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List sublets across all users. Admin moderation surface."""
    query = db.query(Sublet)
    if status_filter is not None:
        query = query.filter(Sublet.status == status_filter)
    if user_id is not None:
        query = query.filter(Sublet.user_id == user_id)
    if search:
        like = f"%{search.lower()}%"
        query = query.filter(or_(func.lower(Sublet.title).like(like), func.lower(Sublet.address).like(like)))

    sublets = query.order_by(Sublet.created_at.desc()).offset(offset).limit(limit).all()

    results = []
    for s in sublets:
        data = AdminSubletResponse.model_validate(s)
        if s.user:
            data.owner_name = f"{s.user.first_name} {s.user.last_name}"
            data.owner_email = s.user.email
        results.append(data)
    return results

@admin_router.delete("/sublets/{sublet_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_sublet(sublet_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Remove a sublet entirely. Cascades images (incl. Cloudinary), bookings, slots, availabilities, conversations, flags."""
    sublet = db.query(Sublet).filter(Sublet.id == sublet_id).first()
    if not sublet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sublet not found")

    # Cloudinary cleanup before DB cascade removes the SubletImage rows
    for image in sublet.images:
        delete_image_from_cloudinary(image.image_url)

    # Flag rows are FK SET NULL — clear them explicitly so they don't dangle as pending flags on nothing
    db.query(Flag).filter(Flag.sublet_id == sublet.id).delete(synchronize_session=False)

    # Remaining children (SubletImage, ViewingAvailability, ViewingSlot, ViewingBooking, SubletConversation)
    # cascade via FK ondelete=CASCADE
    db.delete(sublet)
    db.commit()
    return None

@admin_router.patch("/sublets/{sublet_id}/expire", status_code=status.HTTP_200_OK)
def admin_expire_sublet(sublet_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Force a sublet to EXPIRED status and email the owner so they can clean it up."""
    sublet = db.query(Sublet).filter(Sublet.id == sublet_id).first()
    if not sublet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sublet not found")
    if sublet.status == SubletStatus.EXPIRED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sublet is already expired")

    sublet.status = SubletStatus.EXPIRED
    db.commit()
    db.refresh(sublet)

    if sublet.user and sublet.user.email:
        background_tasks.add_task(send_sublet_expired_email, sublet.user.email, sublet.user.first_name, sublet.title)

    return {"message": "Sublet expired and owner notified", "sublet_id": sublet.id, "status": sublet.status.value}

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
    results = []
    for f in flags:
        target_path = None
        if f.listing_id:
            flag_type = "listing"
            target_path = f"/browse/{f.listing_id}"
        elif f.review_id:
            flag_type = "review"
            if f.review:
                listing = db.query(Listing).filter(Listing.property_id == f.review.property_id).first()
                if listing:
                    target_path = f"/browse/{listing.id}"
        elif f.marketplace_item_id:
            flag_type = "marketplace_item"
            target_path = f"/marketplace/{f.marketplace_item_id}"
        elif f.sublet_id:
            flag_type = "sublet"
            target_path = f"/sublets/{f.sublet_id}"
        else:
            flag_type = "unknown"
 
        flagged_title = None
        if f.listing_id and f.listing:
            flagged_title = f.listing.property.title if f.listing.property else f"Listing #{f.listing_id}"
        elif f.review_id and f.review:
            flagged_title = f"Review on property #{f.review.property_id}"
        elif f.marketplace_item_id and f.marketplace_item:
            flagged_title = f.marketplace_item.title
        elif f.sublet_id and f.sublet:
            flagged_title = f.sublet.title

        reporter = db.query(User).filter(User.id == f.reporter_id).first()
        reporter_name = f"{reporter.first_name} {reporter.last_name}" if reporter else f"User #{f.reporter_id}"

        results.append({
            "id": f.id,
            "reporter_id": f.reporter_id,
            "reporter_name": reporter_name,
            "flag_type": flag_type,
            "listing_id": f.listing_id,
            "review_id": f.review_id,
            "marketplace_item_id": f.marketplace_item_id,
            "sublet_id": f.sublet_id,
            "flagged_title": flagged_title,
            "target_path": target_path,
            "reason": f.reason,
            "status": f.status.value if hasattr(f.status, "value") else f.status,
            "created_at": str(f.created_at),
        })
    return results
 
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

# POST ENDPOINTS
@admin_router.get("/posts", response_model=list[PostListResponse])
def list_all_posts(db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    return [PostResponse.model_validate(p) for p in posts]

@admin_router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_post(post_id: int, db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.cover_image_url:
        delete_image_from_cloudinary(post.cover_image_url)

    db.delete(post)
    db.commit()

# ROOMMATE GROUP ENDPOINTS
@admin_router.get("/roommate-groups")
def list_all_roommate_groups(db: Session = Depends(get_db), admin: Admin = Depends(require_admin)):
    groups = db.query(RoommateGroup).order_by(RoommateGroup.created_at.desc()).all()
    results = []
    for group in groups:
        owner = db.query(User).filter(User.id == group.owner_id).first()
        active_members = [m for m in group.members if m.is_active] if hasattr(group, "members") else []
        results.append({
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "owner_id": group.owner_id,
            "owner_name": f"{owner.first_name} {owner.last_name}" if owner else "Unknown",
            "current_size": group.current_size,
            "spots_needed": group.spots_needed,
            "total_capacity": group.total_capacity,
            "has_place": group.has_place,
            "address": group.address,
            "is_verified": group.is_verified,
            "is_active": group.is_active,
            "listing_id": group.listing_id,
            "created_at": group.created_at,
        })
    return results


# Send emails to students who wanna sublet their lisitngs early
@admin_router.post("/send-sublet-onboarding-email", status_code=status.HTTP_200_OK)
def send_sublet_onboarding_email_endpoint(payload: SubletOnboardingEmailRequest, background_tasks: BackgroundTasks, admin: Admin = Depends(require_admin)):
    background_tasks.add_task(
        send_sublet_onboarding_email,
        to_email=payload.email,
        first_name=payload.first_name,
    )
    return {"message": f"Onboarding email queued for {payload.email}"}