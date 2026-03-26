import httpx
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from tables import get_db, Writer
from Schemas.writerSchema import WriterRegister, WriterResponse, WriterTokenResponse, WriterStatus
from Utils.security import hash_password, verify_password, create_access_token, validate_password, get_current_writer
from Utils.rate_limit import limiter
from Utils.cloudinary import upload_image_to_cloudinary, delete_image_from_cloudinary
from config import settings

writer_router = APIRouter()

# Register as a writer
@writer_router.post("/register", response_model=WriterResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register_writer(request: Request, payload: WriterRegister, db: Session = Depends(get_db)):
    existing = db.query(Writer).filter(Writer.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    validate_password(payload.password)

    writer = Writer(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        business_name=payload.business_name,
        business_type=payload.business_type,
        website=payload.website,
        phone=payload.phone,
        reason=payload.reason,
        status=WriterStatus.PENDING,
    )
    db.add(writer)
    db.commit()
    db.refresh(writer)

    # Send to Formspree (your inbox)
    try:
        httpx.post(
            settings.FORMSPREE_ENDPOINT,
            json={
                "type": "Writer Application",
                "name": f"{payload.first_name} {payload.last_name}",
                "email": payload.email,
                "business_name": payload.business_name,
                "business_type": payload.business_type or "N/A",
                "website": payload.website or "N/A",
                "phone": payload.phone or "N/A",
                "reason": payload.reason,
            },
        )
    except Exception:
        pass 

    return WriterResponse.model_validate(writer)

# Writer Login
@writer_router.post("/login", response_model=WriterTokenResponse)
@limiter.limit("10/minute")
def writer_login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    writer = db.query(Writer).filter(Writer.email == form_data.username).first()

    if not writer or not verify_password(form_data.password, writer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if writer.status != WriterStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your application is still pending review.",
        )

    token = create_access_token({"user_id": writer.id, "role": "writer"})

    return WriterTokenResponse(
        access_token=token,
        writer=WriterResponse.model_validate(writer),
    )

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
 
# Upload profile photo (approved writers only)
@writer_router.post("/me/profile-photo", status_code=status.HTTP_200_OK)
async def upload_writer_profile_photo(file: UploadFile = File(...), db: Session = Depends(get_db), current_writer: Writer = Depends(get_current_writer)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image type. Allowed: JPEG, PNG, WebP")
 
    if current_writer.profile_photo_url:
        delete_image_from_cloudinary(current_writer.profile_photo_url)
 
    image_url = upload_image_to_cloudinary(file, folder=f"writers/{current_writer.id}")
    current_writer.profile_photo_url = image_url
    db.commit()
 
    return {"profile_photo_url": image_url}
 
# Delete profile photo
@writer_router.delete("/me/profile-photo", status_code=status.HTTP_200_OK)
def delete_writer_profile_photo(db: Session = Depends(get_db), current_writer: Writer = Depends(get_current_writer)):
    if not current_writer.profile_photo_url:
        raise HTTPException(status_code=400, detail="No profile photo to delete")
 
    delete_image_from_cloudinary(current_writer.profile_photo_url)
    current_writer.profile_photo_url = None
    db.commit()
 
    return {"message": "Profile photo removed"}