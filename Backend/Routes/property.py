from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from tables import get_db, User, Landlord, Property, Listing, ListingImage, Review, Flag, SavedListing, HousingHealthScore, Message, Conversation
from Schemas.propertySchema import PropertyCreate, PropertyUpdate, PropertyResponse
from Utils.cloudinary import delete_image_from_cloudinary
from helpers import build_property_response, require_landlord, get_landlord_for_user, get_property_owned_by

property_router = APIRouter()

# Create Property (landlord only)
@property_router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(payload: PropertyCreate, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)

    prop = Property(
        landlord_id=landlord.id,
        title=payload.title,
        address=payload.address,
        postal_code=payload.postal_code,
        latitude=payload.latitude,
        longitude=payload.longitude,
        property_type=payload.property_type,
        total_rooms=payload.total_rooms,
        bathrooms=payload.bathrooms,
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

# Update Properties (landlord only, must own it)
@property_router.patch("/{property_id}", response_model=PropertyResponse)
def update_property(property_id: int, payload: PropertyUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_for_user(current_user, db)
    prop = get_property_owned_by(property_id, landlord.id, db)

    update_data = payload.model_dump(exclude_unset=True)
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
