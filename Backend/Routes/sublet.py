from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, BackgroundTasks, File, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func, or_
from typing import Optional
from datetime import date
from tables import Sublet, SubletImage,SubletConversation, SubletMessage, User, get_db
from Schemas.subletSchema import *
from Schemas.listingSchema import GenderPreference
from Utils.security import get_current_student
from helpers import build_sublet_list_response, build_sublet_response
from Utils.cache import cached, invalidate
from Utils.cloudinary import upload_image_to_cloudinary, delete_image_from_cloudinary
from Utils.email import send_message_notification
from Utils.websocket import connection_manager
from decimal import Decimal

sublet_router = APIRouter()

# Create a sublet
@sublet_router.post("/", response_model=SubletResponse, status_code=status.HTTP_201_CREATED)
def create_sublet(payload: SubletCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    
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
        rent_per_month=payload.rent_per_month,
        sublet_start_date=payload.sublet_start_date,
        sublet_end_date=payload.sublet_end_date,
        move_in_date=payload.move_in_date,
        gender_preference=payload.gender_preference,
        status=SubletStatus.ACTIVE,
        description=payload.description,
    )
    db.add(sublet)
    db.commit()
    db.refresh(sublet)

    invalidate("sublets:list")
    return build_sublet_response(sublet)

# upload sublet images
@sublet_router.post("/{sublet_id}/images", status_code=status.HTTP_201_CREATED)
async def upload_sublet_images(sublet_id: int, files: list[UploadFile] = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    
    sublet = db.query(Sublet).filter(Sublet.id == sublet_id,Sublet.user_id == current_user.id).first()

    if not sublet:
        raise HTTPException(status_code=404, detail="Sublet not found")

    existing_count = len(sublet.images)

    if existing_count + len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum 10 images allowed. You have {existing_count}, trying to add {len(files)}.",
        )

    images = []
    for i, file in enumerate(files):
        image_url = upload_image_to_cloudinary(
            file,
            folder=f"sublets/{sublet_id}",
        )

        image = SubletImage(
            sublet_id=sublet.id,
            image_url=image_url,
            is_primary=(existing_count == 0 and i == 0),
        )
        db.add(image)
        images.append(image)

    db.commit()
    for img in images:
        db.refresh(img)

    invalidate("sublets:list")
    return [SubletImageResponse.model_validate(img) for img in images]

