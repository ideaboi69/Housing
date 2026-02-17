from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from tables import get_db, User, Listing, Property, SavedListing
from Schemas.savedSchema import SavedListingResponse, SavedListingDetailResponse
from Utils.security import get_current_user

saved_router = APIRouter()

# Save a listing (logged in only)
@saved_router.post("/{listing_id}", response_model=SavedListingResponse, status_code=status.HTTP_201_CREATED)
def save_listing(listing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # verify listing exists
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    # check for duplicate save
    existing = db.query(SavedListing).filter(
        SavedListing.student_id == current_user.id,
        SavedListing.listing_id == listing_id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Listing already saved")

    saved = SavedListing(
        student_id=current_user.id,
        listing_id=listing_id,
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)

    return SavedListingResponse.model_validate(saved)

# Unsave a listing (logged in only)
@saved_router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_listing(listing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    saved = db.query(SavedListing).filter(
        SavedListing.student_id == current_user.id,
        SavedListing.listing_id == listing_id,
    ).first()
    if not saved:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved listing not found")

    db.delete(saved)
    db.commit()

    return None

# View my saved listings (logged in only)
@saved_router.get("/", response_model=list[SavedListingDetailResponse])
def list_saved_listings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(SavedListing, Listing, Property).join(
        Listing, SavedListing.listing_id == Listing.id
    ).join(
        Property, Listing.property_id == Property.id
    ).filter(
        SavedListing.student_id == current_user.id
    ).order_by(SavedListing.created_at.desc()).all()

    return [
        SavedListingDetailResponse(
            id=saved.id,
            listing_id=listing.id,
            saved_at=saved.created_at,
            rent_per_room=listing.rent_per_room,
            rent_total=listing.rent_total,
            lease_type=listing.lease_type.value if hasattr(listing.lease_type, "value") else listing.lease_type,
            move_in_date=str(listing.move_in_date) if listing.move_in_date else None,
            is_sublet=listing.is_sublet,
            status=listing.status.value if hasattr(listing.status, "value") else listing.status,
            title=prop.title,
            address=prop.address,
            property_type=prop.property_type.value if hasattr(prop.property_type, "value") else prop.property_type,
            is_furnished=prop.is_furnished,
            has_parking=prop.has_parking,
            distance_to_campus_km=prop.distance_to_campus_km,
        )
        for saved, listing, prop in results
    ]

# Check if listing is saved (logged in only)
@saved_router.get("/{listing_id}/check")
def check_saved(listing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exists = db.query(SavedListing).filter(
        SavedListing.student_id == current_user.id,
        SavedListing.listing_id == listing_id,
    ).first()

    return {"saved": exists is not None}