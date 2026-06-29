from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from tables import get_db, User, Landlord, Property, Listing, ListingImage, Review, Flag, SavedListing, HousingHealthScore, Message, Conversation
from Schemas.propertySchema import PropertyCreate, PropertyUpdate, PropertyResponse, PropertyImageResponse, PropertyImageReorder
from Schemas.listingSchema import ListingStatus, BuildingResponse
from Utils.cloudinary import delete_image_from_cloudinary, upload_image_to_cloudinary
from helpers import build_property_response, build_building_response, require_landlord, get_landlord_for_user, get_property_owned_by, get_primary_listing_for_property

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_PROPERTY_IMAGES = 10

property_router = APIRouter()

# Create Property (landlord only)
@property_router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(payload: PropertyCreate, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)

    prop = Property(
        landlord_id=landlord.id,
        title=payload.title,
        address=payload.address,
        description=payload.description,
        postal_code=payload.postal_code,
        latitude=payload.latitude,
        longitude=payload.longitude,
        property_type=payload.property_type,
        total_rooms=payload.total_rooms,
        bathrooms=payload.bathrooms,
        bed_min=payload.bed_min,
        bed_max=payload.bed_max,
        bath_min=payload.bath_min,
        bath_max=payload.bath_max,
        is_furnished=payload.is_furnished,
        has_parking=payload.has_parking,
        has_laundry=payload.has_laundry,
        utilities_included=payload.utilities_included,
        has_wifi=payload.has_wifi,
        has_air_conditioning=payload.has_air_conditioning,
        has_dishwasher=payload.has_dishwasher,
        has_gym=payload.has_gym,
        has_elevator=payload.has_elevator,
        has_backyard=payload.has_backyard,
        has_balcony=payload.has_balcony,
        wheelchair_accessible=payload.wheelchair_accessible,
        pet_policy=payload.pet_policy.value if hasattr(payload.pet_policy, "value") else payload.pet_policy,
        smoking_policy=payload.smoking_policy.value if hasattr(payload.smoking_policy, "value") else payload.smoking_policy,
        estimated_utility_cost=payload.estimated_utility_cost,
        distance_to_campus_km=payload.distance_to_campus_km,
        walk_time_minutes=payload.walk_time_minutes,
        drive_time_minutes=payload.drive_time_minutes,
        bus_time_minutes=payload.bus_time_minutes,
        nearest_bus_route=payload.nearest_bus_route,
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)

    return build_property_response(prop)

# Browse Properties (public)
@property_router.get("/", response_model=list[PropertyResponse])
def list_properties(db: Session = Depends(get_db)):
    properties = db.query(Property).all()
    return [build_property_response(p) for p in properties]

# My Properties (landlord views their own)
@property_router.get("/me/all", response_model=list[PropertyResponse])
def list_my_properties(db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)
    properties = db.query(Property).filter(Property.landlord_id == landlord.id).all()
    return [build_property_response(p) for p in properties]

# Browse Specific Properties (public)
@property_router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    return build_property_response(prop)

