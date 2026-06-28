from datetime import date
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy import or_, nulls_last
from sqlalchemy.orm import Session, selectinload
from tables import get_db, User, Landlord, Property, Listing, ListingImage, Review, Flag, SavedListing, HousingHealthScore, Message, Conversation, ListingRoom
from Schemas.listingSchema import *
from Schemas.propertySchema import PropertyType
from Utils.cloudinary import upload_image_to_cloudinary, delete_image_from_cloudinary
from helpers import get_landlord_for_user, require_landlord, build_listing_detail, get_listing_owned_by, build_listing_response
from Utils.cache import cached, invalidate

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

listing_router = APIRouter()

# Create Listing (landlord only)
@listing_router.post("/", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(payload: ListingCreate, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)
    if not landlord.identity_verified:
        raise HTTPException(status_code=403, detail="You must be verified before creating listings")

    prop = db.query(Property).filter(Property.id == payload.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.landlord_id != landlord.id:
        raise HTTPException(status_code=403, detail="You do not own this property")
    if not payload.has_flexible_move_in and payload.move_in_date is None:
        raise HTTPException(status_code=400, detail="move_in_date is required unless has_flexible_move_in is true")

    # Resolve rooms based on pricing mode
    if payload.per_room_pricing:
        if not payload.rooms or len(payload.rooms) == 0:
            raise HTTPException(status_code=400, detail="rooms required when per_room_pricing is true")
        if len(payload.rooms) != prop.total_rooms:
            raise HTTPException(
                status_code=400,
                detail=f"Expected {prop.total_rooms} rooms (matching property), got {len(payload.rooms)}"
            )
        room_specs = payload.rooms
    else:
        if not payload.rent_per_room:
            raise HTTPException(status_code=400, detail="rent_per_room required when per_room_pricing is false")
        # Build N rooms at the flat rate
        room_specs = [
            ListingRoomCreate(label=f"Room {i+1}", rent=payload.rent_per_room, display_order=i)
            for i in range(prop.total_rooms)
        ]

    # Compute derived rent fields
    rents = [r.rent for r in room_specs]
    rent_min = min(rents)
    rent_total = sum(rents)

    listing = Listing(
        property_id=payload.property_id,
        rent_per_room=rent_min,
        rent_total=rent_total,
        per_room_pricing=payload.per_room_pricing,
        lease_type=payload.lease_type,
        move_in_date=None if payload.has_flexible_move_in else payload.move_in_date,
        has_flexible_move_in=payload.has_flexible_move_in,
        is_sublet=payload.is_sublet,
        sublet_start_date=payload.sublet_start_date,
        sublet_end_date=payload.sublet_end_date,
        gender_preference=payload.gender_preference,
        status=ListingStatus.ACTIVE,
    )
    db.add(listing)
    db.flush()

    for spec in room_specs:
        room = ListingRoom(
            listing_id=listing.id,
            label=spec.label,
            rent=spec.rent,
            display_order=spec.display_order,
        )
        db.add(room)

    db.commit()
    db.refresh(listing)

    invalidate("listings:list")
    invalidate("listings:popular")
    return build_listing_response(listing)

@listing_router.post("/{listing_id}/images", status_code=status.HTTP_201_CREATED)
async def upload_listing_images(listing_id: int, files: list[UploadFile] = File(...), db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    
    landlord = get_landlord_for_user(current_user, db)
    listing = get_listing_owned_by(listing_id, landlord.id, db)

    existing_count = db.query(ListingImage).filter(
        ListingImage.listing_id == listing.id,
        ListingImage.is_floor_plan == False,
    ).count()

    if existing_count + len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum 10 images allowed. You have {existing_count}, trying to add {len(files)}.",
        )

    images = []
    for i, file in enumerate(files):
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail=f"'{file.filename}' is not a valid image. Allowed: JPEG, PNG, WebP, GIF")

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

    invalidate("listings:list")
    invalidate("listings:popular")
    return [ListingImageResponse.model_validate(img) for img in images]

# Upload floor-plan diagrams (separate from photos, max 5, rendered in their own section)
@listing_router.post("/{listing_id}/floor-plans", status_code=status.HTTP_201_CREATED, response_model=list[ListingImageResponse])
async def upload_listing_floor_plans(listing_id: int, files: list[UploadFile] = File(...), db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)
    listing = get_listing_owned_by(listing_id, landlord.id, db)

    existing_count = db.query(ListingImage).filter(
        ListingImage.listing_id == listing.id,
        ListingImage.is_floor_plan == True,
    ).count()

    if existing_count + len(files) > 5:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum 5 floor plans allowed. You have {existing_count}, trying to add {len(files)}.",
        )

    images = []
    for i, file in enumerate(files):
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail=f"'{file.filename}' is not a valid image. Allowed: JPEG, PNG, WebP, GIF")

        image_url = upload_image_to_cloudinary(file, folder=f"listings/{listing_id}/floor-plans")
        image = ListingImage(
            listing_id=listing.id,
            image_url=image_url,
            display_order=existing_count + i,
            is_floor_plan=True,
        )
        db.add(image)
        images.append(image)

    db.commit()
    for img in images:
        db.refresh(img)

    invalidate("listings:list")
    invalidate("listings:popular")
    return [ListingImageResponse.model_validate(img) for img in images]

