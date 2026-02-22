import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from tables import get_db, Writer
from Schemas.writerSchema import WriterRegister, WriterResponse, WriterTokenResponse, WriterStatus
from Utils.security import hash_password, verify_password, create_access_token, decode_access_token
from config import settings

writer_router = APIRouter()

# Register as a writer
@writer_router.post("/register", response_model=WriterResponse, status_code=status.HTTP_201_CREATED)
def register_writer(payload: WriterRegister, db: Session = Depends(get_db)):
    existing = db.query(Writer).filter(Writer.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

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
def writer_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
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