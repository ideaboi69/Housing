from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from tables import get_db, User, Listing, Review, Flag, MarketplaceItem, Sublet
from Schemas.flagSchema import FlagCreate, FlagResponse, FlagStatus
from Utils.security import get_current_user, get_current_student

flag_router = APIRouter()

# Create flag (logged in only)
@flag_router.post("/", response_model=FlagResponse, status_code=status.HTTP_201_CREATED)
def create_flag(payload: FlagCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    # Validation is handled by the schema's model_validator (exactly one target required)
 
    # Verify the target exists
    if payload.listing_id:
        if not db.query(Listing).filter(Listing.id == payload.listing_id).first():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
 
    if payload.review_id:
        if not db.query(Review).filter(Review.id == payload.review_id).first():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
 
    if payload.marketplace_item_id:
        if not db.query(MarketplaceItem).filter(MarketplaceItem.id == payload.marketplace_item_id).first():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marketplace item not found")
 
    if payload.sublet_id:
        if not db.query(Sublet).filter(Sublet.id == payload.sublet_id).first():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sublet not found")
 
    # Check for duplicate flag from same user on same target
    existing_query = db.query(Flag).filter(Flag.reporter_id == current_user.id)
    if payload.listing_id:
        existing_query = existing_query.filter(Flag.listing_id == payload.listing_id)
    if payload.review_id:
        existing_query = existing_query.filter(Flag.review_id == payload.review_id)
    if payload.marketplace_item_id:
        existing_query = existing_query.filter(Flag.marketplace_item_id == payload.marketplace_item_id)
    if payload.sublet_id:
        existing_query = existing_query.filter(Flag.sublet_id == payload.sublet_id)
 
    if existing_query.first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already flagged this")
 
    flag = Flag(
        reporter_id=current_user.id,
        listing_id=payload.listing_id,
        review_id=payload.review_id,
        marketplace_item_id=payload.marketplace_item_id,
        sublet_id=payload.sublet_id,
        reason=payload.reason,
        status=FlagStatus.PENDING,
    )
    db.add(flag)
    db.commit()
    db.refresh(flag)
 
    return FlagResponse.model_validate(flag)

# My Flag (logged in only)
@flag_router.get("/me", response_model=list[FlagResponse])
def list_my_flags(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    flags = db.query(Flag).filter(
        Flag.reporter_id == current_user.id
    ).order_by(Flag.created_at.desc()).all()

    return [FlagResponse.model_validate(f) for f in flags]

# Get Single Flag (logged in, must own it)
@flag_router.get("/{flag_id}", response_model=FlagResponse)
def get_flag(flag_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    flag = db.query(Flag).filter(Flag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flag not found")
    if flag.reporter_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own flags")

    return FlagResponse.model_validate(flag)