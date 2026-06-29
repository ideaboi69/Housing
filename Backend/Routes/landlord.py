from fastapi import APIRouter, Depends, HTTPException, status, File, Form, UploadFile, Request, BackgroundTasks
import secrets
from datetime import datetime
from config import settings
from Utils.email import send_org_invite_email
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from tables import get_db, User, Landlord, LandlordOrg, LandlordOrgInvite, Property, Listing, ListingImage, Review, Flag, SavedListing, HousingHealthScore, LandlordDocuments, LandlordNotificationPreferences
from Schemas.landlordSchema import LandlordLogin, LandlordUpdate, LandlordResponse, LandlordPublicResponse, LandlordPropertyResponse, LandlordReviewResponse, LandlordFlagResponse, PropertyRange, IDType, DocumentType, LandlordVerification, LandlordTokenResponse, LandlordNotificationPreferencesUpdate, LandlordNotificationPreferencesResponse
from Schemas.userSchema import UserRole, TokenResponse
from Utils.security import get_current_landlord, hash_password, verify_password, create_access_token, validate_password, create_refresh_token_for_user, revoke_all_refresh_tokens
from Utils.textract import extract_document_data
from Utils.verification import compare_landlord_data
from helpers import require_landlord, get_landlord_profile, compute_landlord_stats, upload_to_s3, BUCKET_NAME, log_security_event
from Schemas.authSchema import SecurityEventType, SecurityEventResponse
from typing import Optional
from pydantic import EmailStr, BaseModel
from Utils.rate_limit import limiter
from Utils.cloudinary import upload_image_to_cloudinary, delete_image_from_cloudinary
from Utils.turnstile import verify_turnstile
import uuid
import json

# The first N landlords to register earn the founding-landlord badge (is_early_adopter).
# Adjust this number to change how many founding spots exist.
FOUNDING_LANDLORD_CAP = 50

landlord_router = APIRouter()

# Register a Landlord Profile
@landlord_router.post("/register", response_model=LandlordTokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register_landlord(request: Request, email: EmailStr = Form(...), password: str = Form(...), first_name: str = Form(...), last_name: str = Form(...), phone: str = Form(...), no_of_property: PropertyRange = Form(...), 
                    id_type: IDType = Form(...), document_type: DocumentType = Form(...), company_name: Optional[str] = Form(None), id_file: UploadFile = File(...), document_file: UploadFile = File(...), turnstile_token: Optional[str] = Form(None), db: Session = Depends(get_db)):
    verify_turnstile(turnstile_token, request.client.host if request.client else None)
    existing = db.query(Landlord).filter(Landlord.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    validate_password(password)
    # Founding-landlord badge: auto-granted to the first FOUNDING_LANDLORD_CAP landlords.
    is_founding = db.query(Landlord).count() < FOUNDING_LANDLORD_CAP
    try:
        landlord = Landlord(
            email=email,
            password_hash=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            no_of_property=no_of_property,
            company_name=company_name,
            identity_verified=False,
            is_early_adopter=is_founding,
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

    token = create_access_token({"user_id": landlord.id, "role": landlord.role.value, "verified": verification_status == LandlordVerification.VERIFIED, "tv": landlord.token_version})
    refresh_token = create_refresh_token_for_user(landlord.id, landlord.role.value, db)
    log_security_event(db, landlord.id, landlord.role.value, SecurityEventType.ACCOUNT_CREATED, request)
    db.commit()

    return LandlordTokenResponse(
        access_token=token,
        refresh_token=refresh_token,
        landlord=LandlordResponse.model_validate(landlord),
    )

# Landlord Login
@landlord_router.post("/login")
@limiter.limit("10/minute")
def login_landlord(request: Request, payload: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    landlord = db.query(Landlord).filter(Landlord.email == payload.username).first()

    if not landlord or not verify_password(payload.password, landlord.password_hash):
        if landlord:
            log_security_event(db, landlord.id, landlord.role.value, SecurityEventType.SIGN_IN_FAILED, request)
            db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password", headers={"WWW-Authenticate": "Bearer"})

    token = create_access_token({"user_id": landlord.id, "role": landlord.role.value, "verified": landlord.identity_verified, "tv": landlord.token_version})
    refresh_token = create_refresh_token_for_user(landlord.id, landlord.role.value, db)
    log_security_event(db, landlord.id, landlord.role.value, SecurityEventType.SIGN_IN, request)
    db.commit()

    return {
        "access_token": token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "landlord": {
            "id": landlord.id,
            "email": landlord.email,
            "first_name": landlord.first_name,
            "last_name": landlord.last_name,
            "identity_verified": landlord.identity_verified,
            "company_name": landlord.company_name,
            "phone": landlord.phone,
    },
    }

@landlord_router.post("/me/logout-all", status_code=status.HTTP_200_OK)
def logout_all_landlord_sessions(request: Request, db: Session = Depends(get_db), current_landlord: Landlord = Depends(get_current_landlord)):
    current_landlord.token_version = (current_landlord.token_version or 0) + 1
    revoke_all_refresh_tokens(current_landlord.id, current_landlord.role.value, db)
    log_security_event(db, current_landlord.id, current_landlord.role.value, SecurityEventType.SIGN_OUT_ALL, request)
    db.commit()
    return {"message": "Signed out of all sessions."}

# Security event log
@landlord_router.get("/me/security-log", response_model=list[SecurityEventResponse])
def get_landlord_security_log(limit: int = 50, offset: int = 0, db: Session = Depends(get_db), current_landlord: Landlord = Depends(get_current_landlord)):
    from tables import SecurityEvent
    events = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.user_id == current_landlord.id, SecurityEvent.role == current_landlord.role.value)
        .order_by(SecurityEvent.created_at.desc())
        .offset(offset)
        .limit(min(limit, 100))
        .all()
    )
    return [
        SecurityEventResponse(
            id=e.id, event_type=e.event_type, ip_address=e.ip_address,
            user_agent=e.user_agent, metadata=e.metadata_, created_at=e.created_at,
        )
        for e in events
    ]

# Private Landlord Profile
@landlord_router.get("/me", response_model=LandlordResponse)
def view_my_landlord_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_landlord)):
    landlord = get_landlord_profile(current_user, db)
    return LandlordResponse.model_validate(landlord)

