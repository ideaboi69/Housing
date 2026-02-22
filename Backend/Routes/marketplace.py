from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import Optional
from tables import get_db, User, MarketplaceItem, MarketplaceImage, MarketplaceConversation, MarketplaceMessage
from Schemas.marketplaceSchema import *
from Utils.security import get_current_user, get_current_student
from Utils.cloudinary import upload_image_to_cloudinary, delete_image_from_cloudinary
from Utils.email import send_message_notification

marketplace_router = APIRouter()

# Create a Marketplace item
@marketplace_router.post("/items", response_model=MarketplaceItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(payload: MarketplaceItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    if not current_user.email_verified:
        raise HTTPException(status_code=403, detail="Verify your email first")

    if payload.pricing_type == PricingType.FREE and payload.price:
        raise HTTPException(status_code=400, detail="Free items cannot have a price")

    if payload.pricing_type != PricingType.FREE and not payload.price:
        raise HTTPException(status_code=400, detail="Price is required for non-free items")

    item = MarketplaceItem(
        seller_id=current_user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        condition=payload.condition,
        pricing_type=payload.pricing_type,
        price=payload.price if payload.pricing_type != PricingType.FREE else None,
        pickup_location=payload.pickup_location,
        pickup_notes=payload.pickup_notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return MarketplaceItemResponse.model_validate(item)

# Upload item images
@marketplace_router.post("/items/{item_id}/images", response_model=list[MarketplaceImageResponse], status_code=status.HTTP_201_CREATED)
async def upload_item_images(item_id: int, files: list[UploadFile] = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id,MarketplaceItem.seller_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing_count = len(item.images)
    if existing_count + len(files) > 5:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum 5 images allowed. You have {existing_count}, trying to add {len(files)}.",
        )

    images = []
    for i, file in enumerate(files):
        image_url = upload_image_to_cloudinary(file, folder=f"marketplace/{item_id}")

        image = MarketplaceImage(
            item_id=item.id,
            image_url=image_url,
            is_primary=(existing_count == 0 and i == 0),
        )
        db.add(image)
        images.append(image)

    db.commit()
    for img in images:
        db.refresh(img)

    return [MarketplaceImageResponse.model_validate(img) for img in images]

# Update item info
@marketplace_router.patch("/items/{item_id}", response_model=MarketplaceItemResponse)
def update_item(item_id: int, payload: MarketplaceItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id, MarketplaceItem.seller_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = payload.model_dump(exclude_unset=True)

    pricing_type = update_data.get("pricing_type", item.pricing_type)
    price = update_data.get("price", item.price)

    if pricing_type == PricingType.FREE and price:
        raise HTTPException(status_code=400, detail="Free items cannot have a price")
    if pricing_type != PricingType.FREE and not price:
        raise HTTPException(status_code=400, detail="Price is required for non-free items")

    for field, value in update_data.items():
        setattr(item, field, value)

    if pricing_type == PricingType.FREE:
        item.price = None

    db.commit()
    db.refresh(item)

    return MarketplaceItemResponse.model_validate(item)

# Get all Marketplace items
@marketplace_router.get("/items", response_model=list[MarketplaceItemListResponse])
def get_all_items(
    category: Optional[MarketplaceCategory] = Query(None),
    condition: Optional[ItemCondition] = Query(None),
    pricing_type: Optional[PricingType] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(MarketplaceItem).filter(MarketplaceItem.status == ItemStatus.AVAILABLE)

    if category:
        query = query.filter(MarketplaceItem.category == category)
    if condition:
        query = query.filter(MarketplaceItem.condition == condition)
    if pricing_type:
        query = query.filter(MarketplaceItem.pricing_type == pricing_type)
    if min_price is not None:
        query = query.filter(MarketplaceItem.price >= min_price)
    if max_price is not None:
        query = query.filter(MarketplaceItem.price <= max_price)
    if search:
        query = query.filter(MarketplaceItem.title.ilike(f"%{search}%"))

    items = query.order_by(MarketplaceItem.created_at.desc()).all()
    return [MarketplaceItemListResponse.model_validate(item) for item in items]

# Get a specific item
@marketplace_router.get("/items/{item_id}", response_model=MarketplaceItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.view_count += 1
    db.commit()

    return MarketplaceItemResponse.model_validate(item)

# Get my items
@marketplace_router.get("/my/items", response_model=list[MarketplaceItemListResponse])
def get_my_items(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    items = db.query(MarketplaceItem).filter(MarketplaceItem.seller_id == current_user.id).order_by(MarketplaceItem.created_at.desc()).all()

    return [MarketplaceItemListResponse.model_validate(item) for item in items]

# Mark item as sold
@marketplace_router.patch("/items/{item_id}/sold", response_model=MarketplaceItemResponse)
def mark_item_sold(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id,MarketplaceItem.seller_id == current_user.id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.status = ItemStatus.SOLD
    db.commit()
    db.refresh(item)

    return MarketplaceItemResponse.model_validate(item)

# Delete item image(s)
@marketplace_router.delete("/items/{item_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item_image( item_id: int, image_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id,MarketplaceItem.seller_id == current_user.id,).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    image = db.query(MarketplaceImage).filter(MarketplaceImage.id == image_id, MarketplaceImage.item_id == item_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    delete_image_from_cloudinary(image.image_url)
    db.delete(image)
    db.commit()

# Delete item listing
@marketplace_router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id,MarketplaceItem.seller_id == current_user.id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    for image in item.images:
        delete_image_from_cloudinary(image.image_url)

    db.query(MarketplaceMessage).filter(
        MarketplaceMessage.conversation_id.in_(
            db.query(MarketplaceConversation.id).filter(
                MarketplaceConversation.item_id == item.id
            )
        )
    ).delete(synchronize_session=False)
    db.query(MarketplaceConversation).filter(MarketplaceConversation.item_id == item.id).delete()

    db.delete(item)
    db.commit()

# ──────────────────────────────────────────────
# MESSAGES
# ──────────────────────────────────────────────
    
# Start conversation
@marketplace_router.post("/conversations", response_model=MarketplaceMessageResponse, status_code=status.HTTP_201_CREATED)
def start_marketplace_conversation(payload: StartMarketplaceConversation, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't message yourself")

    if item.status != ItemStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="This item is no longer available")

    existing = db.query(MarketplaceConversation).filter(MarketplaceConversation.item_id == payload.item_id, MarketplaceConversation.buyer_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Conversation already exists",
            headers={"X-Conversation-Id": str(existing.id)},
        )

    conversation = MarketplaceConversation(
        item_id=payload.item_id,
        buyer_id=current_user.id,
        seller_id=item.seller_id,
    )
    db.add(conversation)
    db.flush()

    message = MarketplaceMessage(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=payload.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    seller = db.query(User).filter(User.id == item.seller_id).first()
    background_tasks.add_task(
        send_message_notification,
        to_email=seller.email,
        recipient_name=seller.first_name,
        sender_name=f"{current_user.first_name} {current_user.last_name}",
        message_preview=payload.content,
        conversation_id=conversation.id,
        listing_title=item.title,
    )

    return MarketplaceMessageResponse.model_validate(message)

# Sending a message
@marketplace_router.post("/conversations/{conversation_id}/messages", response_model=MarketplaceMessageResponse, status_code=status.HTTP_201_CREATED)
def send_marketplace_message(conversation_id: int, payload: MarketplaceMessageCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    conversation = db.query(MarketplaceConversation).filter(MarketplaceConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    is_buyer = conversation.buyer_id == current_user.id
    is_seller = conversation.seller_id == current_user.id

    if not is_buyer and not is_seller:
        raise HTTPException(status_code=403, detail="Access denied")

    message = MarketplaceMessage(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=payload.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == conversation.item_id).first()
    other_user_id = conversation.seller_id if is_buyer else conversation.buyer_id
    other_user = db.query(User).filter(User.id == other_user_id).first()

    background_tasks.add_task(
        send_message_notification,
        to_email=other_user.email,
        recipient_name=other_user.first_name,
        sender_name=f"{current_user.first_name} {current_user.last_name}",
        message_preview=payload.content,
        conversation_id=conversation.id,
        listing_title=item.title,
    )

    return MarketplaceMessageResponse.model_validate(message)

# Get my conversations
@marketplace_router.get("/conversations", response_model=list[MarketplaceConversationResponse])
def get_my_marketplace_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    conversations = db.query(MarketplaceConversation).filter(
        (MarketplaceConversation.buyer_id == current_user.id) |
        (MarketplaceConversation.seller_id == current_user.id)
    ).order_by(MarketplaceConversation.updated_at.desc()).all()

    result = []
    for conv in conversations:
        last_message = db.query(MarketplaceMessage).filter(MarketplaceMessage.conversation_id == conv.id).order_by(MarketplaceMessage.created_at.desc()).first()
        unread_count = db.query(func.count(MarketplaceMessage.id)).filter(
            and_(
                MarketplaceMessage.conversation_id == conv.id,
                MarketplaceMessage.sender_id != current_user.id,
                MarketplaceMessage.is_read == False,
            )
        ).scalar()

        item = db.query(MarketplaceItem).filter(MarketplaceItem.id == conv.item_id).first()
        buyer = db.query(User).filter(User.id == conv.buyer_id).first()
        seller = db.query(User).filter(User.id == conv.seller_id).first()

        result.append(
            MarketplaceConversationResponse(
                id=conv.id,
                item_id=conv.item_id,
                item_title=item.title,
                buyer_id=conv.buyer_id,
                buyer_name=f"{buyer.first_name} {buyer.last_name}",
                seller_id=conv.seller_id,
                seller_name=f"{seller.first_name} {seller.last_name}",
                last_message=MarketplaceMessageResponse.model_validate(last_message) if last_message else None,
                unread_count=unread_count,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
            )
        )

    return result

# Get conversation details
@marketplace_router.get("/conversations/{conversation_id}", response_model=MarketplaceConversationDetailResponse)
def get_marketplace_conversation(conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    conversation = db.query(MarketplaceConversation).filter(MarketplaceConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation.buyer_id != current_user.id and conversation.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Mark as read
    db.query(MarketplaceMessage).filter(
        and_(
            MarketplaceMessage.conversation_id == conversation_id,
            MarketplaceMessage.sender_id != current_user.id,
            MarketplaceMessage.is_read == False,
        )
    ).update({"is_read": True})
    db.commit()

    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == conversation.item_id).first()
    buyer = db.query(User).filter(User.id == conversation.buyer_id).first()
    seller = db.query(User).filter(User.id == conversation.seller_id).first()

    return MarketplaceConversationDetailResponse(
        id=conversation.id,
        item_id=conversation.item_id,
        item_title=item.title,
        buyer_id=conversation.buyer_id,
        buyer_name=f"{buyer.first_name} {buyer.last_name}",
        seller_id=conversation.seller_id,
        seller_name=f"{seller.first_name} {seller.last_name}",
        messages=[MarketplaceMessageResponse.model_validate(m) for m in conversation.messages],
    )

# Get Unread Count
@marketplace_router.get("/unread-count")
def get_marketplace_unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    conversation_ids = db.query(MarketplaceConversation.id).filter(
        (MarketplaceConversation.buyer_id == current_user.id) |
        (MarketplaceConversation.seller_id == current_user.id)
    ).all()
    ids = [c.id for c in conversation_ids]

    if not ids:
        return {"unread_count": 0}

    total = db.query(func.count(MarketplaceMessage.id)).filter(
        and_(
            MarketplaceMessage.conversation_id.in_(ids),
            MarketplaceMessage.sender_id != current_user.id,
            MarketplaceMessage.is_read == False,
        )
    ).scalar()

    return {"unread_count": total}