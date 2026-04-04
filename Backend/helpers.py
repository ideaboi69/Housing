from fastapi import HTTPException, Depends, status, APIRouter, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from tables import get_db, User, Landlord, Property, Listing, ListingImage, Review, Flag, SavedListing, HousingHealthScore, ViewingAvailability, ViewingBooking
from dotenv import load_dotenv
from sqlalchemy import text, func as sql_func
from tables import get_db, User, Landlord, Property, Review, LandlordDocuments, Admin, Writer, Conversation, Message, RoommateProfile, RoommateGroup, Post, Sublet
from tables import MarketplaceItem, MarketplaceImage, MarketplaceConversation, MarketplaceMessage
from tables import SubletImage, ViewingSlot, ViewingBooking, ViewingAvailability
from tables import RoommateGroupMember, RoommateInvite, RoommateRequest
from tables import UserHousingPreferences, NotificationPreferences
from Schemas.userSchema import UserRole
from Schemas.landlordSchema import LandlordVerification
from Utils.security import get_current_user, decode_access_token
from fastapi import APIRouter, Depends, HTTPException, status
from Schemas.featureSchema import AmenityValue, ListingPolicies, ListingTerms, PetPolicy, SmokingPolicy, SpaceAmenities, SubletTerms
from Schemas.listingSchema import ListingDetailResponse, ListingImageResponse
from Schemas.propertySchema import PropertyResponse
from Schemas.subletSchema import SubletListResponse, SubletResponse, SubletImageResponse
from Utils.cloudinary import delete_image_from_cloudinary
from Schemas.roommateSchema import *
from Schemas.viewingSchema import BookingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import timedelta
import uuid 
import boto3
import os
import resend
import re
import uuid

load_dotenv()
landlord_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/landlords/login", scheme_name="LandlordAuth")
admin_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/admin/login", scheme_name="AdminAuth")

# UofG Email checker helper
def check_uoguelph_email(email: str) -> bool:
    return email.lower().endswith("@uoguelph.ca")

# Landlord Helpers
def require_landlord(token: str = Depends(landlord_oauth2), db: Session = Depends(get_db)):
    payload = decode_access_token(token)

    if payload.get("role") != UserRole.LANDLORD.value:
        raise HTTPException(status_code=403, detail="Landlord access required")

    landlord = db.query(Landlord).get(payload["user_id"])
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")

    if not landlord.identity_verified:
        raise HTTPException(
            status_code=403,
            detail="Account pending verification. You cannot perform this action yet.",
        )

    return landlord

