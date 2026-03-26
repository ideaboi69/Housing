from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from datetime import datetime, timezone, date
from tables import get_db, User, Landlord, Property, Listing, RoommateGroup, LandlordInvite
from Schemas.landlordInviteSchema import LandlordInviteCreate, LandlordInviteResponse, LandlordInviteDetailResponse
from Schemas.listingSchema import ListingStatus, LeaseType, GenderPreference
from Schemas.propertySchema import PropertyType
from Utils.security import get_current_user
from helpers import require_landlord, generate_slug, slugify_group_name
from config import settings
import secrets
import re

landlord_invite_router = APIRouter()

# Create a landlord invite (group owner only)
@landlord_invite_router.post("/groups/{group_id}/landlord-invite", response_model=LandlordInviteResponse, status_code=status.HTTP_201_CREATED)
def create_landlord_invite(group_id: int, payload: LandlordInviteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = db.query(RoommateGroup).filter(RoommateGroup.id == group_id, RoommateGroup.owner_id == current_user.id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found or not yours")
 
    # If the group already has a linked listing, no need for an invite
    if group.listing_id:
        raise HTTPException(status_code=400, detail="This group already has a linked listing")
 
    # Cancel any existing pending invite for this group (one active at a time)
    existing = db.query(LandlordInvite).filter(LandlordInvite.group_id == group_id, LandlordInvite.status == "pending").first()
    if existing:
        existing.status = "cancelled"
 
    token = secrets.token_urlsafe(32)
    group_slug = slugify_group_name(group.name)
 
    invite = LandlordInvite(
        group_id=group_id,
        created_by=current_user.id,
        token=token,
        group_slug=group_slug,
        address=payload.address,
        postal_code=payload.postal_code,
        property_type=payload.property_type.value if payload.property_type else None,
        total_rooms=payload.total_rooms,
        bathrooms=payload.bathrooms,
        is_furnished=payload.is_furnished,
        has_parking=payload.has_parking,
        has_laundry=payload.has_laundry,
        utilities_included=payload.utilities_included,
        estimated_utility_cost=payload.estimated_utility_cost,
        distance_to_campus_km=payload.distance_to_campus_km,
        nearest_bus_route=payload.nearest_bus_route,
        rent_per_room=payload.rent_per_room,
        rent_total=payload.rent_total,
        lease_type=payload.lease_type.value if payload.lease_type else None,
        move_in_date=payload.move_in_date,
        gender_preference=payload.gender_preference.value if payload.gender_preference else None,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
 
    invite_url = f"{settings.FRONTEND_URL}/{group_slug}/landlord-invite/{token}"
 
    return LandlordInviteResponse(
        id=invite.id,
        group_id=invite.group_id,
        group_name=group.name,
        token=invite.token,
        invite_url=invite_url,
        status=invite.status,
        address=invite.address,
        postal_code=invite.postal_code,
        property_type=invite.property_type,
        total_rooms=invite.total_rooms,
        bathrooms=invite.bathrooms,
        is_furnished=invite.is_furnished,
        has_parking=invite.has_parking,
        has_laundry=invite.has_laundry,
        utilities_included=invite.utilities_included,
        estimated_utility_cost=invite.estimated_utility_cost,
        distance_to_campus_km=invite.distance_to_campus_km,
        nearest_bus_route=invite.nearest_bus_route,
        rent_per_room=invite.rent_per_room,
        rent_total=invite.rent_total,
        lease_type=invite.lease_type,
        move_in_date=invite.move_in_date,
        gender_preference=invite.gender_preference,
        created_at=invite.created_at,
    )
 
# Get current invite status (group owner only)
@landlord_invite_router.get("/groups/{group_id}/landlord-invite", response_model=LandlordInviteResponse)
def get_landlord_invite(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = db.query(RoommateGroup).filter( RoommateGroup.id == group_id, RoommateGroup.owner_id == current_user.id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found or not yours")
 
    invite = db.query(LandlordInvite).filter(LandlordInvite.group_id == group_id, LandlordInvite.status == "pending").first()
    if not invite:
        raise HTTPException(status_code=404, detail="No active invite for this group")
 
    invite_url = f"{settings.FRONTEND_URL}/{invite.group_slug}/landlord-invite/{invite.token}"
 
    return LandlordInviteResponse(
        id=invite.id,
        group_id=invite.group_id,
        group_name=group.name,
        token=invite.token,
        invite_url=invite_url,
        status=invite.status,
        address=invite.address,
        postal_code=invite.postal_code,
        property_type=invite.property_type,
        total_rooms=invite.total_rooms,
        bathrooms=invite.bathrooms,
        is_furnished=invite.is_furnished,
        has_parking=invite.has_parking,
        has_laundry=invite.has_laundry,
        utilities_included=invite.utilities_included,
        estimated_utility_cost=invite.estimated_utility_cost,
        distance_to_campus_km=invite.distance_to_campus_km,
        nearest_bus_route=invite.nearest_bus_route,
        rent_per_room=invite.rent_per_room,
        rent_total=invite.rent_total,
        lease_type=invite.lease_type,
        move_in_date=invite.move_in_date,
        gender_preference=invite.gender_preference,
        created_at=invite.created_at,
    )
 
# Cancel an invite (group owner only)
@landlord_invite_router.delete("/groups/{group_id}/landlord-invite", status_code=status.HTTP_200_OK)
def cancel_landlord_invite( group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = db.query(RoommateGroup).filter(RoommateGroup.id == group_id, RoommateGroup.owner_id == current_user.id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found or not yours")
 
    invite = db.query(LandlordInvite).filter(LandlordInvite.group_id == group_id, LandlordInvite.status == "pending").first()
    if not invite:
        raise HTTPException(status_code=404, detail="No active invite to cancel")
 
    invite.status = "cancelled"
    db.commit()
 
    return {"message": "Landlord invite cancelled"}

# Preview invite details (public — landlord sees this before signing up)
@landlord_invite_router.get("/landlord-invites/{token}", response_model=LandlordInviteDetailResponse)
def preview_landlord_invite(token: str, db: Session = Depends(get_db)):
    invite = db.query(LandlordInvite).filter(LandlordInvite.token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
 
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail=f"This invite has already been {invite.status}")
 
    group = db.query(RoommateGroup).filter(RoommateGroup.id == invite.group_id).first()
 
    return LandlordInviteDetailResponse(
        id=invite.id,
        group_name=group.name if group else "Unknown",
        group_description=group.description if group else None,
        group_size=group.current_size if group else 0,
        address=invite.address,
        postal_code=invite.postal_code,
        property_type=invite.property_type,
        total_rooms=invite.total_rooms,
        bathrooms=invite.bathrooms,
        is_furnished=invite.is_furnished,
        has_parking=invite.has_parking,
        has_laundry=invite.has_laundry,
        utilities_included=invite.utilities_included,
        estimated_utility_cost=invite.estimated_utility_cost,
        distance_to_campus_km=invite.distance_to_campus_km,
        nearest_bus_route=invite.nearest_bus_route,
        rent_per_room=invite.rent_per_room,
        rent_total=invite.rent_total,
        lease_type=invite.lease_type,
        move_in_date=invite.move_in_date,
        gender_preference=invite.gender_preference,
        status=invite.status,
        created_at=invite.created_at,
    )
 
# Claim invite — landlord creates Property + Listing in DRAFT, linked to group
@landlord_invite_router.post("/landlord-invites/{token}/claim", status_code=status.HTTP_201_CREATED)
def claim_landlord_invite(token: str, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = db.query(Landlord).filter(Landlord.id == current_user.id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")
 
    if not landlord.identity_verified:
        raise HTTPException(status_code=403, detail="Verify your identity before claiming a listing")
 
    invite = db.query(LandlordInvite).filter(LandlordInvite.token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
 
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail=f"This invite has already been {invite.status}")
 
    # Create Property with prefilled data
    prop = Property(
        landlord_id=landlord.id,
        title=f"Property at {invite.address}",
        address=invite.address,
        postal_code=invite.postal_code or "N1G0A1",
        property_type=PropertyType(invite.property_type) if invite.property_type else PropertyType.HOUSE,
        total_rooms=invite.total_rooms or 1,
        bathrooms=invite.bathrooms or 1,
        is_furnished=invite.is_furnished,
        has_parking=invite.has_parking,
        has_laundry=invite.has_laundry,
        utilities_included=invite.utilities_included,
        estimated_utility_cost=invite.estimated_utility_cost,
        distance_to_campus_km=invite.distance_to_campus_km,
        walk_time_minutes=0,
        drive_time_minutes=0,
        bus_time_minutes=0,
        nearest_bus_route=invite.nearest_bus_route,
    )
    db.add(prop)
    db.flush()
 
    # Create Listing in DRAFT
    listing = Listing(
        property_id=prop.id,
        rent_per_room=invite.rent_per_room or 0,
        rent_total=invite.rent_total or 0,
        lease_type=LeaseType(invite.lease_type) if invite.lease_type else LeaseType.TWELVE_MONTH,
        move_in_date=invite.move_in_date or date(2026, 9, 1),
        gender_preference=GenderPreference(invite.gender_preference) if invite.gender_preference else None,
        status=ListingStatus.DRAFT,
    )
    db.add(listing)
    db.flush()
 
    # Link listing to the roommate group
    group = db.query(RoommateGroup).filter(RoommateGroup.id == invite.group_id).first()
    if group:
        group.listing_id = listing.id
 
    # Mark invite as claimed
    invite.status = "claimed"
    invite.claimed_by = landlord.id
    invite.claimed_at = datetime.now(timezone.utc)
    invite.property_id = prop.id
    invite.listing_id = listing.id
 
    db.commit()
 
    return {
        "message": "Listing created successfully. Review and publish when ready.",
        "property_id": prop.id,
        "listing_id": listing.id,
        "group_id": invite.group_id,
    }