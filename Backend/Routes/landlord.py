from fastapi import APIRouter, Depends, HTTPException, status, File, Form, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from tables import get_db, User, Landlord, Property, Listing, ListingImage, Review, Flag, SavedListing, HousingHealthScore, LandlordDocuments
from Schemas.landlordSchema import LandlordLogin, LandlordUpdate, LandlordResponse, LandlordPublicResponse, LandlordPropertyResponse, LandlordReviewResponse, PropertyRange, IDType, DocumentType, LandlordVerification, LandlordTokenResponse
from Schemas.userSchema import UserRole, TokenResponse
from Utils.security import get_current_user, hash_password, verify_password, create_access_token
from Utils.textract import extract_document_data
from Utils.verification import compare_landlord_data
from helpers import require_landlord, get_landlord_profile, compute_landlord_stats, upload_to_s3, BUCKET_NAME
from typing import Optional
from pydantic import EmailStr
import uuid
import json

landlord_router = APIRouter()

# Register a Landlord Profile
@landlord_router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_landlord(email: EmailStr = Form(...), password: str = Form(...), first_name: str = Form(...), last_name: str = Form(...), phone: str = Form(...), no_of_property: PropertyRange = Form(...), 
                    id_type: IDType = Form(...), document_type: DocumentType = Form(...), company_name: Optional[str] = Form(None), id_file: UploadFile = File(...), document_file: UploadFile = File(...), db: Session = Depends(get_db)):
    
    existing = db.query(Landlord).filter(Landlord.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    try:
        landlord = Landlord(
            email=email,
            password_hash=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            no_of_property=no_of_property,
            company_name=company_name,
            identity_verified=False
        )
        db.add(landlord)
        db.flush()

        id_filepath, id_url = upload_to_s3(id_file, landlord.id, "government_id")
        doc_filepath, doc_url = upload_to_s3(document_file, landlord.id, "proof_of_ownership")

        id_extracted = extract_document_data(BUCKET_NAME, id_filepath)
        verification_result = compare_landlord_data(id_extracted, landlord)

        status_map = {
            "verified": LandlordVerification.VERIFIED,
            "failed": LandlordVerification.REJECTED,
            "needs_review": LandlordVerification.PENDING,
        }
        verification_status = status_map[verification_result["overall_status"]]

        if verification_status == LandlordVerification.VERIFIED:
            landlord.identity_verified = True

        landlord_document = LandlordDocuments(
            landlord_id=landlord.id,
            id_type=id_type,
            document_type=document_type,
            id_filepath=id_filepath,
            id_url=id_url,
            document_filepath=doc_filepath,
            document_url=doc_url,
            extracted_data=json.dumps({
                "id_document": id_extracted,
                "verification_result": verification_result,
            }),
            verification_status=verification_status,
        )
        db.add(landlord_document)
        db.commit()
        db.refresh(landlord)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

    token = create_access_token({"user_id": landlord.id, "role": landlord.role.value, "verified": verification_status == LandlordVerification.VERIFIED})

    return LandlordTokenResponse(
        access_token=token,
        landlord=LandlordResponse.model_validate(landlord),
    )

# Landlord Login
@landlord_router.post("/login", response_model=LandlordTokenResponse)
def login_landlord(payload: LandlordLogin, db: Session = Depends(get_db)):
    landlord = db.query(Landlord).filter(Landlord.email == payload.email).first()

    if not landlord or not verify_password(payload.password, landlord.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({
        "user_id": landlord.id,
        "role": "landlord",
        "verified": landlord.identity_verified,
    })

    return LandlordTokenResponse(
        access_token=token,
        landlord=LandlordResponse.model_validate(landlord),
    )

# Private Landlord Profile
@landlord_router.get("/me", response_model=LandlordResponse)
def view_my_landlord_profile(db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_profile(current_user, db)
    return LandlordResponse.model_validate(landlord)

@landlord_router.patch("/me", response_model=LandlordResponse)
def update_my_landlord_profile(payload: LandlordUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    landlord = get_landlord_profile(current_user, db)

    if payload.company_name is not None:
        landlord.company_name = payload.company_name
    if payload.phone is not None:
        landlord.phone = payload.phone

    db.commit()
    db.refresh(landlord)

    return LandlordResponse.model_validate(landlord)

@landlord_router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_landlord_profile(db: Session = Depends(get_db), current_user: User = Depends(require_landlord)):
    """Delete landlord profile and cascade delete all properties, listings, etc. User account reverts to student."""
    landlord = get_landlord_profile(current_user, db)

    # cascade delete: properties → listings → images, scores, saves, flags
    properties = db.query(Property).filter(Property.landlord_id == landlord.id).all()

    for prop in properties:
        listings = db.query(Listing).filter(Listing.property_id == prop.id).all()

        for listing in listings:
            db.query(ListingImage).filter(ListingImage.listing_id == listing.id).delete()
            db.query(HousingHealthScore).filter(HousingHealthScore.listing_id == listing.id).delete()
            db.query(SavedListing).filter(SavedListing.listing_id == listing.id).delete()
            db.query(Flag).filter(Flag.listing_id == listing.id).delete()
            db.delete(listing)

        db.query(Review).filter(Review.property_id == prop.id).delete()
        db.delete(prop)

    db.query(Review).filter(Review.landlord_id == landlord.id).delete()
    db.delete(landlord)

    db.commit()

    return {"message": "Landlord Account Deleted Successfully."}

# Public Landlord Profiles
@landlord_router.get("/{landlord_id}", response_model=LandlordPublicResponse)
def get_landlord_public_profile(landlord_id: int, db: Session = Depends(get_db)):
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord not found")

    stats = compute_landlord_stats(landlord.id, db)

    return LandlordPublicResponse(
        id=landlord.id,
        first_name=landlord.first_name,
        last_name=landlord.last_name,
        email=landlord.email,
        company_name=landlord.company_name,
        phone=landlord.phone,
        identity_verified=landlord.identity_verified,
        **stats,
    )

@landlord_router.get("/{landlord_id}/properties", response_model=list[LandlordPropertyResponse])
def get_landlord_properties(landlord_id: int, db: Session = Depends(get_db)):
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord not found")

    properties = db.query(Property).filter(Property.landlord_id == landlord_id).all()
    return [LandlordPropertyResponse.model_validate(p) for p in properties]

@landlord_router.get("/{landlord_id}/reviews", response_model=list[LandlordReviewResponse])
def get_landlord_reviews(landlord_id: int, db: Session = Depends(get_db)):
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Landlord not found")

    reviews = db.query(Review).filter(Review.landlord_id == landlord_id).all()
    return [LandlordReviewResponse.model_validate(r) for r in reviews]

