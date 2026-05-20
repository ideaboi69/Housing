from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import asyncio
from tables import get_db, RoommateGroup, RoommateGroupMember, GroupChatMessage, User, GroupChatReadState
from Schemas.groupChatSchema import *
from Utils.security import get_current_student
from Utils.websocket import connection_manager
from Utils.group_chat import build_message_response, get_active_member_or_404, broadcast_to_members

group_chat_router = APIRouter()

# Send a message
@group_chat_router.post("/groups/{group_id}/chat", response_model=GroupChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(group_id: int, payload: GroupChatMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    get_active_member_or_404(group_id, current_user.id, db)

    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(content) > 2000:
        raise HTTPException(status_code=400, detail="Message too long (max 2000 chars)")

    msg = GroupChatMessage(
        group_id=group_id,
        sender_id=current_user.id,
        content=content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    response = build_message_response(msg, db, current_user.id)

    # Broadcast to everyone (including sender — their other tabs need it)
    payload_dict = response.model_dump(mode="json")
    payload_dict["type"] = "group_chat:new"
    await broadcast_to_members(group_id, db, payload_dict)

    return response

# Edit a message (own only, within 5 min)
@group_chat_router.patch("/groups/{group_id}/chat/{message_id}", response_model=GroupChatMessageResponse)
async def edit_message(group_id: int, message_id: int, payload: GroupChatMessageUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    get_active_member_or_404(group_id, current_user.id, db)

    msg = db.query(GroupChatMessage).filter(GroupChatMessage.id == message_id, GroupChatMessage.group_id == group_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own messages")
    if msg.deleted_at:
        raise HTTPException(status_code=400, detail="Cannot edit a deleted message")

    # 5-minute edit window
    elapsed = (datetime.now(msg.created_at.tzinfo) - msg.created_at).total_seconds()
    if elapsed > 300:
        raise HTTPException(status_code=400, detail="Edit window has expired (5 minutes)")

    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(content) > 2000:
        raise HTTPException(status_code=400, detail="Message too long (max 2000 chars)")

    msg.content = content
    msg.edited_at = datetime.now(msg.created_at.tzinfo)
    db.commit()
    db.refresh(msg)

    response = build_message_response(msg, db, current_user.id)
    payload_dict = response.model_dump(mode="json")
    payload_dict["type"] = "group_chat:edit"
    await broadcast_to_members(group_id, db, payload_dict)

    return response

# Delete a message (own only)
@group_chat_router.delete("/groups/{group_id}/chat/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(group_id: int, message_id: int, db: Session = Depends(get_db),current_user: User = Depends(get_current_student)):
    get_active_member_or_404(group_id, current_user.id, db)

    msg = db.query(GroupChatMessage).filter(GroupChatMessage.id == message_id, GroupChatMessage.group_id == group_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    # Allow own-message delete OR group-owner delete
    group = db.query(RoommateGroup).filter(RoommateGroup.id == group_id).first()
    if msg.sender_id != current_user.id and group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")

    msg.deleted_at = datetime.now(msg.created_at.tzinfo)
    msg.is_pinned = False
    db.commit()

    payload_dict = {
        "type": "group_chat:delete",
        "message_id": message_id,
        "group_id": group_id,
    }
    await broadcast_to_members(group_id, db, payload_dict)

# Pin/unpin (owner only)
@group_chat_router.patch("/groups/{group_id}/chat/{message_id}/pin", response_model=GroupChatMessageResponse)
async def toggle_pin(group_id: int, message_id: int, db: Session = Depends(get_db),current_user: User = Depends(get_current_student)):
    group = db.query(RoommateGroup).filter(RoommateGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the group owner can pin messages")

    msg = db.query(GroupChatMessage).filter(GroupChatMessage.id == message_id, GroupChatMessage.group_id == group_id,).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.deleted_at:
        raise HTTPException(status_code=400, detail="Cannot pin a deleted message")

    msg.is_pinned = not msg.is_pinned
    db.commit()
    db.refresh(msg)

    response = build_message_response(msg, db, current_user.id)
    payload_dict = response.model_dump(mode="json")
    payload_dict["type"] = "group_chat:pin"
    await broadcast_to_members(group_id, db, payload_dict)

    return response

# History
@group_chat_router.get("/groups/{group_id}/chat", response_model=GroupChatHistoryResponse)
def get_chat_history(group_id: int, before_id: Optional[int] = Query(None, description="Get messages older than this ID for pagination"), limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    get_active_member_or_404(group_id, current_user.id, db)

    query = db.query(GroupChatMessage).filter(GroupChatMessage.group_id == group_id)
    if before_id:
        query = query.filter(GroupChatMessage.id < before_id)

    messages = query.order_by(GroupChatMessage.id.desc()).limit(limit + 1).all()
    has_more = len(messages) > limit
    messages = messages[:limit]
    messages.reverse()  

    # Pinned (always full set, separately)
    pinned = db.query(GroupChatMessage).filter(
        GroupChatMessage.group_id == group_id,
        GroupChatMessage.is_pinned == True,
        GroupChatMessage.deleted_at.is_(None),
    ).order_by(GroupChatMessage.created_at.desc()).all()

    return GroupChatHistoryResponse(
        messages=[build_message_response(m, db, current_user.id) for m in messages],
        pinned=[build_message_response(m, db, current_user.id) for m in pinned],
        has_more=has_more,
    )

# Typing indicator
@group_chat_router.post("/groups/{group_id}/chat/typing", status_code=status.HTTP_204_NO_CONTENT)
async def signal_typing(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    get_active_member_or_404(group_id, current_user.id, db)

    payload = {
        "type": "group_chat:typing",
        "group_id": group_id,
        "user_id": current_user.id,
        "user_name": current_user.first_name,
    }
    await broadcast_to_members(group_id, db, payload, exclude_user_id=current_user.id)

# Mark messages as read up to a given message id
@group_chat_router.post("/groups/{group_id}/chat/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(group_id: int, payload: GroupChatMarkReadRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    get_active_member_or_404(group_id, current_user.id, db)

    state = db.query(GroupChatReadState).filter(
        GroupChatReadState.group_id == group_id,
        GroupChatReadState.user_id == current_user.id,
    ).first()

    if state:
        if payload.last_read_message_id > state.last_read_message_id:
            state.last_read_message_id = payload.last_read_message_id
    else:
        state = GroupChatReadState(
            group_id=group_id,
            user_id=current_user.id,
            last_read_message_id=payload.last_read_message_id,
        )
        db.add(state)

    db.commit()

# Unread count for one specific group
@group_chat_router.get("/groups/{group_id}/chat/unread", response_model=GroupChatUnreadResponse)
def get_unread_count(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    get_active_member_or_404(group_id, current_user.id, db)

    state = db.query(GroupChatReadState).filter(
        GroupChatReadState.group_id == group_id,
        GroupChatReadState.user_id == current_user.id,
    ).first()
    last_read = state.last_read_message_id if state else 0

    count = db.query(GroupChatMessage).filter(
        GroupChatMessage.group_id == group_id,
        GroupChatMessage.id > last_read,
        GroupChatMessage.sender_id != current_user.id,  # don't count own messages
        GroupChatMessage.deleted_at.is_(None),
    ).count()

    return GroupChatUnreadResponse(group_id=group_id, unread_count=count)


# Total unread across all groups (for nav badge)
@group_chat_router.get("/chat/unread-all", response_model=list[GroupChatUnreadResponse])
def get_all_unread(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    
    memberships = db.query(RoommateGroupMember).filter(
        RoommateGroupMember.user_id == current_user.id,
        RoommateGroupMember.is_active == True,
    ).all()

    results = []
    for m in memberships:
        state = db.query(GroupChatReadState).filter(
            GroupChatReadState.group_id == m.group_id,
            GroupChatReadState.user_id == current_user.id,
        ).first()
        last_read = state.last_read_message_id if state else 0

        count = db.query(GroupChatMessage).filter(
            GroupChatMessage.group_id == m.group_id,
            GroupChatMessage.id > last_read,
            GroupChatMessage.sender_id != current_user.id,
            GroupChatMessage.deleted_at.is_(None),
        ).count()

        results.append(GroupChatUnreadResponse(group_id=m.group_id, unread_count=count))

    return results