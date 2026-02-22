from datetime import date
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session
from tables import get_db, User, Landlord, Property, Listing, ListingImage, Review, Flag, SavedListing, HousingHealthScore, Message, Conversation
from Schemas.listingSchema import ListingCreate, ListingUpdate, ListingResponse, ListingDetailResponse, SubletConvert, ListingStatus, ListingImageResponse
from Schemas.userSchema import UserRole
from Utils.security import get_current_user
from Utils.cloudinary import upload_image_to_cloudinary, delete_image_from_cloudinary
from helpers import get_landlord_for_user, require_landlord, build_listing_detail, get_listing_owned_by

listing_router = APIRouter()

# Create Listing (landlord only)
@listing_router.post("/", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(payload: ListingCreate, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)

    # verify the landlord owns the property
    prop = db.query(Property).filter(Property.id == payload.property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if prop.landlord_id != landlord.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this property")

    listing = Listing(
        property_id=payload.property_id,
        rent_per_room=payload.rent_per_room,
        rent_total=payload.rent_total,
        lease_type=payload.lease_type,
        move_in_date=payload.move_in_date,
        is_sublet=payload.is_sublet,
        sublet_start_date=payload.sublet_start_date,
        sublet_end_date=payload.sublet_end_date,
        gender_preference=payload.gender_preference,
        status=ListingStatus.ACTIVE,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    return ListingResponse.model_validate(listing)

@listing_router.post("/{listing_id}/images", status_code=status.HTTP_201_CREATED)
async def upload_listing_images(listing_id: int, files: list[UploadFile] = File(...), db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    
    landlord = get_landlord_for_user(current_user, db)
    listing = get_listing_owned_by(listing_id, landlord.id, db)

    existing_count = db.query(ListingImage).filter(ListingImage.listing_id == listing.id).count()

    if existing_count + len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum 10 images allowed. You have {existing_count}, trying to add {len(files)}.",
        )

    images = []
    for i, file in enumerate(files):
        image_url = upload_image_to_cloudinary(
            file,
            folder=f"listings/{listing_id}",
        )

        image = ListingImage(
            listing_id=listing.id,
            image_url=image_url,
            display_order=existing_count + i,
        )
        db.add(image)
        images.append(image)

    db.commit()
    for img in images:
        db.refresh(img)

    return [ListingImageResponse.model_validate(img) for img in images]

# Browse Listings (public, with filters)
@listing_router.get("/", response_model=list[ListingDetailResponse])
def list_listings(
    db: Session = Depends(get_db),
    # price filters
    price_min: Optional[Decimal] = Query(None, description="Minimum rent per room"),
    price_max: Optional[Decimal] = Query(None, description="Maximum rent per room"),
    # property filters
    property_type: Optional[str] = Query(None, description="house, apartment, townhouse, room"),
    is_furnished: Optional[bool] = Query(None),
    has_parking: Optional[bool] = Query(None),
    has_laundry: Optional[bool] = Query(None),
    utilities_included: Optional[bool] = Query(None),
    # distance filter
    distance_max: Optional[Decimal] = Query(None, description="Max km from campus"),
    # lease filters
    lease_type: Optional[str] = Query(None, description="8_month, 12_month, flexible"),
    is_sublet: Optional[bool] = Query(None),
    gender_preference: Optional[str] = Query(None, description="any, male, female, other"),
    # date filters
    move_in_before: Optional[date] = Query(None),
    move_in_after: Optional[date] = Query(None),
    # status
    status: Optional[ListingStatus] = Query("active", description="active, rented, expired"),
    # sorting
    sort_by: Optional[str] = Query("created_at", description="rent_per_room, distance_to_campus_km, created_at"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
    # pagination
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(Listing, Property, Landlord).join(
        Property, Listing.property_id == Property.id
    ).join(
        Landlord, Property.landlord_id == Landlord.id
    )

    # listing filters
    if status:
        query = query.filter(Listing.status == status)
    if price_min is not None:
        query = query.filter(Listing.rent_per_room >= price_min)
    if price_max is not None:
        query = query.filter(Listing.rent_per_room <= price_max)
    if lease_type:
        query = query.filter(Listing.lease_type == lease_type)
    if is_sublet is not None:
        query = query.filter(Listing.is_sublet == is_sublet)
    if gender_preference:
        query = query.filter(Listing.gender_preference == gender_preference)
    if move_in_before:
        query = query.filter(Listing.move_in_date <= move_in_before)
    if move_in_after:
        query = query.filter(Listing.move_in_date >= move_in_after)

    # property filters
    if property_type:
        query = query.filter(Property.property_type == property_type)
    if is_furnished is not None:
        query = query.filter(Property.is_furnished == is_furnished)
    if has_parking is not None:
        query = query.filter(Property.has_parking == has_parking)
    if has_laundry is not None:
        query = query.filter(Property.has_laundry == has_laundry)
    if utilities_included is not None:
        query = query.filter(Property.utilities_included == utilities_included)
    if distance_max is not None:
        query = query.filter(Property.distance_to_campus_km <= distance_max)

    # sorting
    sort_column = {
        "rent_per_room": Listing.rent_per_room,
        "distance_to_campus_km": Property.distance_to_campus_km,
        "created_at": Listing.created_at,
    }.get(sort_by, Listing.created_at)

    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # pagination
    results = query.offset(skip).limit(limit).all()

    return [build_listing_detail(listing, prop, landlord) for listing, prop, landlord in results]

# My Listings (landlord views their own)
@listing_router.get("/me/all", response_model=list[ListingResponse])
def list_my_listings(db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)

    listings = db.query(Listing).join(Property).filter(Property.landlord_id == landlord.id).all()
    return [ListingResponse.model_validate(l) for l in listings]

# Get Single Listings (public, increments view count)
@listing_router.get("/{listing_id}", response_model=ListingDetailResponse)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    result = db.query(Listing, Property, Landlord).join(
        Property, Listing.property_id == Property.id
    ).join(
        Landlord, Property.landlord_id == Landlord.id
    ).filter(Listing.id == listing_id).first()

    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    listing, prop, landlord = result

    # increment view count
    listing.view_count += 1
    db.commit()
    db.refresh(listing)

    return build_listing_detail(listing, prop, landlord)

# Update Listings (landlord only, must own it)
@listing_router.patch("/{listing_id}", response_model=ListingResponse)
def update_listing(
    listing_id: int,
    payload: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_landlord),
):
    landlord = get_landlord_for_user(current_user, db)
    listing = get_listing_owned_by(listing_id, landlord.id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(listing, field, value)

    db.commit()
    db.refresh(listing)

    return ListingResponse.model_validate(listing)

# Convert to sublet (landlord only)
@listing_router.patch("/{listing_id}/sublet", response_model=ListingResponse)
def convert_to_sublet(
    listing_id: int,
    payload: SubletConvert,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_landlord),
):
    landlord = get_landlord_for_user(current_user, db)
    listing = get_listing_owned_by(listing_id, landlord.id, db)

    listing.is_sublet = True
    listing.sublet_start_date = payload.sublet_start_date
    listing.sublet_end_date = payload.sublet_end_date
    if payload.gender_preference:
        listing.gender_preference = payload.gender_preference

    db.commit()
    db.refresh(listing)

    return ListingResponse.model_validate(listing)

# Delete Listing (landlord only, must own it)
@listing_router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(listing_id: int, db: Session = Depends(get_db), landlord: Landlord = Depends(require_landlord)):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    prop = db.query(Property).filter(Property.id == listing.property_id).first()
    if prop.landlord_id != landlord.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    # Clean up images from Cloudinary
    for image in listing.images:
        delete_image_from_cloudinary(image.image_url)

    # Clean up conversations and messages FIRST
    conversation_ids = [c.id for c in db.query(Conversation.id).filter(Conversation.listing_id == listing.id).all()]
    if conversation_ids:
        db.query(Message).filter(Message.conversation_id.in_(conversation_ids)).delete(synchronize_session=False)
        db.query(Conversation).filter(Conversation.listing_id == listing.id).delete(synchronize_session=False)

    # Clean up everything else
    db.query(ListingImage).filter(ListingImage.listing_id == listing.id).delete(synchronize_session=False)
    db.query(HousingHealthScore).filter(HousingHealthScore.listing_id == listing.id).delete(synchronize_session=False)
    db.query(SavedListing).filter(SavedListing.listing_id == listing.id).delete(synchronize_session=False)
    db.query(Flag).filter(Flag.listing_id == listing.id).delete(synchronize_session=False)

    db.delete(listing)
    db.commit()

# delete a specific image in a listing
@listing_router.delete("/{listing_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_a_listing_image(listing_id: int, image_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    
    landlord = get_landlord_for_user(current_user, db)
    listing = get_listing_owned_by(listing_id, landlord.id, db)

    image = db.query(ListingImage).filter(ListingImage.id == image_id, ListingImage.listing_id == listing.id).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    delete_image_from_cloudinary(image.image_url)
    db.delete(image)
    db.commit()