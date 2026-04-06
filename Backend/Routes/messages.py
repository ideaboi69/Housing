from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from tables import Listing, Conversation, User, get_db, Landlord, Message, Property
from Schemas.convoSchema import SenderType
from Schemas.convoSchema import ConversationDetailResponse, StartConversation, MessageCreate, MessageResponse, ConversationResponse
from Utils.security import get_current_user
from helpers import require_landlord
from Utils.email import send_message_notification

message_router = APIRouter()

# User starting a conversation 
@message_router.post("/conversations", response_model=ConversationDetailResponse, status_code=status.HTTP_201_CREATED)
def start_conversation(payload: StartConversation, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    listing = db.query(Listing).filter(Listing.id == payload.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Property not found")

    # Get landlord through property
    property = db.query(Property).filter(Property.id == listing.property_id).first()
    landlord = db.query(Landlord).filter(Landlord.id == property.landlord_id).first()

    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")
    
    # Check if conversation already exists
    existing = db.query(Conversation).filter(
        Conversation.user_id == current_user.id,
        Conversation.landlord_id == landlord.id,
        Conversation.listing_id == payload.listing_id,
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Conversation already exists",
            headers={"X-Conversation-Id": str(existing.id)},
        )

    conversation = Conversation(
        user_id=current_user.id,
        landlord_id=property.landlord_id,
        listing_id=payload.listing_id,
    )
    db.add(conversation)
    db.flush()

    message = Message(
        conversation_id=conversation.id,
        sender_type=SenderType.STUDENT,
        sender_id=current_user.id,
        content=payload.content,
    )
    db.add(message)
    db.commit()
    db.refresh(conversation)

    # Email the landlord in the background
    landlord = db.query(Landlord).filter(Landlord.id == property.landlord_id).first()
    background_tasks.add_task(
        send_message_notification,
        to_email=landlord.email,
        recipient_name=landlord.first_name,
        sender_name=f"{current_user.first_name} {current_user.last_name}",
        message_preview=payload.content,
        conversation_id=conversation.id,
        listing_title=property.title,
    )

    return conversation

# Send a message in an existing conversation
@message_router.post("/conversations/{conversation_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message( conversation_id: int, payload: MessageCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Determine sender type and verify access
    if isinstance(current_user,Landlord) and conversation.landlord_id == current_user.id:
        sender_type = SenderType.LANDLORD
    elif conversation.user_id == current_user.id:
        sender_type = SenderType.STUDENT
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    message = Message(
        conversation_id=conversation.id,
        sender_type=sender_type,
        sender_id=current_user.id,
        content=payload.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    # Email the other party
    listing = db.query(Listing).filter(Listing.id == conversation.listing_id).first()
    property = db.query(Property).filter(Property.id == listing.property_id).first()

    if sender_type == SenderType.STUDENT:
        landlord = db.query(Landlord).filter(Landlord.id == conversation.landlord_id).first()
        background_tasks.add_task(
            send_message_notification,
            to_email=landlord.email,
            recipient_name=landlord.first_name,
            sender_name=f"{current_user.first_name} {current_user.last_name}",
            message_content=payload.content,
            listing_title=property.title,
            conversation_id=conversation.id,
        )
    else:
        user = db.query(User).filter(User.id == conversation.user_id).first()
        background_tasks.add_task(
            send_message_notification,
            to_email=user.email,
            recipient_name=user.first_name,
            sender_name=f"{current_user.first_name} {current_user.last_name}",
            message_content=payload.content,
            listing_title=property.title,
            conversation_id=conversation.id,
        )

    return message

# Landlord replies to a conversation
@message_router.post("/landlord/conversations/{conversation_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def landlord_reply(conversation_id: int, payload: MessageCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), landlord: Landlord = Depends(require_landlord)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id,Conversation.landlord_id == landlord.id).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    message = Message(
        conversation_id=conversation.id,
        sender_type=SenderType.LANDLORD,
        sender_id=landlord.id,
        content=payload.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    # Email the user
    user = db.query(User).filter(User.id == conversation.user_id).first()
    listing = db.query(Listing).filter(Listing.id == conversation.listing_id).first()
    property = db.query(Property).filter(Property.id == listing.property_id).first()

    background_tasks.add_task(
        send_message_notification,
        to_email=user.email,
        recipient_name=user.first_name,
        sender_name=f"{landlord.first_name} {landlord.last_name}",
        message_preview=payload.content,
        conversation_id=conversation.id,
        listing_title=property.title,
    )

    return message

# Get all conversations for a user
@message_router.get("/conversations", response_model=list[ConversationResponse])
def get_conversations( db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    
    conversations = db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc()).all()

    result = []
    for conv in conversations:
        last_message = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.desc()).first()

        unread_count = db.query(func.count(Message.id)).filter(
            and_(
                Message.conversation_id == conv.id,
                Message.sender_type == SenderType.LANDLORD,
                Message.is_read == False,
            )).scalar()

        listing = db.query(Listing).filter(Listing.id == conv.listing_id).first()
        property = db.query(Property).filter(Property.id == listing.property_id).first()
        landlord = db.query(Landlord).filter(Landlord.id == property.landlord_id).first()

        result.append(
            ConversationResponse(
                id=conv.id,
                listing_id=conv.listing_id,
                listing_title=property.title,
                user_id=conv.user_id,
                landlord_id=conv.landlord_id,
                landlord_name=f"{landlord.first_name} {landlord.last_name}",
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                last_message=MessageResponse.model_validate(last_message) if last_message else None,
                unread_count=unread_count,
            )
        )

    return result

# Get all conversations for a LANDLORD
@message_router.get("/landlord/conversations", response_model=list[ConversationResponse])
def get_landlord_conversations( db: Session = Depends(get_db), landlord: Landlord = Depends(require_landlord)):

    conversations = db.query(Conversation).filter(Conversation.landlord_id == landlord.id).order_by(Conversation.updated_at.desc()).all()

    result = []
    for conv in conversations:
        last_message = db.query(Message).filter( Message.conversation_id == conv.id).order_by(Message.created_at.desc()).first()

        unread_count = db.query(func.count(Message.id)).filter(
            and_(
                Message.conversation_id == conv.id,
                Message.sender_type == "user",
                Message.is_read == False,
            )).scalar()

        listing = db.query(Listing).filter(Listing.id == conv.listing_id).first()
        property = db.query(Property).filter(Property.id == listing.property_id).first()
        user = db.query(User).filter(User.id == conv.user_id).first()

        result.append(
            ConversationResponse(
                id=conv.id,
                listing_id=conv.listing_id,
                listing_title=property.title,
                user_id=conv.user_id,
                user_name=f"{user.first_name} {user.last_name}",
                landlord_id=conv.landlord_id,
                landlord_name=f"{landlord.first_name} {landlord.last_name}",
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                last_message=MessageResponse.model_validate(last_message) if last_message else None,
                unread_count=unread_count,
            )
        )

    return result

# Get a single conversation with all messages
@message_router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
def get_specific_conversation( conversation_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    is_user = conversation.user_id == current_user.id
    is_landlord = isinstance(current_user, Landlord) and conversation.landlord_id == current_user.id
    if not is_user and not is_landlord:
        raise HTTPException(status_code=403, detail="Access denied")

    # Mark unread messages as read for current viewer
    sender_type_to_mark = SenderType.LANDLORD if is_user else SenderType.STUDENT
    db.query(Message).filter(
        and_(
            Message.conversation_id == conversation_id,
            Message.sender_type == sender_type_to_mark,
            Message.is_read == False,
        )
    ).update({"is_read": True})
    db.commit()

    listing = db.query(Listing).filter(Listing.id == conversation.listing_id).first()
    property = db.query(Property).filter(Property.id == listing.property_id).first()
    landlord = db.query(Landlord).filter(Landlord.id == property.landlord_id).first()
    user = db.query(User).filter(User.id == conversation.user_id).first()

    return ConversationDetailResponse(
        id=conversation.id,
        listing_id=conversation.listing_id,
        listing_title=property.title,
        user_id=conversation.user_id,
        user_name=f"{user.first_name} {user.last_name}",
        landlord_id=conversation.landlord_id,
        landlord_name=f"{landlord.first_name} {landlord.last_name}",
        messages=[MessageResponse.model_validate(m) for m in conversation.messages],
    )
# Get unread count for a user 
@message_router.get("/unread-count")
def get_user_unread_count(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
  
    conversations = db.query(Conversation.id).filter(Conversation.user_id == current_user.id).all()
    conversation_ids = [c.id for c in conversations]

    if not conversation_ids:
        return {"unread_count": 0}

    total_unread = db.query(func.count(Message.id)).filter(
        and_(
            Message.conversation_id.in_(conversation_ids),
            Message.sender_type == SenderType.LANDLORD.value,
            Message.is_read == False,
        )).scalar()

    return {"unread_count": total_unread}

# Get unread count for a landlord
@message_router.get("/landlord/unread-count")
def get_landlord_unread_count(db: Session = Depends(get_db), landlord: Landlord = Depends(require_landlord)):
    
    conversations = db.query(Conversation.id).filter(Conversation.landlord_id == landlord.id).all()
    conversation_ids = [c.id for c in conversations]

    if not conversation_ids:
        return {"unread_count": 0}

    total_unread = db.query(func.count(Message.id)).filter(
        and_(
            Message.conversation_id.in_(conversation_ids),
            Message.sender_type == SenderType.STUDENT.value,
            Message.is_read == False,
        )).scalar()

    return {"unread_count": total_unread}

# Delete a single message (sender only)
@message_router.delete("/conversations/{conversation_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(conversation_id: int, message_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Verify access
    is_user = conversation.user_id == current_user.id
    is_landlord = isinstance(current_user, Landlord) and conversation.landlord_id == current_user.id
    if not is_user and not is_landlord:
        raise HTTPException(status_code=403, detail="Access denied")

    message = db.query(Message).filter(
        Message.id == message_id,
        Message.conversation_id == conversation_id,
        Message.sender_id == current_user.id,
    ).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found or you are not the sender")

    db.delete(message)
    db.commit()

# User deletes a conversation
@message_router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id,Conversation.user_id == current_user.id).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.query(Message).filter(Message.conversation_id == conversation.id).delete()
    db.delete(conversation)
    db.commit()

# Landlord deletes a conversation
@message_router.delete("/landlord/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def landlord_delete_conversation(conversation_id: int, db: Session = Depends(get_db), landlord: Landlord = Depends(require_landlord)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id,Conversation.landlord_id == landlord.id).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.query(Message).filter(Message.conversation_id == conversation.id).delete()
    db.delete(conversation)
    db.commit()