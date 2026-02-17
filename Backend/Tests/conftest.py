import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from tables import Base, get_db, User, Landlord, Property, Listing, ListingImage, Review, Flag, SavedListing, HousingHealthScore
from Routes.user import user_router
from Routes.landlord import landlord_router
from Routes.admin import admin_router
from Schemas.userSchema import UserRole
from Schemas.listingSchema import ListingStatus
from Schemas.flagSchema import FlagStatus
from Routes.property import property_router
from Routes.listing import listing_router
from Routes.review import review_router
from Routes.healthscore import health_score_router
from Routes.saved import saved_router
from Routes.flag import flag_router
from constants import *
from datetime import date

# Database
engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()

# App & Client
app = FastAPI()
app.include_router(user_router, prefix="/api/users")
app.include_router(landlord_router, prefix="/api/landlords")
app.include_router(admin_router, prefix="/api/admin")
app.include_router(property_router, prefix="/api/properties")
app.include_router(listing_router, prefix="/api/listings")
app.include_router(review_router, prefix="/api/reviews")
app.include_router(flag_router, prefix="/api/flags")
app.include_router(saved_router, prefix="/api/saved")
app.include_router(health_score_router, prefix="/api/health-scores")
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# Fixtures
@pytest.fixture(autouse=True)
def setup_db():
    """Recreate all tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """Provide a direct DB session for test assertions."""
    session = TestSession()
    yield session
    session.close()

# ──────────────────────────────────────────────
# Authentication Helpers
# ──────────────────────────────────────────────
def auth_header(token):
    return {"Authorization": f"Bearer {token}"}

def register_user(user_data=None):
    return client.post(REGISTER_URL, json=user_data or STUDENT_ONE)

def login_user(email=None, password=None):
    return client.post(LOGIN_URL, json={
        "email": email or STUDENT_ONE["email"],
        "password": password or STUDENT_ONE["password"],
    })

def register_and_get_token(user_data=None):
    res = register_user(user_data)
    return res.json()["access_token"]

# ──────────────────────────────────────────────
# User Helpers
# ──────────────────────────────────────────────
def get_me(token):
    return client.get(ME_URL, headers=auth_header(token))

def update_me(token, payload):
    return client.patch(ME_URL, json=payload, headers=auth_header(token))

def change_password(token, current, new):
    return client.patch(PASSWORD_URL, json={
        "current_password": current,
        "new_password": new,
    }, headers=auth_header(token))

def switch_role(token, payload):
    return client.patch(USER_ROLE_URL, json=payload, headers=auth_header(token))

def delete_me(token):
    return client.delete(ME_URL, headers=auth_header(token))

def get_user_by_id(user_id):
    return client.get(USER_BY_ID_URL.format(user_id=user_id))


# ──────────────────────────────────────────────
# Landlord Helpers
# ──────────────────────────────────────────────
def make_landlord(user_data=None, switch_data=None):
    """Register a user, switch to landlord, return token."""
    token = register_and_get_token(user_data)
    client.patch(USER_ROLE_URL, json=switch_data or LANDLORD_SWITCH, headers=auth_header(token))
    return token

def get_landlord_id(token):
    """Get the landlord ID from the /me endpoint."""
    res = client.get(LANDLORD_ME_URL, headers=auth_header(token))
    return res.json()["id"]

# ──────────────────────────────────────────────
# DB Seed Helpers
# ──────────────────────────────────────────────
def seed_property(landlord_id, db, title="123 College Ave"):
    """Insert a property directly into the DB."""
    prop = Property(
        landlord_id=landlord_id,
        title=title,
        address="123 College Ave, Guelph",
        property_type="house",
        total_rooms=4,
        bathrooms=2,
        is_furnished=True,
        has_parking=True,
        has_laundry=True,
        walk_time_minutes=15,    
        bus_time_minutes=10,       
        utilities_included=False
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop

def seed_review(student_id, property_id, landlord_id, db, would_rent_again=True):
    """Insert a review directly into the DB."""
    review = Review(
        student_id=student_id,
        property_id=property_id,
        landlord_id=landlord_id,
        responsiveness=4,
        maintenance_speed=3,
        respect_privacy=5,
        fairness_of_charges=4,
        would_rent_again=would_rent_again,
        comment="Solid landlord, would recommend.",
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

# ──────────────────────────────────────────────
# Admin Helper
# ──────────────────────────────────────────────
def make_admin(db):
    """Create an admin user directly in the DB and return a token."""
    from Utils.security import hash_password, create_access_token

    user = User(
        email=ADMIN_USER["email"],
        password_hash=hash_password(ADMIN_USER["password"]),
        first_name=ADMIN_USER["first_name"],
        last_name=ADMIN_USER["last_name"],
        role=UserRole.ADMIN,
        email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"user_id": user.id, "role": user.role.value})
    return token

def seed_listing(property_id, db):
    """Insert a listing directly into the DB."""
    listing = Listing(
        property_id=property_id,
        rent_per_room=650.00,
        rent_total=2600.00,
        lease_type="12_month",
        move_in_date=date(2025, 9, 1),
        is_sublet=False,
        status=ListingStatus.ACTIVE,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing

def seed_flag(reporter_id, db, listing_id=None, review_id=None):
    """Insert a flag directly into the DB."""
    flag = Flag(
        reporter_id=reporter_id,
        listing_id=listing_id,
        review_id=review_id,
        reason="Suspicious listing, possible scam.",
        status=FlagStatus.PENDING,
    )
    db.add(flag)
    db.commit()
    db.refresh(flag)
    return flag

# ──────────────────────────────────────────────
# Property Helpers
# ──────────────────────────────────────────────
def create_property_api(token, data=None):
    """Create a property via the API."""
    return client.post(PROPERTIES_URL, json=data or PROPERTY_ONE, headers=auth_header(token))

def create_property_and_get_id(token, data=None):
    """Create a property and return just the ID."""
    res = create_property_api(token, data)
    return res.json()["id"]

# ──────────────────────────────────────────────
# Listing Helpers
# ──────────────────────────────────────────────
def create_listing_api(token, property_id, data=None):
    """Create a listing via the API."""
    listing_data = dict(data or LISTING_ONE)
    listing_data["property_id"] = property_id
    return client.post(LISTINGS_URL, json=listing_data, headers=auth_header(token))


def create_listing_and_get_id(token, property_id, data=None):
    """Create a listing and return just the ID."""
    res = create_listing_api(token, property_id, data)
    return res.json()["id"]

# ──────────────────────────────────────────────
# Review Helpers
# ──────────────────────────────────────────────
def make_verified_student(user_data=None):
    """Register a student and manually verify their email. Returns token."""
    token = register_and_get_token(user_data)
    # manually verify in DB
    db = TestSession()
    user = db.query(User).filter(User.email == (user_data or STUDENT_ONE)["email"]).first()
    user.email_verified = True
    db.commit()
    db.close()
    return token

def create_review_api(token, property_id, data=None):
    """Create a review via the API."""
    review_data = dict(data or REVIEW_ONE)
    review_data["property_id"] = property_id
    return client.post(REVIEWS_URL, json=review_data, headers=auth_header(token))

# ──────────────────────────────────────────────
# Saved Helpers
# ──────────────────────────────────────────────
def save_listing_api(token, listing_id):
    return client.post(SAVED_LISTING_URL.format(listing_id=listing_id), headers=auth_header(token))


def unsave_listing_api(token, listing_id):
    return client.delete(SAVED_LISTING_URL.format(listing_id=listing_id), headers=auth_header(token))


# ──────────────────────────────────────────────
# Flag Helpers
# ──────────────────────────────────────────────
def create_flag_api(token, listing_id=None, review_id=None, reason="Suspicious content."):
    payload = {"reason": reason}
    if listing_id:
        payload["listing_id"] = listing_id
    if review_id:
        payload["review_id"] = review_id
    return client.post(FLAGS_URL, json=payload, headers=auth_header(token))


# ──────────────────────────────────────────────
# Healthscore Helpers
# ──────────────────────────────────────────────
def compute_health_score_api(listing_id):
    return client.post(HEALTH_SCORE_COMPUTE_URL.format(listing_id=listing_id))


def get_health_score_api(listing_id):
    return client.get(HEALTH_SCORE_URL.format(listing_id=listing_id))