# Building view (public) — an apartment building plus its unit-type listings.
# Powers the Residen-style building detail page.
@property_router.get("/{property_id}/building", response_model=BuildingResponse)
def get_building(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    landlord = db.query(Landlord).filter(Landlord.id == prop.landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord not found")

    listings = db.query(Listing).filter(
        Listing.property_id == prop.id,
        Listing.status == ListingStatus.ACTIVE,
    ).all()

    scores: dict[int, float] = {}
    for listing in listings:
        hs = db.query(HousingHealthScore).filter(HousingHealthScore.listing_id == listing.id).first()
        if hs and hs.overall_score is not None:
            scores[listing.id] = hs.overall_score

    return build_building_response(prop, listings, landlord, scores)

# Update Properties (landlord only, must own it)
@property_router.patch("/{property_id}", response_model=PropertyResponse)
def update_property(property_id: int, payload: PropertyUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)
    prop = get_property_owned_by(property_id, landlord.id, db)

    update_data = payload.model_dump(exclude_unset=True)

    # Block total_rooms changes if active or rented listings exist
    if "total_rooms" in update_data and update_data["total_rooms"] != prop.total_rooms:
        active_listings = db.query(Listing).filter(
            Listing.property_id == prop.id,
            Listing.status.in_([ListingStatus.ACTIVE, ListingStatus.RENTED])
        ).count()
        if active_listings > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot change room count while you have active or rented listings. Edit individual listings to add/remove rooms instead."
            )

    for field, value in update_data.items():
        if hasattr(value, "value"):
            value = value.value
        setattr(prop, field, value)

    db.commit()
    db.refresh(prop)

    return build_property_response(prop)

# Delete Properties (landlord only, must own it). Cascades: listings → images, scores, saves, flags + reviews
@property_router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(property_id: int, db: Session = Depends(get_db), current_user: Landlord = Depends(require_landlord)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.landlord_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your property")

    listings = db.query(Listing).filter(Listing.property_id == prop.id).all()
    for listing in listings:
        # Clean up Cloudinary images
        for image in listing.images:
            delete_image_from_cloudinary(image.image_url)

        # Conversations and messages FIRST
        conversation_ids = [c.id for c in db.query(Conversation.id).filter(Conversation.listing_id == listing.id).all()]
        if conversation_ids:
            db.query(Message).filter(Message.conversation_id.in_(conversation_ids)).delete(synchronize_session=False)
            db.query(Conversation).filter(Conversation.listing_id == listing.id).delete(synchronize_session=False)

        db.query(ListingImage).filter(ListingImage.listing_id == listing.id).delete(synchronize_session=False)
        db.query(HousingHealthScore).filter(HousingHealthScore.listing_id == listing.id).delete(synchronize_session=False)
        db.query(SavedListing).filter(SavedListing.listing_id == listing.id).delete(synchronize_session=False)
        db.query(Flag).filter(Flag.listing_id == listing.id).delete(synchronize_session=False)
        db.delete(listing)

    db.query(Review).filter(Review.property_id == prop.id).delete(synchronize_session=False)
    db.delete(prop)
    db.commit()


# ── Property photos ──
# Property-level photos reuse the existing per-listing image storage by
# operating on the property's *primary* listing (lowest id, photos only —
# excludes floor-plan diagrams). This matches the data that already powers
# the browse card cover image. Cover = display_order 0.

def _primary_listing_images(prop: Property, db: Session) -> tuple[Listing, list[ListingImage]]:
    listing = get_primary_listing_for_property(prop.id, db)
    if not listing:
        raise HTTPException(status_code=400, detail="Create a listing for this property before adding photos.")
    images = db.query(ListingImage).filter(
        ListingImage.listing_id == listing.id,
        ListingImage.is_floor_plan == False,
    ).order_by(ListingImage.display_order).all()
    return listing, images


@property_router.post("/{property_id}/images", response_model=list[PropertyImageResponse], status_code=status.HTTP_201_CREATED)
async def upload_property_images(property_id: int, files: list[UploadFile] = File(...), db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)
    prop = get_property_owned_by(property_id, landlord.id, db)
    listing, existing = _primary_listing_images(prop, db)

    if len(existing) + len(files) > MAX_PROPERTY_IMAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_PROPERTY_IMAGES} photos. You have {len(existing)}, trying to add {len(files)}.",
        )

    created: list[ListingImage] = []
    for i, file in enumerate(files):
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail=f"'{file.filename}' is not a valid image. Allowed: JPEG, PNG, WebP, GIF")

        image_url = upload_image_to_cloudinary(file, folder=f"listings/{listing.id}")
        img = ListingImage(
            listing_id=listing.id,
            image_url=image_url,
            display_order=len(existing) + i,
            is_floor_plan=False,
        )
        db.add(img)
        created.append(img)

    db.commit()
    for img in created:
        db.refresh(img)
    return [PropertyImageResponse.model_validate(img) for img in created]


@property_router.delete("/{property_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property_image(property_id: int, image_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)
    prop = get_property_owned_by(property_id, landlord.id, db)
    listing, _ = _primary_listing_images(prop, db)

    img = db.query(ListingImage).filter(
        ListingImage.id == image_id,
        ListingImage.listing_id == listing.id,
        ListingImage.is_floor_plan == False,
    ).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    delete_image_from_cloudinary(img.image_url)
    db.delete(img)
    db.commit()


@property_router.patch("/{property_id}/images/reorder", response_model=list[PropertyImageResponse])
def reorder_property_images(property_id: int, payload: PropertyImageReorder, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)
    prop = get_property_owned_by(property_id, landlord.id, db)
    _, images = _primary_listing_images(prop, db)

    by_id = {img.id: img for img in images}
    if set(payload.image_ids) != set(by_id.keys()):
        raise HTTPException(status_code=400, detail="image_ids must contain every image for this property")

    for order, img_id in enumerate(payload.image_ids):
        by_id[img_id].display_order = order

    db.commit()
    return [PropertyImageResponse.model_validate(img) for img in sorted(by_id.values(), key=lambda i: i.display_order)]