# Reorder listing images
@listing_router.patch("/{listing_id}/images/reorder", response_model=list[ListingImageResponse])
def reorder_listing_images(listing_id: int, payload: ListingImageReorder, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)
    listing = get_listing_owned_by(listing_id, landlord.id, db)
 
    images = db.query(ListingImage).filter(
        ListingImage.listing_id == listing.id,
        ListingImage.is_floor_plan == False,
    ).all()
    existing_ids = {img.id for img in images}
    incoming_ids = set(payload.image_ids)

    if existing_ids != incoming_ids:
        raise HTTPException(
            status_code=400,
            detail="image_ids must contain every image on this listing exactly once",
        )
 
    image_by_id = {img.id: img for img in images}
    for new_order, image_id in enumerate(payload.image_ids):
        image_by_id[image_id].display_order = new_order
 
    db.commit()

    invalidate("listings:list")
    invalidate("listings:popular")
    ordered = sorted(images, key=lambda img: img.display_order)
    return [ListingImageResponse.model_validate(img) for img in ordered]
 
# Browse Listings (public, with filters)
@listing_router.get("/", response_model=list[ListingDetailResponse])
@cached("listings:list", ttl=180)
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
    # bed / bath filters (minimum, "N+" semantics)
    rooms_min: Optional[int] = Query(None, ge=1, description="Minimum number of bedrooms"),
    bathrooms_min: Optional[int] = Query(None, ge=1, description="Minimum number of bathrooms"),
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
    ).options(
        selectinload(Listing.rooms),
        selectinload(Listing.images),
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
        query = query.filter(or_(Listing.has_flexible_move_in == True, Listing.move_in_date <= move_in_before))
    if move_in_after:
        query = query.filter(or_(Listing.has_flexible_move_in == True, Listing.move_in_date >= move_in_after))

    # property filters
    if property_type:
        try:
            PropertyType(property_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid property_type '{property_type}'. Valid values: {[e.value for e in PropertyType]}")
        query = query.filter(Property.property_type == property_type)
    if is_furnished is not None:
        query = query.filter(Property.is_furnished == is_furnished)
    if has_parking is not None:
        query = query.filter(Property.has_parking == has_parking)
    if has_laundry is not None:
        query = query.filter(Property.has_laundry == has_laundry)
    if utilities_included is not None:
        query = query.filter(Property.utilities_included == utilities_included)
    if rooms_min is not None:
        query = query.filter(Property.total_rooms >= rooms_min)
    if bathrooms_min is not None:
        query = query.filter(Property.bathrooms >= bathrooms_min)
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
    return [build_listing_response(l) for l in listings]

@listing_router.get("/drafts/my", response_model=list[ListingResponse])
def get_my_draft_listings(db: Session = Depends(get_db), landlord: Landlord = Depends(require_landlord)):
    listings = db.query(Listing).join(Property).filter(Property.landlord_id == landlord.id, Listing.status == ListingStatus.DRAFT).order_by(Listing.created_at.desc()).all()

    return [ListingResponse.model_validate(l) for l in listings]


@listing_router.patch("/{listing_id}/publish", response_model=ListingResponse)
def publish_listing(listing_id: int, db: Session = Depends(get_db),landlord: Landlord = Depends(require_landlord)):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    prop = db.query(Property).filter(Property.id == listing.property_id).first()
    if prop.landlord_id != landlord.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    if listing.status not in (ListingStatus.DRAFT, ListingStatus.EXPIRED):
        raise HTTPException(status_code=400, detail="Only drafts or expired listings can be published")

    listing.status = ListingStatus.ACTIVE
    db.commit()
    db.refresh(listing)

    invalidate("listings:list")
    invalidate("listings:popular")
    return build_listing_response(listing)

@listing_router.patch("/{listing_id}/unpublish", response_model=ListingResponse)
def unpublish_listing(listing_id: int, db: Session = Depends(get_db), landlord: Landlord = Depends(require_landlord)):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    prop = db.query(Property).filter(Property.id == listing.property_id).first()
    if prop.landlord_id != landlord.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    if listing.status != ListingStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Only active listings can be unpublished")

    listing.status = ListingStatus.DRAFT
    db.commit()
    db.refresh(listing)

    invalidate("listings:list")
    invalidate("listings:popular")
    return build_listing_response(listing)

# Popular listings — top N active listings ranked by Cribb Score in a single round trip.
@listing_router.get("/popular", response_model=list[PopularListingResponse])
@cached("listings:popular", ttl=180)
def list_popular_listings(db: Session = Depends(get_db), limit: int = Query(4, ge=1, le=20, description="Number of listings to return (max 20)")):
    results = (
        db.query(Listing, Property, Landlord, HousingHealthScore.overall_score)
        .join(Property, Listing.property_id == Property.id)
        .join(Landlord, Property.landlord_id == Landlord.id)
        .outerjoin(HousingHealthScore, HousingHealthScore.listing_id == Listing.id)
        .options(selectinload(Listing.rooms), selectinload(Listing.images))
        .filter(Listing.status == ListingStatus.ACTIVE)
        .order_by(nulls_last(HousingHealthScore.overall_score.desc()))
        .limit(limit)
        .all()
    )
    return [
        PopularListingResponse(
            **build_listing_detail(listing, prop, landlord).model_dump(),
            overall_score=float(score) if score is not None else None,
        )
        for listing, prop, landlord, score in results
    ]

# Get Single Listings (public, increments view count)
@listing_router.get("/{listing_id}", response_model=ListingDetailResponse)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    result = db.query(Listing, Property, Landlord).join(
        Property, Listing.property_id == Property.id
    ).join(
        Landlord, Property.landlord_id == Landlord.id
    ).options(
        selectinload(Listing.rooms),
        selectinload(Listing.images),
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
def update_listing(listing_id: int, payload: ListingUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)
    listing = get_listing_owned_by(listing_id, landlord.id, db)

    update_data = payload.model_dump(exclude_unset=True)
    if update_data.get("has_flexible_move_in") is True:
        update_data["move_in_date"] = None
    elif update_data.get("move_in_date") is not None:
        update_data["has_flexible_move_in"] = False
    elif update_data.get("has_flexible_move_in") is False and listing.move_in_date is None:
        raise HTTPException(status_code=400, detail="move_in_date is required when has_flexible_move_in is false")

    for field, value in update_data.items():
        setattr(listing, field, value)

    db.commit()
    db.refresh(listing)

    invalidate("listings:list")
    invalidate("listings:popular")
    return build_listing_response(listing)

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

    invalidate("listings:list")
    invalidate("listings:popular")
    return build_listing_response(listing)

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
    invalidate("listings:list")
    invalidate("listings:popular")

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
    invalidate("listings:list")
    invalidate("listings:popular")

# Dynamic room pricing
@listing_router.patch("/{listing_id}/rooms/{room_id}", response_model=ListingRoomResponse)
def update_listing_room(listing_id: int, room_id: int, payload: ListingRoomUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)
    listing = get_listing_owned_by(listing_id, landlord, db)

    room = db.query(ListingRoom).filter(ListingRoom.id == room_id, ListingRoom.listing_id == listing.id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(room, key, value)

    db.flush()

    # Recompute derived rent fields on the listing
    rents = [r.rent for r in listing.rooms]
    if rents:
        listing.rent_per_room = min(rents)
        listing.rent_total = sum(rents)

    db.commit()
    db.refresh(room)
    invalidate("listings:list")
    invalidate("listings:popular")
    return ListingRoomResponse.model_validate(room)


@listing_router.post("/{listing_id}/rooms", response_model=ListingRoomResponse, status_code=status.HTTP_201_CREATED)
def add_listing_room(listing_id: int, payload: ListingRoomCreate, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)
    listing = get_listing_owned_by(listing_id, landlord, db)

    room = ListingRoom(
        listing_id=listing.id,
        label=payload.label,
        rent=payload.rent,
        display_order=payload.display_order,
    )
    db.add(room)
    db.flush()

    # Recompute derived fields
    all_rooms = [r for r in listing.rooms] + [room]
    rents = [r.rent for r in all_rooms]
    listing.rent_per_room = min(rents)
    listing.rent_total = sum(rents)

    db.commit()
    db.refresh(room)
    invalidate("listings:list")
    invalidate("listings:popular")
    return ListingRoomResponse.model_validate(room)


@listing_router.delete("/{listing_id}/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing_room(listing_id: int, room_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)
    listing = get_listing_owned_by(listing_id, landlord, db)

    room = db.query(ListingRoom).filter(ListingRoom.id == room_id, ListingRoom.listing_id == listing.id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if len(listing.rooms) <= 1:
        raise HTTPException(status_code=400, detail="Listing must have at least one room")

    db.delete(room)
    db.flush()

    remaining_rents = [r.rent for r in listing.rooms if r.id != room_id]
    listing.rent_per_room = min(remaining_rents)
    listing.rent_total = sum(remaining_rents)

    db.commit()
    invalidate("listings:list")
    invalidate("listings:popular")
