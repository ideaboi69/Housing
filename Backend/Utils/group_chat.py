from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from tables import RoommateGroupMember, GroupChatMessage, User
from Schemas.groupChatSchema import GroupChatMessageResponse
from Utils.websocket import connection_manager

def build_message_response(msg: GroupChatMessage, db: Session, viewer_id: int) -> GroupChatMessageResponse:
    sender = db.query(User).filter(User.id == msg.sender_id).first()
    if not sender:
        return GroupChatMessageResponse(
            id=msg.id,
            group_id=msg.group_id,
            sender_id=msg.sender_id,
            sender_name="Unknown",
            sender_initial="?",
            content=msg.content if not msg.deleted_at else "",
            is_pinned=msg.is_pinned,
            is_own=False,
            is_deleted=msg.deleted_at is not None,
            edited_at=msg.edited_at,
            created_at=msg.created_at,
        )

    return GroupChatMessageResponse(
        id=msg.id,
        group_id=msg.group_id,
        sender_id=msg.sender_id,
        sender_name=f"{sender.first_name} {sender.last_name[0]}." if sender.last_name else sender.first_name,
        sender_initial=sender.first_name[0].upper() if sender.first_name else "?",
        sender_photo_url=sender.profile_photo_url,
        content="" if msg.deleted_at else msg.content,
        is_pinned=msg.is_pinned,
        is_own=(msg.sender_id == viewer_id),
        is_deleted=msg.deleted_at is not None,
        edited_at=msg.edited_at,
        created_at=msg.created_at,
    )

def get_active_member_or_404(group_id: int, user_id: int, db: Session) -> RoommateGroupMember:
    member = db.query(RoommateGroupMember).filter(
        RoommateGroupMember.group_id == group_id,
        RoommateGroupMember.user_id == user_id,
        RoommateGroupMember.is_active == True,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    return member

async def broadcast_to_members(group_id: int, db: Session, payload: dict, exclude_user_id: Optional[int] = None):
    """Send a payload to all active members' WS connections."""
    members = db.query(RoommateGroupMember).filter(RoommateGroupMember.group_id == group_id, RoommateGroupMember.is_active == True).all()
    for m in members:
        if exclude_user_id and m.user_id == exclude_user_id:
            continue
        try:
            await connection_manager.send_to_user("student", m.user_id, payload)
        except Exception:
            pass