def get_landlord_profile(current_user: Landlord, db: Session) -> Landlord:
    landlord = db.query(Landlord).filter(Landlord.id == current_user.id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")
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
def require_admin(token: str = Depends(admin_oauth2), db: Session = Depends(get_db)):
    """Dependency that ensures the current user is an admin."""
    payload = decode_access_token(token)

    if payload.get("role") != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    admin = db.query(Admin).get(payload["user_id"])
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")

    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is deactivated")

    return admin

def cascade_delete_landlord(landlord: Landlord, db: Session):
    """Delete a landlord and everything they own."""
    properties = db.query(Property).filter(Property.landlord_id == landlord.id).all()

    for prop in properties:
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

    db.query(Review).filter(Review.landlord_id == landlord.id).delete(synchronize_session=False)
    db.delete(landlord)

def cascade_delete_user(user: User, db: Session):
    """Delete a student user and all their related data in the correct order."""
    user_id = user.id

    # 1. Marketplace: messages → conversations → images → items
    mp_item_ids = [i.id for i in db.query(MarketplaceItem.id).filter(MarketplaceItem.seller_id == user_id).all()]
    if mp_item_ids:
        mp_convo_ids = [c.id for c in db.query(MarketplaceConversation.id).filter(MarketplaceConversation.item_id.in_(mp_item_ids)).all()]
        if mp_convo_ids:
            db.query(MarketplaceMessage).filter(MarketplaceMessage.conversation_id.in_(mp_convo_ids)).delete(synchronize_session=False)
        db.query(MarketplaceConversation).filter(MarketplaceConversation.item_id.in_(mp_item_ids)).delete(synchronize_session=False)
        db.query(MarketplaceImage).filter(MarketplaceImage.item_id.in_(mp_item_ids)).delete(synchronize_session=False)
        db.query(MarketplaceItem).filter(MarketplaceItem.seller_id == user_id).delete(synchronize_session=False)

    # Also clean up marketplace conversations where user is buyer
    buyer_convo_ids = [c.id for c in db.query(MarketplaceConversation.id).filter(MarketplaceConversation.buyer_id == user_id).all()]
    if buyer_convo_ids:
        db.query(MarketplaceMessage).filter(MarketplaceMessage.conversation_id.in_(buyer_convo_ids)).delete(synchronize_session=False)
        db.query(MarketplaceConversation).filter(MarketplaceConversation.buyer_id == user_id).delete(synchronize_session=False)

    # 2. Sublets: viewing bookings → viewing slots → viewing availabilities → images → sublets
    sublet_ids = [s.id for s in db.query(Sublet.id).filter(Sublet.user_id == user_id).all()]
    if sublet_ids:
        db.query(ViewingBooking).filter(ViewingBooking.sublet_id.in_(sublet_ids)).delete(synchronize_session=False)
        slot_ids = [s.id for s in db.query(ViewingSlot.id).filter(ViewingSlot.sublet_id.in_(sublet_ids)).all()]
        if slot_ids:
            db.query(ViewingBooking).filter(ViewingBooking.slot_id.in_(slot_ids)).delete(synchronize_session=False)
        db.query(ViewingSlot).filter(ViewingSlot.sublet_id.in_(sublet_ids)).delete(synchronize_session=False)
        db.query(ViewingAvailability).filter(ViewingAvailability.sublet_id.in_(sublet_ids)).delete(synchronize_session=False)
        db.query(SubletImage).filter(SubletImage.sublet_id.in_(sublet_ids)).delete(synchronize_session=False)
        db.query(Sublet).filter(Sublet.user_id == user_id).delete(synchronize_session=False)

    # 3. Posts: set user_id to NULL (posts use ondelete="SET NULL")
    db.query(Post).filter(Post.user_id == user_id).update({"user_id": None}, synchronize_session=False)

    # 4. Profile photo cleanup would happen via Cloudinary — handled by caller if needed

    # 5. Listing conversations: messages → conversations
    convo_ids = [c.id for c in db.query(Conversation.id).filter(Conversation.user_id == user_id).all()]
    if convo_ids:
        db.query(Message).filter(Message.conversation_id.in_(convo_ids)).delete(synchronize_session=False)
        db.query(Conversation).filter(Conversation.user_id == user_id).delete(synchronize_session=False)

    # 6. Viewing bookings & availabilities (as student)
    db.query(ViewingBooking).filter(ViewingBooking.student_id == user_id).delete(synchronize_session=False)
    # Note: ViewingBooking.owner_id exists in the model but not in the actual DB table,
    # so we skip it. ViewingAvailability.owner_id does exist for sublet owners.
    db.query(ViewingAvailability).filter(ViewingAvailability.owner_id == user_id).delete(synchronize_session=False)

    # 7. Saved listings, flags, reviews
    db.query(SavedListing).filter(SavedListing.student_id == user_id).delete(synchronize_session=False)
    db.query(Flag).filter(Flag.reporter_id == user_id).delete(synchronize_session=False)
    db.query(Review).filter(Review.student_id == user_id).delete(synchronize_session=False)

    # 8. Roommates: invites, requests, memberships, owned groups (cascade handles members/invites/requests)
    db.query(RoommateInvite).filter(RoommateInvite.invited_user_id == user_id).delete(synchronize_session=False)
    db.query(RoommateInvite).filter(RoommateInvite.invited_by_id == user_id).delete(synchronize_session=False)
    db.query(RoommateRequest).filter(RoommateRequest.user_id == user_id).delete(synchronize_session=False)
    db.query(RoommateGroupMember).filter(RoommateGroupMember.user_id == user_id).delete(synchronize_session=False)

    # Delete owned groups (cascade will clean up their members/invites/requests)
    owned_group_ids = [g.id for g in db.query(RoommateGroup.id).filter(RoommateGroup.owner_id == user_id).all()]
    if owned_group_ids:
        db.query(RoommateRequest).filter(RoommateRequest.group_id.in_(owned_group_ids)).delete(synchronize_session=False)
        db.query(RoommateInvite).filter(RoommateInvite.group_id.in_(owned_group_ids)).delete(synchronize_session=False)
        db.query(RoommateGroupMember).filter(RoommateGroupMember.group_id.in_(owned_group_ids)).delete(synchronize_session=False)
        db.query(RoommateGroup).filter(RoommateGroup.owner_id == user_id).delete(synchronize_session=False)

    # 9. Settings tables (these have cascade="all, delete-orphan" on the relationship,
    #    but we delete explicitly to be safe with synchronize_session=False)
    db.query(RoommateProfile).filter(RoommateProfile.user_id == user_id).delete(synchronize_session=False)
    db.query(UserHousingPreferences).filter(UserHousingPreferences.user_id == user_id).delete(synchronize_session=False)
    db.query(NotificationPreferences).filter(NotificationPreferences.user_id == user_id).delete(synchronize_session=False)

    # 10. Delete the user
    db.delete(user)

# Property Helpers
def get_property_owned_by(property_id: int, landlord_id: int, db: Session) -> Property:
    """Fetch a property and verify the landlord owns it."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if prop.landlord_id != landlord_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this property")
    return prop


def _amenity_value(enabled: bool | None) -> AmenityValue:
    if enabled is None:
        return AmenityValue.UNKNOWN
    return AmenityValue.YES if enabled else AmenityValue.NO


def build_space_amenities(
    *,
    furnished: bool | None,
    utilities_included: bool | None,
    parking: bool | None,
    laundry: bool | None,
    wifi: bool | None = None,
    air_conditioning: bool | None = None,
    dishwasher: bool | None = None,
    balcony: bool | None = None,
    backyard: bool | None = None,
    elevator: bool | None = None,
    gym: bool | None = None,
    wheelchair_accessible: bool | None = None,
) -> SpaceAmenities:
    return SpaceAmenities(
        furnished=_amenity_value(furnished),
        utilities_included=_amenity_value(utilities_included),
        parking=_amenity_value(parking),
        laundry=_amenity_value(laundry),
        wifi=_amenity_value(wifi),
        air_conditioning=_amenity_value(air_conditioning),
        dishwasher=_amenity_value(dishwasher),
        balcony=_amenity_value(balcony),
        backyard=_amenity_value(backyard),
        elevator=_amenity_value(elevator),
        gym=_amenity_value(gym),
        wheelchair_accessible=_amenity_value(wheelchair_accessible),
    )


def build_listing_policies(
    *,
    pet_policy: PetPolicy | str = PetPolicy.UNKNOWN,
    smoking_policy: SmokingPolicy | str = SmokingPolicy.UNKNOWN,
) -> ListingPolicies:
    if isinstance(pet_policy, str):
        pet_policy = PetPolicy(pet_policy) if pet_policy in PetPolicy._value2member_map_ else PetPolicy.UNKNOWN
    if isinstance(smoking_policy, str):
        smoking_policy = SmokingPolicy(smoking_policy) if smoking_policy in SmokingPolicy._value2member_map_ else SmokingPolicy.UNKNOWN
    return ListingPolicies(
        pet_policy=pet_policy,
        smoking_policy=smoking_policy,
    )


def build_property_response(prop: Property) -> PropertyResponse:
    return PropertyResponse(
        id=prop.id,
        landlord_id=prop.landlord_id,
        title=prop.title,
        address=prop.address,
        postal_code=prop.postal_code,
        latitude=prop.latitude,
        longitude=prop.longitude,
        property_type=prop.property_type,
        total_rooms=prop.total_rooms,
        bathrooms=prop.bathrooms,
        is_furnished=prop.is_furnished,
        has_parking=prop.has_parking,
        has_laundry=prop.has_laundry,
        utilities_included=prop.utilities_included,
        has_wifi=prop.has_wifi,
        has_air_conditioning=prop.has_air_conditioning,
        has_dishwasher=prop.has_dishwasher,
        has_gym=prop.has_gym,
        has_elevator=prop.has_elevator,
        has_backyard=prop.has_backyard,
        has_balcony=prop.has_balcony,
        wheelchair_accessible=prop.wheelchair_accessible,
        pet_policy=prop.pet_policy,
        smoking_policy=prop.smoking_policy,
        estimated_utility_cost=prop.estimated_utility_cost,
        distance_to_campus_km=prop.distance_to_campus_km,
        walk_time_minutes=prop.walk_time_minutes,
        drive_time_minutes=prop.drive_time_minutes,
        bus_time_minutes=prop.bus_time_minutes,
        nearest_bus_route=prop.nearest_bus_route,
        amenities=build_space_amenities(
            furnished=prop.is_furnished,
            utilities_included=prop.utilities_included,
            parking=prop.has_parking,
            laundry=prop.has_laundry,
            wifi=prop.has_wifi,
            air_conditioning=prop.has_air_conditioning,
            dishwasher=prop.has_dishwasher,
            balcony=prop.has_balcony,
            backyard=prop.has_backyard,
            elevator=prop.has_elevator,
            gym=prop.has_gym,
            wheelchair_accessible=prop.wheelchair_accessible,
        ),
        policies=build_listing_policies(
            pet_policy=prop.pet_policy,
            smoking_policy=prop.smoking_policy,
        ),
        created_at=prop.created_at,
        updated_at=prop.updated_at,
    )


def build_sublet_terms(sublet: Sublet) -> SubletTerms:
    duration_days = None
    if sublet.sublet_start_date and sublet.sublet_end_date:
        duration_days = (sublet.sublet_end_date - sublet.sublet_start_date).days

    return SubletTerms(
        negotiable_price=None,
        flexible_dates=(duration_days >= 60) if duration_days is not None else None,
        roommates_staying=None,
        private_room=(
            sublet.room_type == "private"
            or getattr(sublet.room_type, "value", None) == "private"
        ),
        entire_place=(sublet.total_rooms == 1 and (
            sublet.room_type == "private"
            or getattr(sublet.room_type, "value", None) == "private"
        )),
        verified_place=None,
    )


def build_sublet_response(sublet: Sublet) -> SubletResponse:
    return SubletResponse(
        id=sublet.id,
        user_id=sublet.user_id,
        title=sublet.title,
        address=sublet.address,
        postal_code=sublet.postal_code,
        latitude=sublet.latitude,
        longitude=sublet.longitude,
        distance_to_campus_km=sublet.distance_to_campus_km,
        walk_time_minutes=sublet.walk_time_minutes,
        drive_time_minutes=sublet.drive_time_minutes,
        bus_time_minutes=sublet.bus_time_minutes,
        nearest_bus_route=sublet.nearest_bus_route,
        room_type=sublet.room_type,
        total_rooms=sublet.total_rooms,
        bathrooms=sublet.bathrooms,
        is_furnished=sublet.is_furnished,
        has_parking=sublet.has_parking,
        has_laundry=sublet.has_laundry,
        utilities_included=sublet.utilities_included,
        has_wifi=sublet.has_wifi,
        has_air_conditioning=sublet.has_air_conditioning,
        has_dishwasher=sublet.has_dishwasher,
        has_gym=sublet.has_gym,
        has_elevator=sublet.has_elevator,
        has_backyard=sublet.has_backyard,
        has_balcony=sublet.has_balcony,
        wheelchair_accessible=sublet.wheelchair_accessible,
        pet_policy=sublet.pet_policy,
        smoking_policy=sublet.smoking_policy,
        estimated_utility_cost=sublet.estimated_utility_cost,
        rent_per_month=sublet.rent_per_month,
        sublet_start_date=sublet.sublet_start_date,
        sublet_end_date=sublet.sublet_end_date,
        move_in_date=sublet.move_in_date,
        gender_preference=sublet.gender_preference,
        status=sublet.status,
        view_count=sublet.view_count,
        description=sublet.description,
        images=[SubletImageResponse.model_validate(img) for img in sublet.images],
        posted_by=sublet.posted_by,
        amenities=build_space_amenities(
            furnished=sublet.is_furnished,
            utilities_included=sublet.utilities_included,
            parking=sublet.has_parking,
            laundry=sublet.has_laundry,
            wifi=sublet.has_wifi,
            air_conditioning=sublet.has_air_conditioning,
            dishwasher=sublet.has_dishwasher,
            balcony=sublet.has_balcony,
            backyard=sublet.has_backyard,
            elevator=sublet.has_elevator,
            gym=sublet.has_gym,
            wheelchair_accessible=sublet.wheelchair_accessible,
        ),
        policies=build_listing_policies(
            pet_policy=sublet.pet_policy,
            smoking_policy=sublet.smoking_policy,
        ),
        terms=build_sublet_terms(sublet),
        created_at=sublet.created_at,
        updated_at=sublet.updated_at,
    )


def build_sublet_list_response(sublet: Sublet) -> SubletListResponse:
    return SubletListResponse(
        id=sublet.id,
        title=sublet.title,
        address=sublet.address,
        rent_per_month=sublet.rent_per_month,
        sublet_start_date=sublet.sublet_start_date,
        sublet_end_date=sublet.sublet_end_date,
        room_type=sublet.room_type,
        total_rooms=sublet.total_rooms,
        is_furnished=sublet.is_furnished,
        has_parking=sublet.has_parking,
        has_laundry=sublet.has_laundry,
        utilities_included=sublet.utilities_included,
        has_wifi=sublet.has_wifi,
        pet_policy=sublet.pet_policy,
        smoking_policy=sublet.smoking_policy,
        distance_to_campus_km=sublet.distance_to_campus_km,
        walk_time_minutes=sublet.walk_time_minutes,
        drive_time_minutes=sublet.drive_time_minutes,
        bus_time_minutes=sublet.bus_time_minutes,
        nearest_bus_route=sublet.nearest_bus_route,
        status=sublet.status,
        primary_image=sublet.primary_image,
        images=[SubletImageResponse.model_validate(img) for img in sublet.images],
        posted_by=sublet.posted_by,
        amenities=build_space_amenities(
            furnished=sublet.is_furnished,
            utilities_included=sublet.utilities_included,
            parking=sublet.has_parking,
            laundry=sublet.has_laundry,
            wifi=sublet.has_wifi,
            air_conditioning=sublet.has_air_conditioning,
            dishwasher=sublet.has_dishwasher,
            balcony=sublet.has_balcony,
            backyard=sublet.has_backyard,
            elevator=sublet.has_elevator,
            gym=sublet.has_gym,
            wheelchair_accessible=sublet.wheelchair_accessible,
        ),
        policies=build_listing_policies(
            pet_policy=sublet.pet_policy,
            smoking_policy=sublet.smoking_policy,
        ),
        terms=build_sublet_terms(sublet),
        created_at=sublet.created_at,
    )

# Listing Helpers
def get_landlord_for_user(user: User, db: Session) -> Landlord:
    landlord = db.query(Landlord).filter(Landlord.id == user.id).first()
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
    lease_type = listing.lease_type if isinstance(listing.lease_type, str) else listing.lease_type.value
    gender_preference = (
        listing.gender_preference
        if isinstance(listing.gender_preference, str)
        else (listing.gender_preference.value if listing.gender_preference else None)
    )

    return ListingDetailResponse(
        id=listing.id,
        rent_per_room=listing.rent_per_room,
        rent_total=listing.rent_total,
        lease_type=lease_type,
        move_in_date=listing.move_in_date,
        is_sublet=listing.is_sublet,
        sublet_start_date=listing.sublet_start_date,
        sublet_end_date=listing.sublet_end_date,
        gender_preference=gender_preference,
        status=listing.status if isinstance(listing.status, str) else listing.status.value,
        view_count=listing.view_count,
        images=[ListingImageResponse.model_validate(img) for img in listing.images],
        created_at=listing.created_at,
        property_id=prop.id,
        title=prop.title,
        address=prop.address,
        latitude=prop.latitude,
        longitude=prop.longitude,
        property_type=prop.property_type if isinstance(prop.property_type, str) else prop.property_type.value,
        total_rooms=prop.total_rooms,
        bathrooms=prop.bathrooms,
        is_furnished=prop.is_furnished,
        has_parking=prop.has_parking,
        has_laundry=prop.has_laundry,
        utilities_included=prop.utilities_included,
        pet_friendly=prop.pet_policy in (PetPolicy.ALLOWED.value, PetPolicy.CASE_BY_CASE.value),
        has_air_conditioning=prop.has_air_conditioning,
        has_wifi=prop.has_wifi,
        has_dishwasher=prop.has_dishwasher,
        has_gym=prop.has_gym,
        has_elevator=prop.has_elevator,
        has_backyard=prop.has_backyard,
        has_balcony=prop.has_balcony,
        smoking_allowed=prop.smoking_policy in (SmokingPolicy.ALLOWED.value, SmokingPolicy.OUTSIDE_ONLY.value),
        wheelchair_accessible=prop.wheelchair_accessible,
        pet_policy=prop.pet_policy,
        smoking_policy=prop.smoking_policy,
        estimated_utility_cost=prop.estimated_utility_cost,
        distance_to_campus_km=prop.distance_to_campus_km,
        walk_time_minutes=prop.walk_time_minutes,
        drive_time_minutes=prop.drive_time_minutes,
        bus_time_minutes=prop.bus_time_minutes,
        nearest_bus_route=prop.nearest_bus_route,
        amenities=build_space_amenities(
            furnished=prop.is_furnished,
            utilities_included=prop.utilities_included,
            parking=prop.has_parking,
            laundry=prop.has_laundry,
            wifi=prop.has_wifi,
            air_conditioning=prop.has_air_conditioning,
            dishwasher=prop.has_dishwasher,
            balcony=prop.has_balcony,
            backyard=prop.has_backyard,
            elevator=prop.has_elevator,
            gym=prop.has_gym,
            wheelchair_accessible=prop.wheelchair_accessible,
        ),
        policies=build_listing_policies(
            pet_policy=prop.pet_policy,
            smoking_policy=prop.smoking_policy,
        ),
        terms=ListingTerms(
            lease_type=lease_type,
            move_in_date=listing.move_in_date,
            gender_preference=gender_preference,
        ),
        landlord_id=landlord.id,
        landlord_name=f"{landlord.first_name} {landlord.last_name}",
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

# Upload to S3 helpers (Landlord)

# Config
BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_DEFAULT_REGION")
s3_client = boto3.client("s3", region_name=AWS_REGION)

# Response
class S3UploadResponse(BaseModel):
    s3_key: str
    s3_url: str
    filename: str

# Helper
def upload_to_s3(file: UploadFile, landlord_id: int, folder: str) -> tuple[str, str]:
    file_ext = file.filename.split(".")[-1] if file.filename else "bin"
    s3_key = f"documents/landlord_{landlord_id}/{folder}/{uuid.uuid4()}.{file_ext}"

    s3_client.upload_fileobj(
        file.file,
        BUCKET_NAME,
        s3_key,
        ExtraArgs={"ContentType": file.content_type or "application/octet-stream"},
    )

    s3_url = f"https://{BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
    return s3_key, s3_url

# Slug helpers
def generate_slug(title: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", title.lower())
    slug = re.sub(r"[\s_]+", "-", slug).strip("-")
    return f"{slug}-{uuid.uuid4().hex[:8]}"

def slugify_group_name(name: str) -> str:
    """Convert group name to URL-safe slug."""
    slug = re.sub(r"[^\w\s-]", "", name.lower())
    slug = re.sub(r"[\s_]+", "-", slug).strip("-")
    return slug
# Helpers calculating compatibility 
def calculate_compatibility(profile_a: RoommateProfile, profile_b: RoommateProfile) -> int:
    if not profile_a or not profile_b:
        return 0

    score = 0
    total_weight = 0

    comparisons = [
        ("sleep_schedule", 15),
        ("cleanliness", 20),
        ("noise_level", 15),
        ("guests", 10),
        ("study_habits", 5),
        ("smoking", 15),
        ("pets", 5),
        ("kitchen_use", 5),
        ("budget_range", 5),
        ("roommate_timing", 5),
    ]

    for field, weight in comparisons:
        val_a = getattr(profile_a, field)
        val_b = getattr(profile_b, field)

        if val_a is None or val_b is None:
            continue

        total_weight += weight

        if val_a == val_b:
            score += weight
        else:
            options = [e.value for e in type(val_a)]
            try:
                idx_a = options.index(val_a.value)
                idx_b = options.index(val_b.value)
                distance = abs(idx_a - idx_b)
                max_distance = len(options) - 1
                if max_distance > 0:
                    score += weight * (1 - distance / max_distance) * 0.5
            except (ValueError, ZeroDivisionError):
                pass

    if total_weight == 0:
        return 0

    return round((score / total_weight) * 100)

def calculate_group_compatibility(user_profile: RoommateProfile, group: RoommateGroup, db: Session) -> int:
    active_members = [m for m in group.members if m.is_active]
    if not active_members:
        return 0

    total = 0
    count = 0
    for member in active_members:
        member_profile = db.query(RoommateProfile).filter(
            RoommateProfile.user_id == member.user_id
        ).first()
        if member_profile and member_profile.quiz_completed:
            total += calculate_compatibility(user_profile, member_profile)
            count += 1

    return round(total / count) if count > 0 else 0

# Writers Helper
def get_owned_post(post_id: int, current_author, db: Session) -> Post:
    query = db.query(Post).filter(Post.id == post_id)
    if isinstance(current_author, User):
        query = query.filter(Post.user_id == current_author.id)
    else:
        query = query.filter(Post.writer_id == current_author.id)
    post = query.first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found or not yours")
    return post
    
# Vewing helpers
def generate_hourly_slots(availability: ViewingAvailability) -> list[dict]:
    slots = []
    current = datetime.combine(availability.date, availability.start_time)
    end = datetime.combine(availability.date, availability.end_time)

    while current + timedelta(hours=1) <= end:
        slot_end = current + timedelta(hours=1)
        slots.append({
            "start_time": current.time(),
            "end_time": slot_end.time(),
        })
        current = slot_end

    return slots

def build_booking_response(booking: ViewingBooking, db: Session) -> BookingResponse:
    slot = booking.slot
    student = db.query(User).filter(User.id == booking.student_id).first()

    if booking.listing_id:
        landlord = db.query(Landlord).filter(Landlord.id == booking.landlord_id).first()
        listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
        prop = db.query(Property).filter(Property.id == listing.property_id).first()
        host_id = landlord.id
        host_name = f"{landlord.first_name} {landlord.last_name}"
        title = prop.title
        address = prop.address
    else:
        sublet = db.query(Sublet).filter(Sublet.id == booking.sublet_id).first()
        owner = db.query(User).filter(User.id == booking.owner_id).first()
        host_id = None
        host_name = f"{owner.first_name} {owner.last_name}"
        title = sublet.title
        address = sublet.address

    return BookingResponse(
        id=booking.id,
        slot_id=booking.slot_id,
        listing_id=booking.listing_id,
        sublet_id=booking.sublet_id,
        student_id=booking.student_id,
        student_name=f"{student.first_name} {student.last_name}",
        landlord_id=host_id,
        landlord_name=host_name,
        date=slot.date,
        start_time=slot.start_time,
        end_time=slot.end_time,
        status=booking.status,
        notes=booking.notes,
        listing_title=title,
        listing_address=address,
        created_at=booking.created_at,
    )

def get_booking_details(booking: ViewingBooking, db: Session) -> dict:
    slot = booking.slot

    if booking.listing_id:
        listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
        prop = db.query(Property).filter(Property.id == listing.property_id).first()
        title = prop.title
        address = prop.address
    else:
        sublet = db.query(Sublet).filter(Sublet.id == booking.sublet_id).first()
        title = sublet.title
        address = sublet.address

    return {
        "listing_title": title,
        "address": address,
        "date": str(slot.date),
        "start_time": str(slot.start_time),
        "end_time": str(slot.end_time),
    }

def get_host_info(booking: ViewingBooking, db: Session):
    if booking.landlord_id:
        landlord = db.query(Landlord).filter(Landlord.id == booking.landlord_id).first()
        return landlord.email, landlord.first_name, f"{landlord.first_name} {landlord.last_name}"
    else:
        owner = db.query(User).filter(User.id == booking.owner_id).first()
        return owner.email, owner.first_name, f"{owner.first_name} {owner.last_name}"
# AI Compare helper (Prompt builder)
def build_listing_prompt_data(listing: Listing, prop: Property, landlord: Landlord, score: Optional[int]) -> str:
    """Format a single listing's data for the AI prompt."""
    amenities = []
    if prop.is_furnished:
        amenities.append("Furnished")
    if prop.has_parking:
        amenities.append("Parking")
    if prop.has_laundry:
        amenities.append("Laundry")
    if prop.utilities_included:
        amenities.append("Utilities included")

    gender_pref = listing.gender_preference
    if hasattr(gender_pref, "value"):
        gender_pref = gender_pref.value

    lease = listing.lease_type
    if hasattr(lease, "value"):
        lease = lease.value

    prop_type = prop.property_type
    if hasattr(prop_type, "value"):
        prop_type = prop_type.value

    lines = [
        f"LISTING #{listing.id}: {prop.title}",
        f"  Address: {prop.address}",
        f"  Type: {prop_type}",
        f"  Rent: ${listing.rent_per_room}/room, ${listing.rent_total}/total",
        f"  Rooms: {prop.total_rooms} bed, {prop.bathrooms} bath",
        f"  Lease: {lease}",
        f"  Move-in: {listing.move_in_date}",
        f"  Amenities: {', '.join(amenities) if amenities else 'None listed'}",
        f"  Distance to campus: {prop.distance_to_campus_km}km" if prop.distance_to_campus_km else "",
        f"  Walk time: {prop.walk_time_minutes} min" if prop.walk_time_minutes else "",
        f"  Bus time: {prop.bus_time_minutes} min" if prop.bus_time_minutes else "",
        f"  Nearest bus: {prop.nearest_bus_route}" if prop.nearest_bus_route else "",
        f"  Estimated utilities: ${prop.estimated_utility_cost}/month" if prop.estimated_utility_cost and not prop.utilities_included else "",
        f"  Gender preference: {gender_pref}" if gender_pref else "",
        f"  Cribb Score: {score}/100" if score else "",
        f"  Landlord: {landlord.first_name} {landlord.last_name} ({'Verified' if landlord.identity_verified else 'Unverified'})",
        f"  Views: {listing.view_count}",
    ]

    return "\n".join(line for line in lines if line)