@landlord_router.patch("/me", response_model=LandlordResponse)
def update_my_landlord_profile(payload: LandlordUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_landlord)):
    landlord = get_landlord_profile(current_user, db)

    if payload.first_name is not None:
        landlord.first_name = payload.first_name
    if payload.last_name is not None:
        landlord.last_name = payload.last_name
    if payload.email is not None:
        landlord.email = payload.email
    if payload.company_name is not None:
        landlord.company_name = payload.company_name
    if payload.phone is not None:
        landlord.phone = payload.phone

    db.commit()
    db.refresh(landlord)

    return LandlordResponse.model_validate(landlord)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
 
# Upload profile photo
@landlord_router.post("/me/profile-photo", status_code=status.HTTP_200_OK)
async def upload_landlord_profile_photo(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_landlord)):
    landlord = get_landlord_profile(current_user, db)
 
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image type. Allowed: JPEG, PNG, WebP")
 
    if landlord.profile_photo_url:
        delete_image_from_cloudinary(landlord.profile_photo_url)
 
    image_url = upload_image_to_cloudinary(file, folder=f"landlords/{landlord.id}")
    landlord.profile_photo_url = image_url
    db.commit()
 
    return {"profile_photo_url": image_url}
 
# Delete profile photo
@landlord_router.delete("/me/profile-photo", status_code=status.HTTP_200_OK)
def delete_landlord_profile_photo(db: Session = Depends(get_db), current_user: User = Depends(get_current_landlord)):
    landlord = get_landlord_profile(current_user, db)
 
    if not landlord.profile_photo_url:
        raise HTTPException(status_code=400, detail="No profile photo to delete")
 
    delete_image_from_cloudinary(landlord.profile_photo_url)
    landlord.profile_photo_url = None
    db.commit()
 
    return {"message": "Profile photo removed"}

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

@landlord_router.get("/me/flags", response_model=list[LandlordFlagResponse])
def get_my_listing_flags(current_landlord: Landlord = Depends(get_current_landlord), db: Session = Depends(get_db)):
    rows = (
        db.query(Flag, Listing, Property)
        .join(Listing, Flag.listing_id == Listing.id)
        .join(Property, Listing.property_id == Property.id)
        .filter(Property.landlord_id == current_landlord.id)
        .order_by(Flag.created_at.desc())
        .all()
    )

    return [
        LandlordFlagResponse(
            id=flag.id,
            listing_id=listing.id,
            property_id=property.id,
            property_title=property.title,
            property_address=property.address,
            reason=flag.reason,
            status=flag.status.value if hasattr(flag.status, "value") else str(flag.status),
            created_at=flag.created_at,
        )
        for flag, listing, property in rows
    ]

