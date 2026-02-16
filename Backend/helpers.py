from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session
from tables import get_db, User, Landlord, Property, Listing, ListingImage, Review, Flag, SavedListing, HousingHealthScore
from dotenv import load_dotenv
from sqlalchemy import text
from tables import get_db, User, Landlord, Property, Review
from Schemas.userSchema import UserRole
from utils.security import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# UofG Email checker helper
def check_uoguelph_email(email: str) -> bool:
    return email.lower().endswith("@uoguelph.ca")

# Landlord Helpers
def require_landlord(current_user: User = Depends(get_current_user)):
    """Dependency that ensures the current user is a landlord."""
    if current_user.role != UserRole.LANDLORD:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This action requires landlord role")
    return current_user


def get_landlord_profile(user: User, db: Session) -> Landlord:
    """Fetch the landlord profile for a user, or 404."""
    landlord = db.query(Landlord).filter(Landlord.user_id == user.id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord profile not found")
    return landlord


def compute_landlord_stats(landlord_id: int, db: Session) -> dict:
    """Compute average ratings, would_rent_again %, and counts for a landlord."""
    reviews = db.query(Review).filter(Review.landlord_id == landlord_id).all()
    total_reviews = len(reviews)

    properties_count = db.query(Property).filter(Property.landlord_id == landlord_id).count()

    if total_reviews == 0:
        return {
            "avg_responsiveness": None,
            "avg_maintenance_speed": None,
            "avg_respect_privacy": None,
            "avg_fairness_of_charges": None,
            "would_rent_again_pct": None,
            "total_reviews": 0,
            "total_properties": properties_count,
        }

    avg_responsiveness = sum(r.responsiveness for r in reviews) / total_reviews
    avg_maintenance_speed = sum(r.maintenance_speed for r in reviews) / total_reviews
    avg_respect_privacy = sum(r.respect_privacy for r in reviews) / total_reviews
    avg_fairness_of_charges = sum(r.fairness_of_charges for r in reviews) / total_reviews
    would_rent_again_pct = (sum(1 for r in reviews if r.would_rent_again) / total_reviews) * 100

    return {
        "avg_responsiveness": round(avg_responsiveness, 2),
        "avg_maintenance_speed": round(avg_maintenance_speed, 2),
        "avg_respect_privacy": round(avg_respect_privacy, 2),
        "avg_fairness_of_charges": round(avg_fairness_of_charges, 2),
        "would_rent_again_pct": round(would_rent_again_pct, 1),
        "total_reviews": total_reviews,
        "total_properties": properties_count,
    }

# Admin Helpers
def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency that ensures the current user is an admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

def cascade_delete_landlord(landlord: Landlord, db: Session):
    """Delete a landlord and everything they own: properties → listings → images, health scores, saved, flags."""
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
