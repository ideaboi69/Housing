from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from tables import get_db, User, Landlord, Property, Listing, ListingImage, Review, Flag, SavedListing, HousingHealthScore
from Schemas.landlordSchema import (LandlordUpdate, LandlordResponse, LandlordPublicResponse, LandlordPropertyResponse, LandlordReviewResponse)
from Schemas.userSchema import UserRole
from Utils.security import get_current_user
from helpers import require_landlord, get_landlord_profile, compute_landlord_stats

landlord_router = APIRouter()

# Private Landlord Profile
@landlord_router.get("/me", response_model=LandlordResponse)
def view_my_landlord_profile(db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_profile(current_user, db)
    return LandlordResponse.model_validate(landlord)

@landlord_router.patch("/me", response_model=LandlordResponse)
def update_my_landlord_profile(payload: LandlordUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_profile(current_user, db)

    if payload.company_name is not None:
        landlord.company_name = payload.company_name
    if payload.phone is not None:
        landlord.phone = payload.phone

    db.commit()
    db.refresh(landlord)

    return LandlordResponse.model_validate(landlord)

@landlord_router.post("/me/verify", status_code=status.HTTP_200_OK)
def request_verification(db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_profile(current_user, db)

    if landlord.identity_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already verified")

    # placeholder — in production this would trigger a document upload / review flow
    return {"message": "Verification request submitted. You will be reviewed shortly."}

@landlord_router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_landlord_profile(db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    """Delete landlord profile and cascade delete all properties, listings, etc. User account reverts to student."""
    landlord = get_landlord_profile(current_user, db)

    # cascade delete: properties → listings → images, scores, saves, flags
    properties = db.query(Property).filter(Property.landlord_id == landlord.id).all()

    for prop in properties:
        listings = db.query(Listing).filter(Listing.property_id == prop.id).all()

        for listing in listings:
            db.query(ListingImage).filter(ListingImage.listing_id == listing.id).delete()
            db.query(HousingHealthScore).filter(HousingHealthScore.listing_id == listing.id).delete()
            db.query(SavedListing).filter(SavedListing.listing_id == listing.id).delete()
            db.query(Flag).filter(Flag.listing_id == listing.id).delete()
            db.delete(listing)

        db.query(Review).filter(Review.property_id == prop.id).delete()
        db.delete(prop)

    db.query(Review).filter(Review.landlord_id == landlord.id).delete()
    db.delete(landlord)

    # revert user back to student
    current_user.role = UserRole.STUDENT
    db.commit()

    return {"message": "Landlord Account Deleted Successfully."}

# Public Landlord Profiles
@landlord_router.get("/{landlord_id}", response_model=LandlordPublicResponse)
def get_landlord_public_profile(landlord_id: int, db: Session = Depends(get_db)):
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord not found")

    stats = compute_landlord_stats(landlord.id, db)

    return LandlordPublicResponse(
        id=landlord.id,
        first_name=landlord.user.first_name,
        last_name=landlord.user.last_name,
        company_name=landlord.company_name,
        identity_verified=landlord.identity_verified,
        **stats,
    )

@landlord_router.get("/{landlord_id}/properties", response_model=list[LandlordPropertyResponse])
def get_landlord_properties(landlord_id: int, db: Session = Depends(get_db)):
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord not found")

    properties = db.query(Property).filter(Property.landlord_id == landlord_id).all()
    return [LandlordPropertyResponse.model_validate(p) for p in properties]

@landlord_router.get("/{landlord_id}/reviews", response_model=list[LandlordReviewResponse])
def get_landlord_reviews(landlord_id: int, db: Session = Depends(get_db)):
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord not found")

    reviews = db.query(Review).filter(Review.landlord_id == landlord_id).all()
    return [LandlordReviewResponse.model_validate(r) for r in reviews]

