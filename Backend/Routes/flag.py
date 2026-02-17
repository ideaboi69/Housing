from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from tables import get_db, User, Listing, Review, Flag
from Schemas.flagSchema import FlagCreate, FlagResponse, FlagStatus
from Utils.security import get_current_user

flag_router = APIRouter()

# Create flag (logged in only)
@flag_router.post("/", response_model=FlagResponse, status_code=status.HTTP_201_CREATED)
def create_flag(payload: FlagCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # must flag at least one thing
    if not payload.listing_id and not payload.review_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Must provide a listing_id or review_id to flag")

    # verify the target exists
    if payload.listing_id:
        listing = db.query(Listing).filter(Listing.id == payload.listing_id).first()
        if not listing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    if payload.review_id:
        review = db.query(Review).filter(Review.id == payload.review_id).first()
        if not review:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    # check for duplicate flag from same user on same target
    existing_query = db.query(Flag).filter(Flag.reporter_id == current_user.id)
    if payload.listing_id:
        existing_query = existing_query.filter(Flag.listing_id == payload.listing_id)
    if payload.review_id:
        existing_query = existing_query.filter(Flag.review_id == payload.review_id)

    existing = existing_query.first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already flagged this")

    flag = Flag(
        reporter_id=current_user.id,
        listing_id=payload.listing_id,
        review_id=payload.review_id,
        reason=payload.reason,
        status=FlagStatus.PENDING,
    )
    db.add(flag)
    db.commit()
    db.refresh(flag)

    return FlagResponse.model_validate(flag)

# My Flag (logged in only)
@flag_router.get("/me", response_model=list[FlagResponse])
def list_my_flags(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    flags = db.query(Flag).filter(
        Flag.reporter_id == current_user.id
    ).order_by(Flag.created_at.desc()).all()

    return [FlagResponse.model_validate(f) for f in flags]

# Get Single Flag (logged in, must own it)
@flag_router.get("/{flag_id}", response_model=FlagResponse)
def get_flag(flag_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    flag = db.query(Flag).filter(Flag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flag not found")
    if flag.reporter_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own flags")

    return FlagResponse.model_validate(flag)