# Reorder sublet images — provide image IDs in the new desired order
@sublet_router.patch("/{sublet_id}/images/reorder", response_model=list[SubletImageResponse])
def reorder_sublet_images(sublet_id: int, payload: SubletImageReorder, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    sublet = db.query(Sublet).filter(Sublet.id == sublet_id, Sublet.user_id == current_user.id).first()
    if not sublet:
        raise HTTPException(status_code=404, detail="Sublet not found")
 
    images = db.query(SubletImage).filter(SubletImage.sublet_id == sublet.id).all()
    existing_ids = {img.id for img in images}
    incoming_ids = set(payload.image_ids)
 
    if existing_ids != incoming_ids:
        raise HTTPException(
            status_code=400,
            detail="image_ids must contain every image on this sublet exactly once",
        )
 
    image_by_id = {img.id: img for img in images}
    for new_order, image_id in enumerate(payload.image_ids):
        img = image_by_id[image_id]
        img.display_order = new_order
        img.is_primary = (new_order == 0)
 
    db.commit()

    invalidate("sublets:list")
    ordered = sorted(images, key=lambda img: img.display_order)
    return [SubletImageResponse.model_validate(img) for img in ordered]
 
 
# Get all active sublets (public, with filters)
@sublet_router.get("/", response_model=list[SubletListResponse])
@cached("sublets:list", ttl=180)
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
    query = db.query(Sublet).options(
        joinedload(Sublet.images),
        joinedload(Sublet.user),
    ).filter(Sublet.status == SubletStatus.ACTIVE)

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
    
    return [build_sublet_list_response(sublet) for sublet in sublets]

# Get current user's sublets
@sublet_router.get("/my/listings", response_model=list[SubletListResponse])
def get_my_sublets(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    sublets = db.query(Sublet).options(
        joinedload(Sublet.images),
        joinedload(Sublet.user),
    ).filter(Sublet.user_id == current_user.id).order_by(Sublet.created_at.desc()).all()

    return [build_sublet_list_response(sublet) for sublet in sublets]

# Get current user's draft sublet listing
@sublet_router.get("/drafts/my", response_model=list[SubletListResponse])
def get_my_draft_sublets(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    sublets = db.query(Sublet).options(
        joinedload(Sublet.images),
        joinedload(Sublet.user),
    ).filter(Sublet.user_id == current_user.id, Sublet.status == SubletStatus.DRAFT).order_by(Sublet.created_at.desc()).all()

    return [build_sublet_list_response(s) for s in sublets]

# Inquirer starts a conversation with the sublet poster
@sublet_router.post("/conversations", response_model=SubletMessageResponse, status_code=status.HTTP_201_CREATED)
def start_sublet_conversation(payload: StartSubletConversation, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    sublet = db.query(Sublet).filter(Sublet.id == payload.sublet_id).first()
    if not sublet:
        raise HTTPException(status_code=404, detail="Sublet not found")

    if sublet.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't message yourself")

    if sublet.status != SubletStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="This sublet is no longer available")

    existing = db.query(SubletConversation).filter(SubletConversation.sublet_id == payload.sublet_id, SubletConversation.inquirer_id == current_user.id).first()
    if existing:
        existing.poster_archived_at = None
        existing.inquirer_archived_at = None
        existing.updated_at = func.now()
        db.commit()
        raise HTTPException(
            status_code=409,
            detail="Conversation already exists",
            headers={"X-Conversation-Id": str(existing.id)},
        )

    conversation = SubletConversation(
        sublet_id=payload.sublet_id,
        poster_id=sublet.user_id,
        inquirer_id=current_user.id,
    )
    db.add(conversation)
    db.flush()

    message = SubletMessage(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=payload.content,
    )
    conversation.poster_archived_at = None
    conversation.inquirer_archived_at = None
    conversation.updated_at = func.now()
    db.add(message)
    db.commit()
    db.refresh(message)

    poster = db.query(User).filter(User.id == sublet.user_id).first()
    background_tasks.add_task(
        send_message_notification,
        to_email=poster.email,
        recipient_name=poster.first_name,
        sender_name=f"{current_user.first_name} {current_user.last_name}",
        message_preview=payload.content,
        conversation_id=conversation.id,
        property_title=sublet.title,
    )

    # Notify the poster in real time
    background_tasks.add_task(
        connection_manager.send_to_user,
        "student",
        sublet.user_id,
        {"type": "new_message", "conversation_id": conversation.id, "scope": "sublet"},
    )

    return SubletMessageResponse.model_validate(message)

# Send a message in an existing sublet conversation
@sublet_router.post("/conversations/{conversation_id}/messages", response_model=SubletMessageResponse, status_code=status.HTTP_201_CREATED)
def send_sublet_message(conversation_id: int, payload: SubletMessageCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    conversation = db.query(SubletConversation).filter(SubletConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    is_poster = conversation.poster_id == current_user.id
    is_inquirer = conversation.inquirer_id == current_user.id

    if not is_poster and not is_inquirer:
        raise HTTPException(status_code=403, detail="Access denied")

    message = SubletMessage(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=payload.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    sublet = db.query(Sublet).filter(Sublet.id == conversation.sublet_id).first()
    other_user_id = conversation.poster_id if is_inquirer else conversation.inquirer_id
    other_user = db.query(User).filter(User.id == other_user_id).first()

    background_tasks.add_task(
        send_message_notification,
        to_email=other_user.email,
        recipient_name=other_user.first_name,
        sender_name=f"{current_user.first_name} {current_user.last_name}",
        message_preview=payload.content,
        conversation_id=conversation.id,
        property_title=sublet.title,
    )

    # Notify the other party in real time
    background_tasks.add_task(
        connection_manager.send_to_user,
        "student",
        other_user_id,
        {"type": "new_message", "conversation_id": conversation.id, "scope": "sublet"},
    )

    return SubletMessageResponse.model_validate(message)

# Get all sublet conversations for the current user (either as poster or inquirer)
@sublet_router.get("/conversations", response_model=list[SubletConversationResponse])
def get_my_sublet_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    conversations = db.query(SubletConversation).filter(
        or_(
            and_(
                SubletConversation.poster_id == current_user.id,
                SubletConversation.poster_archived_at.is_(None),
            ),
            and_(
                SubletConversation.inquirer_id == current_user.id,
                SubletConversation.inquirer_archived_at.is_(None),
            ),
        )
    ).order_by(SubletConversation.updated_at.desc()).all()

    result = []
    for conv in conversations:
        last_message = db.query(SubletMessage).filter(SubletMessage.conversation_id == conv.id).order_by(SubletMessage.created_at.desc()).first()
        unread_count = db.query(func.count(SubletMessage.id)).filter(
            and_(
                SubletMessage.conversation_id == conv.id,
                SubletMessage.sender_id != current_user.id,
                SubletMessage.is_read == False,
            )).scalar()

        sublet = db.query(Sublet).filter(Sublet.id == conv.sublet_id).first()
        poster = db.query(User).filter(User.id == conv.poster_id).first()
        inquirer = db.query(User).filter(User.id == conv.inquirer_id).first()

        result.append(
            SubletConversationResponse(
                id=conv.id,
                sublet_id=conv.sublet_id,
                sublet_title=sublet.title,
                poster_id=conv.poster_id,
                poster_name=f"{poster.first_name} {poster.last_name}",
                inquirer_id=conv.inquirer_id,
                inquirer_name=f"{inquirer.first_name} {inquirer.last_name}",
                last_message=SubletMessageResponse.model_validate(last_message) if last_message else None,
                unread_count=unread_count,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
            )
        )

    return result

# Get a single sublet conversation with all messages (marks unread messages as read)
@sublet_router.get("/conversations/{conversation_id}", response_model=SubletConversationDetailResponse)
def get_sublet_conversation(conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    conversation = db.query(SubletConversation).filter(SubletConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation.poster_id != current_user.id and conversation.inquirer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Mark messages from the OTHER party as read
    db.query(SubletMessage).filter(
        and_(
            SubletMessage.conversation_id == conversation_id,
            SubletMessage.sender_id != current_user.id,
            SubletMessage.is_read == False,
        )
    ).update({"is_read": True})
    db.commit()

    sublet = db.query(Sublet).filter(Sublet.id == conversation.sublet_id).first()
    poster = db.query(User).filter(User.id == conversation.poster_id).first()
    inquirer = db.query(User).filter(User.id == conversation.inquirer_id).first()

    return SubletConversationDetailResponse(
        id=conversation.id,
        sublet_id=conversation.sublet_id,
        sublet_title=sublet.title if sublet else "Deleted sublet",
        poster_id=conversation.poster_id,
        poster_name=f"{poster.first_name} {poster.last_name}" if poster else "Unknown",
        inquirer_id=conversation.inquirer_id,
        inquirer_name=f"{inquirer.first_name} {inquirer.last_name}" if inquirer else "Unknown",
        messages=[SubletMessageResponse.model_validate(m) for m in conversation.messages],
    )

@sublet_router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sublet_conversation(conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    conversation = db.query(SubletConversation).filter(SubletConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation.poster_id != current_user.id and conversation.inquirer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if conversation.poster_id == current_user.id:
        conversation.poster_archived_at = func.now()
    else:
        conversation.inquirer_archived_at = func.now()
    db.commit()

# Get total unread sublet messages for the current user
@sublet_router.get("/unread-count")
def get_sublet_unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    conversation_ids = [c.id for c in db.query(SubletConversation.id).filter(
        or_(
            and_(
                SubletConversation.poster_id == current_user.id,
                SubletConversation.poster_archived_at.is_(None),
            ),
            and_(
                SubletConversation.inquirer_id == current_user.id,
                SubletConversation.inquirer_archived_at.is_(None),
            ),
        )
    ).all()]

    if not conversation_ids:
        return {"unread_count": 0}

    total_unread = db.query(func.count(SubletMessage.id)).filter(
        and_(
            SubletMessage.conversation_id.in_(conversation_ids),
            SubletMessage.sender_id != current_user.id,
            SubletMessage.is_read == False,
        )).scalar()

    return {"unread_count": total_unread}

# Get a single sublet by ID
@sublet_router.get("/{sublet_id}", response_model=SubletResponse)
def get_sublet(sublet_id: int, db: Session = Depends(get_db)):
    sublet = db.query(Sublet).options(
        joinedload(Sublet.images),
        joinedload(Sublet.user),
    ).filter(Sublet.id == sublet_id).first()
    if not sublet:
        raise HTTPException(status_code=404, detail="Sublet not found")

    db.query(Sublet).filter(Sublet.id == sublet_id).update(
        {Sublet.view_count: Sublet.view_count + 1},
        synchronize_session=False,
    )
    db.commit()

    return build_sublet_response(sublet)

@sublet_router.patch("/{sublet_id}/publish", response_model=SubletResponse)
def publish_sublet(sublet_id: int, db: Session = Depends(get_db),current_user: User = Depends(get_current_student)):
    sublet = db.query(Sublet).filter(Sublet.id == sublet_id, Sublet.user_id == current_user.id).first()

    if not sublet:
        raise HTTPException(status_code=404, detail="Sublet not found")

    if sublet.status not in (SubletStatus.DRAFT, SubletStatus.EXPIRED):
        raise HTTPException(status_code=400, detail="Only drafts or expired sublets can be published")

    sublet.status = SubletStatus.ACTIVE
    db.commit()
    db.refresh(sublet)

    invalidate("sublets:list")
    return build_sublet_response(sublet)

@sublet_router.patch("/{sublet_id}/unpublish", response_model=SubletResponse)
def unpublish_sublet(sublet_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    sublet = db.query(Sublet).filter(Sublet.id == sublet_id, Sublet.user_id == current_user.id).first()

    if not sublet:
        raise HTTPException(status_code=404, detail="Sublet not found")

    if sublet.status != SubletStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Only active sublets can be unpublished")

    sublet.status = SubletStatus.DRAFT
    db.commit()
    db.refresh(sublet)

    invalidate("sublets:list")
    return build_sublet_response(sublet)

# Update a sublet
@sublet_router.patch("/{sublet_id}", response_model=SubletResponse)
def update_sublet(sublet_id: int, payload: SubletUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    
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
        if hasattr(value, "value"):
            value = value.value
        setattr(sublet, field, value)

    db.commit()
    db.refresh(sublet)

    invalidate("sublets:list")
    return build_sublet_response(sublet)

# Delete a sublet
@sublet_router.delete("/{sublet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sublet(sublet_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    
    sublet = db.query(Sublet).filter(and_(Sublet.id == sublet_id, Sublet.user_id == current_user.id)).first()

    if not sublet:
        raise HTTPException(status_code=404, detail="Sublet not found")
    
    for image in sublet.images:
        delete_image_from_cloudinary(image.image_url)

    db.delete(sublet)
    db.commit()
    invalidate("sublets:list")

# Delete an image from a sublet
@sublet_router.delete("/{sublet_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sublet_image(sublet_id: int, image_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    
    sublet = db.query(Sublet).filter(and_(Sublet.id == sublet_id, Sublet.user_id == current_user.id)).first()

    if not sublet:
        raise HTTPException(status_code=404, detail="Sublet not found")

    image = db.query(SubletImage).filter(and_(SubletImage.id == image_id, SubletImage.sublet_id == sublet_id)).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    delete_image_from_cloudinary(image.image_url)
    db.delete(image)
    db.commit()
    invalidate("sublets:list")
