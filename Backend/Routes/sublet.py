from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional
from datetime import date
from tables import Sublet, SubletImage, User, get_db
from Schemas.subletSchema import SubletCreate, SubletUpdate, SubletResponse, SubletListResponse, SubletImageResponse, SubletStatus, RoomType
from Schemas.listingSchema import GenderPreference
from Utils.security import get_current_user
from helpers import upload_to_s3
from decimal import Decimal

sublet_router = APIRouter()

# Create a sublet
@sublet_router.post("/", response_model=SubletResponse, status_code=status.HTTP_201_CREATED)
def create_sublet(payload: SubletCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    if payload.sublet_end_date <= payload.sublet_start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    sublet = Sublet(
        user_id=current_user.id,
        title=payload.title,
        address=payload.address,
        postal_code=payload.postal_code,
        latitude=payload.latitude,
        longitude=payload.longitude,
        distance_to_campus_km=payload.distance_to_campus_km,
        walk_time_minutes=payload.walk_time_minutes,
        drive_time_minutes=payload.drive_time_minutes,
        bus_time_minutes=payload.bus_time_minutes,
        nearest_bus_route=payload.nearest_bus_route,
        room_type=payload.room_type,
        total_rooms=payload.total_rooms,
        bathrooms=payload.bathrooms,
        is_furnished=payload.is_furnished,
        has_parking=payload.has_parking,
        has_laundry=payload.has_laundry,
        utilities_included=payload.utilities_included,
        estimated_utility_cost=payload.estimated_utility_cost,
        rent_per_month=payload.rent_per_month,
        sublet_start_date=payload.sublet_start_date,
        sublet_end_date=payload.sublet_end_date,
        move_in_date=payload.move_in_date,
        gender_preference=payload.gender_preference,
        description=payload.description,
    )
    db.add(sublet)
    db.commit()
    db.refresh(sublet)

    response = SubletResponse.model_validate(sublet)
    response.posted_by = f"{current_user.first_name} {current_user.last_name}"
    return response

# Get all active sublets (public, with filters)
@sublet_router.get("/", response_model=list[SubletListResponse])
def get_all_sublets(
    min_rent: Optional[float] = Query(None),
    max_rent: Optional[float] = Query(None),
    room_type: Optional[RoomType] = Query(None),
    is_furnished: Optional[bool] = Query(None),
    utilities_included: Optional[bool] = Query(None),
    distance_to_campus_km: Optional[Decimal] = Query(None),
    gender_preference: Optional[GenderPreference] = Query(None),
    available_from: Optional[date] = Query(None),
    available_until: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Sublet).filter(Sublet.status == SubletStatus.ACTIVE)

    if min_rent is not None:
        query = query.filter(Sublet.rent_per_month >= min_rent)
    if max_rent is not None:
        query = query.filter(Sublet.rent_per_month <= max_rent)
    if room_type is not None:
        query = query.filter(Sublet.room_type == room_type)
    if is_furnished is not None:
        query = query.filter(Sublet.is_furnished == is_furnished)
    if utilities_included is not None:
        query = query.filter(Sublet.utilities_included == utilities_included)
    if distance_to_campus_km is not None:
        query = query.filter(Sublet.distance_to_campus_km <= distance_to_campus_km)
    if gender_preference is not None:
        query = query.filter(Sublet.gender_preference == gender_preference)
    if available_from is not None:
        query = query.filter(Sublet.sublet_start_date <= available_from)
    if available_until is not None:
        query = query.filter(Sublet.sublet_end_date >= available_until)

    sublets = query.order_by(Sublet.created_at.desc()).all()

    result = []
    for sublet in sublets:
        user = db.query(User).filter(User.id == sublet.user_id).first()
        primary_image = next((img.image_url for img in sublet.images if img.is_primary), None)
        if not primary_image and sublet.images:
            primary_image = sublet.images[0].image_url

        result.append(
            SubletListResponse(
                id=sublet.id,
                title=sublet.title,
                address=sublet.address,
                rent_per_month=sublet.rent_per_month,
                sublet_start_date=sublet.sublet_start_date,
                sublet_end_date=sublet.sublet_end_date,
                room_type=sublet.room_type,
                total_rooms=sublet.total_rooms,
                is_furnished=sublet.is_furnished,
                distance_to_campus_km=sublet.distance_to_campus_km,
                walk_time_minutes=sublet.walk_time_minutes,
                drive_time_minutes=sublet.drive_time_minutes,
                bus_time_minutes=sublet.bus_time_minutes,
                nearest_bus_route=sublet.nearest_bus_route,
                status=sublet.status,
                primary_image=primary_image,
                posted_by=f"{user.first_name} {user.last_name}",
                created_at=sublet.created_at,
            )
        )

    return result

# Get a single sublet by ID
@sublet_router.get("/{sublet_id}", response_model=SubletResponse)
def get_sublet(sublet_id: int, db: Session = Depends(get_db)):
    sublet = db.query(Sublet).filter(Sublet.id == sublet_id).first()
    if not sublet:
        raise HTTPException(status_code=404, detail="Sublet not found")

    sublet.view_count += 1
    db.commit()

    user = db.query(User).filter(User.id == sublet.user_id).first()

    response = SubletResponse.model_validate(sublet)
    response.posted_by = f"{user.first_name} {user.last_name}"
    return response

# Get current user's sublets
@sublet_router.get("/my/listings", response_model=list[SubletListResponse])
def get_my_sublets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    sublets = db.query(Sublet).filter(Sublet.user_id == current_user.id).order_by(Sublet.created_at.desc()).all()

    result = []
    for sublet in sublets:
        primary_image = next((img.image_url for img in sublet.images if img.is_primary), None)
        if not primary_image and sublet.images:
            primary_image = sublet.images[0].image_url

        result.append(
            SubletListResponse(
                id=sublet.id,
                title=sublet.title,
                address=sublet.address,
                rent_per_month=sublet.rent_per_month,
                sublet_start_date=sublet.sublet_start_date,
                sublet_end_date=sublet.sublet_end_date,
                room_type=sublet.room_type,
                total_rooms=sublet.total_rooms,
                is_furnished=sublet.is_furnished,
                distance_to_campus_km=sublet.distance_to_campus_km,
                walk_time_minutes=sublet.walk_time_minutes,
                drive_time_minutes=sublet.drive_time_minutes,
                bus_time_minutes=sublet.bus_time_minutes,
                nearest_bus_route=sublet.nearest_bus_route,
                status=sublet.status,
                primary_image=primary_image,
                posted_by=f"{current_user.first_name} {current_user.last_name}",
                created_at=sublet.created_at,
            )
        )

    return result

# Update a sublet
@sublet_router.patch("/{sublet_id}", response_model=SubletResponse)
def update_sublet(sublet_id: int, payload: SubletUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    sublet = db.query(Sublet).filter(and_(Sublet.id == sublet_id, Sublet.user_id == current_user.id)).first()

    if not sublet:
        raise HTTPException(status_code=404, detail="Sublet not found")

    update_data = payload.model_dump(exclude_unset=True)

    # Validate dates if both are being updated
    start = update_data.get("sublet_start_date", sublet.sublet_start_date)
    end = update_data.get("sublet_end_date", sublet.sublet_end_date)
    if end <= start:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    for field, value in update_data.items():
        setattr(sublet, field, value)

    db.commit()
    db.refresh(sublet)

    user = db.query(User).filter(User.id == sublet.user_id).first()
    response = SubletResponse.model_validate(sublet)
    response.posted_by = f"{user.first_name} {user.last_name}"
    return response

# Delete a sublet
@sublet_router.delete("/{sublet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sublet(sublet_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    sublet = db.query(Sublet).filter(and_(Sublet.id == sublet_id, Sublet.user_id == current_user.id)).first()

    if not sublet:
        raise HTTPException(status_code=404, detail="Sublet not found")

    db.delete(sublet)
    db.commit()

# Upload images to a sublet
@sublet_router.post("/{sublet_id}/images", response_model=list[SubletImageResponse], status_code=status.HTTP_201_CREATED)
async def upload_sublet_images(sublet_id: int, files: list[UploadFile] = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    sublet = db.query(Sublet).filter(and_(Sublet.id == sublet_id, Sublet.user_id == current_user.id)).first()

    if not sublet:
        raise HTTPException(status_code=404, detail="Sublet not found")

    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images allowed")

    existing_count = len(sublet.images)
    images = []

    # Adjust this to use cloudinary
    for i, file in enumerate(files):
        _, image_url = upload_to_s3(file, current_user.id, f"sublets/{sublet_id}")

        image = SubletImage(
            sublet_id=sublet.id,
            image_url=image_url,
            is_primary=(existing_count == 0 and i == 0),  # first image is primary
        )
        db.add(image)
        images.append(image)

    db.commit()
    for img in images:
        db.refresh(img)

    return [SubletImageResponse.model_validate(img) for img in images]

# Delete an image from a sublet
@sublet_router.delete("/{sublet_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sublet_image(sublet_id: int, image_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    sublet = db.query(Sublet).filter(and_(Sublet.id == sublet_id, Sublet.user_id == current_user.id)).first()

    if not sublet:
        raise HTTPException(status_code=404, detail="Sublet not found")

    image = db.query(SubletImage).filter(and_(SubletImage.id == image_id, SubletImage.sublet_id == sublet_id)).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    db.delete(image)
    db.commit()