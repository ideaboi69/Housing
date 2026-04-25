from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from tables import get_db, User, Landlord, Property, Listing, Review, Flag, HousingHealthScore
from Schemas.reviewSchema import ReviewCreate, ReviewUpdate, ReviewResponse
from Utils.security import get_current_user, get_current_student
from helpers import require_verified_student
import logging

review_router = APIRouter()
logger = logging.getLogger(__name__)

# CREATE REVIEW (verified students only)
@review_router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(require_verified_student)):
    # verify property exists
    prop = db.query(Property).filter(Property.id == payload.property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    # check for duplicate review
    existing = db.query(Review).filter(
        Review.student_id == current_user.id,
        Review.property_id == payload.property_id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already reviewed this property")

    review = Review(
        student_id=current_user.id,
        property_id=payload.property_id,
        landlord_id=prop.landlord_id,
        responsiveness=payload.responsiveness,
        maintenance_speed=payload.maintenance_speed,
        respect_privacy=payload.respect_privacy,
        fairness_of_charges=payload.fairness_of_charges,
        would_rent_again=payload.would_rent_again,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    try:
        from Routes.healthscore import compute_and_save
        listings = db.query(Listing).join(Property).filter(Property.landlord_id == prop.landlord_id).all()
        for listing in listings:
            try:
                compute_and_save(listing.id, db)
            except Exception:
                pass
    except Exception as e:
        logger.warning(f"Failed to recalculate Cribb Scores after review: {e}")

    return ReviewResponse.model_validate(review)

# Browse Reviews (public)
@review_router.get("/", response_model=list[ReviewResponse])
def list_reviews(db: Session = Depends(get_db), property_id: Optional[int] = Query(None), landlord_id: Optional[int] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100)):
    query = db.query(Review)

    if property_id:
        query = query.filter(Review.property_id == property_id)
    if landlord_id:
        query = query.filter(Review.landlord_id == landlord_id)

    reviews = query.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    return [ReviewResponse.model_validate(r) for r in reviews]

@review_router.get("/{review_id}", response_model=ReviewResponse)
def get_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    return ReviewResponse.model_validate(review)

# My Reviews (student views their own)
@review_router.get("/me/all", response_model=list[ReviewResponse])
def list_my_reviews(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    reviews = db.query(Review).filter(Review.student_id == current_user.id).all()
    return [ReviewResponse.model_validate(r) for r in reviews]

# Update Reviews (student only, must own it)
@review_router.patch("/{review_id}", response_model=ReviewResponse)
def update_review(review_id: int, payload: ReviewUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own reviews")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)

    db.commit()
    db.refresh(review)

    return ReviewResponse.model_validate(review)

# Delete reviews (student only, must own it)
@review_router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own reviews")

    db.query(Flag).filter(Flag.review_id == review.id).delete()
    db.delete(review)
    db.commit()

    return None