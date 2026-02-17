from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from tables import get_db, User, Landlord, Property, Listing, ListingImage, Review, Flag, SavedListing, HousingHealthScore
from Schemas.adminSchema import (AdminUserResponse, AdminLandlordResponse, AdminListingResponse, AdminStatsResponse)
from Schemas.userSchema import UserRole
from Schemas.landlordSchema import LandlordUpdate, LandlordResponse
from Schemas.flagSchema import FlagStatus
from helpers import require_admin, cascade_delete_landlord
from Utils.security import get_current_user

admin_router = APIRouter()

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
@admin_router.get("/users", response_model=list[AdminUserResponse])
def list_all_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    users = db.query(User).all()
    return [AdminUserResponse.model_validate(u) for u in users]


@admin_router.get("/users/{user_id}", response_model=AdminUserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return AdminUserResponse.model_validate(user)

@admin_router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete another admin")

    # if user is a landlord, cascade delete their landlord stuff
    landlord = db.query(Landlord).filter(Landlord.user_id == user.id).first()
    if landlord:
        cascade_delete_landlord(landlord, db)

    # clean up user's reviews, saved listings, flags
    db.query(Review).filter(Review.student_id == user.id).delete()
    db.query(SavedListing).filter(SavedListing.student_id == user.id).delete()
    db.query(Flag).filter(Flag.reporter_id == user.id).delete()

    db.delete(user)
    db.commit()

    return None

# LANDLORD ENDPOINTS
@admin_router.get("/landlords", response_model=list[AdminLandlordResponse])
def list_all_landlords(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    landlords = db.query(Landlord).all()
    return [
        AdminLandlordResponse(
            id=l.id,
            user_id=l.user_id,
            first_name=l.user.first_name,
            last_name=l.user.last_name,
            email=l.user.email,
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
            user_id=landlord.user_id,
            first_name=landlord.user.first_name,
            last_name=landlord.user.last_name,
            email=landlord.user.email,
            company_name=landlord.company_name,
            phone=landlord.phone,
            identity_verified=landlord.identity_verified)

@admin_router.patch("/landlords/{landlord_id}", response_model=LandlordResponse)
def update_landlord_profile(landlord_id: int, payload: LandlordUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()

    if payload.company_name is not None:
        landlord.company_name = payload.company_name
    if payload.phone is not None:
        landlord.phone = payload.phone

    db.commit()
    db.refresh(landlord)

    return AdminLandlordResponse.model_validate(landlord)

@admin_router.delete("/landlords/{landlord_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_landlord(landlord_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Delete a landlord profile and cascade delete all their properties, listings, etc. User account reverts to student."""
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord not found")

    # revert user back to student
    user = db.query(User).filter(User.id == landlord.user_id).first()
    if user:
        user.role = UserRole.STUDENT

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

    # clean up everything tied to this listing
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