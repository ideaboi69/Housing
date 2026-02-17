from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session
from tables import get_db, User, Landlord, Property, Listing, ListingImage, Review, Flag, SavedListing, HousingHealthScore
from dotenv import load_dotenv
from sqlalchemy import text, func as sql_func
from tables import get_db, User, Landlord, Property, Review
from Schemas.userSchema import UserRole
from Utils.security import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from Schemas.listingSchema import ListingDetailResponse
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

# Property Helpers
def require_landlord(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.LANDLORD:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This action requires landlord role")
    return current_user

def get_landlord_for_user(user: User, db: Session) -> Landlord:
    landlord = db.query(Landlord).filter(Landlord.user_id == user.id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord profile not found")
    return landlord

def get_property_owned_by(property_id: int, landlord_id: int, db: Session) -> Property:
    """Fetch a property and verify the landlord owns it."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if prop.landlord_id != landlord_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this property")
    return prop

# Listing Helpers
def require_landlord(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.LANDLORD:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This action requires landlord role")
    return current_user

def get_landlord_for_user(user: User, db: Session) -> Landlord:
    landlord = db.query(Landlord).filter(Landlord.user_id == user.id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord profile not found")
    return landlord

def get_listing_owned_by(listing_id: int, landlord_id: int, db: Session) -> Listing:
    """Fetch a listing and verify the landlord owns the parent property."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    prop = db.query(Property).filter(Property.id == listing.property_id).first()
    if not prop or prop.landlord_id != landlord_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing")

    return listing

def build_listing_detail(listing: Listing, prop: Property, landlord: Landlord) -> ListingDetailResponse:
    """Build a full listing detail response with property and landlord info."""
    return ListingDetailResponse(
        id=listing.id,
        rent_per_room=listing.rent_per_room,
        rent_total=listing.rent_total,
        lease_type=listing.lease_type if isinstance(listing.lease_type, str) else listing.lease_type.value,
        move_in_date=listing.move_in_date,
        is_sublet=listing.is_sublet,
        sublet_start_date=listing.sublet_start_date,
        sublet_end_date=listing.sublet_end_date,
        gender_preference=listing.gender_preference if isinstance(listing.gender_preference, str) else (listing.gender_preference.value if listing.gender_preference else None),
        status=listing.status if isinstance(listing.status, str) else listing.status.value,
        view_count=listing.view_count,
        created_at=listing.created_at,
        property_id=prop.id,
        title=prop.title,
        address=prop.address,
        property_type=prop.property_type if isinstance(prop.property_type, str) else prop.property_type.value,
        total_rooms=prop.total_rooms,
        bathrooms=prop.bathrooms,
        is_furnished=prop.is_furnished,
        has_parking=prop.has_parking,
        has_laundry=prop.has_laundry,
        utilities_included=prop.utilities_included,
        estimated_utility_cost=prop.estimated_utility_cost,
        distance_to_campus_km=prop.distance_to_campus_km,
        walk_time_minutes=prop.walk_time_minutes,
        bus_time_minutes=prop.bus_time_minutes,
        landlord_id=landlord.id,
        landlord_name=f"{landlord.user.first_name} {landlord.user.last_name}",
        landlord_verified=landlord.identity_verified,
    )

# Review Helpers
def require_verified_student(current_user: User = Depends(get_current_user)):
    """Must be logged in and email verified to write reviews."""
    if not current_user.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email must be verified to write reviews")
    return current_user

# Helathscore helpers
def compute_price_vs_market(listing: Listing, db: Session) -> float:
    """Compare listing's rent_per_room to market average for same property type.
    Score 0-100. Cheaper = higher score."""
    prop = db.query(Property).filter(Property.id == listing.property_id).first()
    if not prop:
        return 50.0

    # get average rent for active listings on same property type
    avg_rent = db.query(sql_func.avg(Listing.rent_per_room)).join(
        Property, Listing.property_id == Property.id
    ).filter(
        Property.property_type == prop.property_type,
        Listing.status == "active",
    ).scalar()

    if not avg_rent or float(avg_rent) == 0:
        return 50.0  # no data to compare

    ratio = float(listing.rent_per_room) / float(avg_rent)

    # ratio < 1 means cheaper than average → higher score
    # ratio = 0.7 → score ~85, ratio = 1.0 → score 50, ratio = 1.3 → score ~15
    score = max(0, min(100, 100 - (ratio - 0.5) * 100))
    return round(score, 1)

def compute_landlord_reputation(landlord_id: int, db: Session) -> float:
    """Average of all 4 review categories for the landlord, scaled to 0-100."""
    reviews = db.query(Review).filter(Review.landlord_id == landlord_id).all()
    if not reviews:
        return 50.0  # neutral when no reviews

    total = len(reviews)
    avg = (
        sum(r.responsiveness + r.maintenance_speed + r.respect_privacy + r.fairness_of_charges for r in reviews)
        / (total * 4)
    )
    # avg is 1-5, scale to 0-100
    score = ((avg - 1) / 4) * 100
    return round(score, 1)

def compute_maintenance_score(landlord_id: int, db: Session) -> float:
    """Average maintenance_speed rating for the landlord, scaled to 0-100."""
    reviews = db.query(Review).filter(Review.landlord_id == landlord_id).all()
    if not reviews:
        return 50.0

    avg = sum(r.maintenance_speed for r in reviews) / len(reviews)
    score = ((avg - 1) / 4) * 100
    return round(score, 1)

def compute_lease_clarity(listing: Listing, prop: Property) -> float:
    """Score based on listing completeness. More info = higher score."""
    score = 0
    total_checks = 8

    # listing fields
    if listing.move_in_date:
        score += 1
    if listing.lease_type:
        score += 1
    if listing.rent_per_room and listing.rent_total:
        score += 1
    if listing.is_sublet and listing.sublet_start_date and listing.sublet_end_date:
        score += 1
    elif not listing.is_sublet:
        score += 1  # non-sublet doesn't need sublet dates

    # property fields
    if prop.address:
        score += 1
    if prop.distance_to_campus_km is not None:
        score += 1
    if prop.walk_time_minutes is not None or prop.bus_time_minutes is not None:
        score += 1
    if prop.estimated_utility_cost is not None or prop.utilities_included:
        score += 1

    return round((score / total_checks) * 100, 1)

def compute_overall_score(price: float, reputation: float, maintenance: float, clarity: float) -> float:
    """Weighted average of all four sub-scores."""
    weights = {
        "price": 0.30,
        "reputation": 0.30,
        "maintenance": 0.20,
        "clarity": 0.20,
    }
    overall = (
        price * weights["price"]
        + reputation * weights["reputation"]
        + maintenance * weights["maintenance"]
        + clarity * weights["clarity"]
    )
    return round(overall, 1)