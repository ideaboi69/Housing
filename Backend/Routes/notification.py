from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from tables import get_db, Notification, User
from Utils.security import get_current_student

notification_router = APIRouter()


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    body: Optional[str] = None
    link: Optional[str] = None
    actor_name: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


@notification_router.get("", response_model=list[NotificationResponse])
@notification_router.get("/", response_model=list[NotificationResponse])
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )


@notification_router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    count = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).scalar()
    return {"unread_count": count or 0}


@notification_router.post("/read-all", status_code=status.HTTP_200_OK)
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked read"}


@notification_router.post("/{notification_id}/read", status_code=status.HTTP_200_OK)
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    n = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"message": "Notification marked read"}