# Get landlord notification preferences
@landlord_router.get("/me/notifications", response_model=LandlordNotificationPreferencesResponse)
def get_landlord_notifications(db: Session = Depends(get_db), current_landlord: Landlord = Depends(get_current_landlord)):
    prefs = db.query(LandlordNotificationPreferences).filter(LandlordNotificationPreferences.landlord_id == current_landlord.id).first()

    if not prefs:
        prefs = LandlordNotificationPreferences(landlord_id=current_landlord.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)

    return LandlordNotificationPreferencesResponse.model_validate(prefs)

# Update landlord notification preferences
@landlord_router.patch("/me/notifications", response_model=LandlordNotificationPreferencesResponse)
def update_landlord_notifications(payload: LandlordNotificationPreferencesUpdate, db: Session = Depends(get_db), current_landlord: Landlord = Depends(get_current_landlord)):
    prefs = db.query(LandlordNotificationPreferences).filter(LandlordNotificationPreferences.landlord_id == current_landlord.id).first()

    if not prefs:
        prefs = LandlordNotificationPreferences(landlord_id=current_landlord.id)
        db.add(prefs)
        db.flush()

    if payload.notify_new_messages is not None:
        prefs.notify_new_messages = payload.notify_new_messages
    if payload.notify_new_reviews is not None:
        prefs.notify_new_reviews = payload.notify_new_reviews
    if payload.notify_new_flags is not None:
        prefs.notify_new_flags = payload.notify_new_flags

    db.commit()
    db.refresh(prefs)

    return LandlordNotificationPreferencesResponse.model_validate(prefs)


# ════════════════════════════════════════════════════════════
# Property-management teams (orgs) — multiple agents, one inbox
# ════════════════════════════════════════════════════════════

class OrgCreate(BaseModel):
    name: str

class OrgMemberAdd(BaseModel):
    email: EmailStr

class OrgMemberResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    org_role: Optional[str] = None
    identity_verified: bool

    class Config:
        from_attributes = True

class OrgResponse(BaseModel):
    id: int
    name: str
    members: list[OrgMemberResponse]


def _org_response(org_id: int, db: Session) -> OrgResponse:
    org = db.query(LandlordOrg).filter(LandlordOrg.id == org_id).first()
    members = db.query(Landlord).filter(Landlord.org_id == org_id).order_by(Landlord.org_role.desc(), Landlord.id).all()
    return OrgResponse(
        id=org.id,
        name=org.name,
        members=[OrgMemberResponse.model_validate(m) for m in members],
    )


@landlord_router.post("/org", response_model=OrgResponse, status_code=status.HTTP_201_CREATED)
def create_org(payload: OrgCreate, db: Session = Depends(get_db), current_landlord: Landlord = Depends(get_current_landlord)):
    if current_landlord.org_id:
        raise HTTPException(status_code=400, detail="You're already part of a team")
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Team name is required")
    org = LandlordOrg(name=name)
    db.add(org)
    db.flush()  # assign org.id
    current_landlord.org_id = org.id
    current_landlord.org_role = "owner"
    db.commit()
    return _org_response(org.id, db)


@landlord_router.get("/org", response_model=Optional[OrgResponse])
def get_my_org(db: Session = Depends(get_db), current_landlord: Landlord = Depends(get_current_landlord)):
    if not current_landlord.org_id:
        return None
    return _org_response(current_landlord.org_id, db)


@landlord_router.post("/org/members", response_model=OrgResponse)
def add_org_member(payload: OrgMemberAdd, db: Session = Depends(get_db), current_landlord: Landlord = Depends(get_current_landlord)):
    if not current_landlord.org_id or current_landlord.org_role != "owner":
        raise HTTPException(status_code=403, detail="Only the team owner can add agents")
    target = db.query(Landlord).filter(Landlord.email == payload.email).first()
    if not target:
        raise HTTPException(status_code=404, detail="No landlord account with that email. Ask them to sign up first.")
    if target.id == current_landlord.id:
        raise HTTPException(status_code=400, detail="You're already in the team")
    if target.org_id and target.org_id != current_landlord.org_id:
        raise HTTPException(status_code=400, detail="That landlord already belongs to another team")
    target.org_id = current_landlord.org_id
    target.org_role = target.org_role or "agent"
    db.commit()
    return _org_response(current_landlord.org_id, db)


@landlord_router.delete("/org/members/{landlord_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_org_member(landlord_id: int, db: Session = Depends(get_db), current_landlord: Landlord = Depends(get_current_landlord)):
    if not current_landlord.org_id or current_landlord.org_role != "owner":
        raise HTTPException(status_code=403, detail="Only the team owner can remove agents")
    if landlord_id == current_landlord.id:
        raise HTTPException(status_code=400, detail="The owner can't be removed from the team")
    target = db.query(Landlord).filter(Landlord.id == landlord_id, Landlord.org_id == current_landlord.org_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    target.org_id = None
    target.org_role = None
    db.commit()


# ── Email invites to join a team ──

class OrgInviteCreate(BaseModel):
    email: EmailStr

class OrgInviteResponse(BaseModel):
    id: int
    email: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrgInvitePreview(BaseModel):
    org_name: str
    inviter_name: str
    email: str
    status: str


@landlord_router.post("/org/invites", response_model=OrgInviteResponse, status_code=status.HTTP_201_CREATED)
def create_org_invite(payload: OrgInviteCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_landlord: Landlord = Depends(get_current_landlord)):
    if not current_landlord.org_id or current_landlord.org_role != "owner":
        raise HTTPException(status_code=403, detail="Only the team owner can invite agents")
    already = db.query(Landlord).filter(Landlord.email == payload.email, Landlord.org_id == current_landlord.org_id).first()
    if already:
        raise HTTPException(status_code=400, detail="That person is already on your team")

    token = secrets.token_urlsafe(32)
    # Refresh an existing pending invite for the same email rather than piling up rows.
    invite = db.query(LandlordOrgInvite).filter(
        LandlordOrgInvite.org_id == current_landlord.org_id,
        LandlordOrgInvite.email == payload.email,
        LandlordOrgInvite.status == "pending",
    ).first()
    if invite:
        invite.token = token
    else:
        invite = LandlordOrgInvite(org_id=current_landlord.org_id, email=payload.email, token=token, invited_by=current_landlord.id, status="pending")
        db.add(invite)
    db.commit()
    db.refresh(invite)

    org = db.query(LandlordOrg).filter(LandlordOrg.id == current_landlord.org_id).first()
    invite_url = f"{settings.FRONTEND_URL}/landlord/join-team/{token}"
    background_tasks.add_task(
        send_org_invite_email,
        payload.email,
        org.name,
        f"{current_landlord.first_name} {current_landlord.last_name}",
        invite_url,
    )
    return invite


@landlord_router.get("/org/invites", response_model=list[OrgInviteResponse])
def list_org_invites(db: Session = Depends(get_db), current_landlord: Landlord = Depends(get_current_landlord)):
    if not current_landlord.org_id or current_landlord.org_role != "owner":
        raise HTTPException(status_code=403, detail="Only the team owner can view invites")
    return db.query(LandlordOrgInvite).filter(
        LandlordOrgInvite.org_id == current_landlord.org_id,
        LandlordOrgInvite.status == "pending",
    ).order_by(LandlordOrgInvite.created_at.desc()).all()


@landlord_router.delete("/org/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_org_invite(invite_id: int, db: Session = Depends(get_db), current_landlord: Landlord = Depends(get_current_landlord)):
    if not current_landlord.org_id or current_landlord.org_role != "owner":
        raise HTTPException(status_code=403, detail="Only the team owner can cancel invites")
    invite = db.query(LandlordOrgInvite).filter(LandlordOrgInvite.id == invite_id, LandlordOrgInvite.org_id == current_landlord.org_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    invite.status = "cancelled"
    db.commit()


@landlord_router.get("/org/invites/{token}/preview", response_model=OrgInvitePreview)
def preview_org_invite(token: str, db: Session = Depends(get_db)):
    """Public — lets the join-team landing page show who invited you."""
    invite = db.query(LandlordOrgInvite).filter(LandlordOrgInvite.token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    org = db.query(LandlordOrg).filter(LandlordOrg.id == invite.org_id).first()
    inviter = db.query(Landlord).filter(Landlord.id == invite.invited_by).first()
    return OrgInvitePreview(
        org_name=org.name if org else "a team",
        inviter_name=f"{inviter.first_name} {inviter.last_name}" if inviter else "A landlord",
        email=invite.email,
        status=invite.status,
    )


@landlord_router.post("/org/invites/{token}/accept", response_model=OrgResponse)
def accept_org_invite(token: str, db: Session = Depends(get_db), current_landlord: Landlord = Depends(get_current_landlord)):
    invite = db.query(LandlordOrgInvite).filter(LandlordOrgInvite.token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="This invite is no longer valid")
    if current_landlord.org_id and current_landlord.org_id != invite.org_id:
        raise HTTPException(status_code=400, detail="You already belong to another team")
    current_landlord.org_id = invite.org_id
    current_landlord.org_role = current_landlord.org_role or "agent"
    invite.status = "accepted"
    invite.accepted_by = current_landlord.id
    invite.accepted_at = sql_func.now()
    db.commit()
    return _org_response(invite.org_id, db)
