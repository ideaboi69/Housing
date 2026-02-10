from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, Boolean, Numeric, Date, TIMESTAMP, func, DECIMAL, Enum, text, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from schemas import UserRole, PropertyType, LeaseType, GenderPreference, ListingStatus, FlagStatus
import os
from dotenv import load_dotenv

load_dotenv()

HG_USER=os.getenv("HGUSER")
HG_PASSWORD=os.getenv("HGPASSWORD")
HG_DB=os.getenv("HGDB")
HG_HOST=os.getenv("HGHOST")
HG_PORT = os.getenv("HGPORT")

db_url = f"postgresql://{HG_USER}:{HG_PASSWORD}@{HG_HOST}:{HG_PORT}/{HG_DB}"

engine = create_engine(db_url)
Local_Session = sessionmaker(bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    email_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    landlord_profile = relationship("Landlord", back_populates="user", uselist=False)
    reviews = relationship("Review", back_populates="student")
    saved_listings = relationship("SavedListing", back_populates="student")
    flags = relationship("Flag", back_populates="reporter")

    #  __table_args__ = (
    #     CheckConstraint("email LIKE '%@uoguelph.ca'", name="ck_users_uoguelph_email"),
    # )

class Landlord(Base):
    __tablename__ = "landlords"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    identity_verified = Column(Boolean, default=False, nullable=False)
    company_name = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="landlord_profile")
    properties = relationship("Property", back_populates="landlord")
    reviews = relationship("Review", back_populates="landlord")

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True)
    landlord_id = Column(Integer, ForeignKey("landlords.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    address = Column(String(500), nullable=False)
    latitude = Column(Numeric(9, 6), nullable=True)
    longitude = Column(Numeric(9, 6), nullable=True)
    property_type = Column(Enum(PropertyType), nullable=False)
    total_rooms = Column(Integer, nullable=False)
    bathrooms = Column(Integer, nullable=False)
    is_furnished = Column(Boolean, default=False, nullable=False)
    has_parking = Column(Boolean, default=False, nullable=False)
    has_laundry = Column(Boolean, default=False, nullable=False)
    utilities_included = Column(Boolean, default=False, nullable=False)
    estimated_utility_cost = Column(Numeric(8, 2), nullable=True)
    distance_to_campus_km = Column(Numeric(5, 2), nullable=True)
    walk_time_minutes = Column(Integer, nullable=False)
    bus_time_minutes = Column(Integer, nullable=False)
    nearest_bus_route = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    landlord = relationship("Landlord", back_populates="properties")
    listings = relationship("Listing", back_populates="property")
    reviews = relationship("Review", back_populates="property")

    __table_args__ = (
        Index("ix_properties_location", "latitude", "longitude"),
        Index("ix_properties_landlord", "landlord_id"),
    )

class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    rent_per_room = Column(Numeric(8, 2), nullable=False)
    rent_total = Column(Numeric(8, 2), nullable=False)
    lease_type = Column(Enum(LeaseType), nullable=False)
    move_in_date = Column(Date, nullable=False)
    is_sublet = Column(Boolean, default=False, nullable=False)
    sublet_start_date = Column(Date, nullable=True)
    sublet_end_date = Column(Date, nullable=True)
    gender_preference = Column(Enum(GenderPreference), nullable=True)
    status = Column(Enum(ListingStatus), default=ListingStatus.ACTIVE, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    property = relationship("Property", back_populates="listings")
    images = relationship("ListingImage", back_populates="listing", cascade="all, delete-orphan")
    health_score = relationship("HousingHealthScore", back_populates="listing", uselist=False)
    saved_by = relationship("SavedListing", back_populates="listing")
    flags = relationship("Flag", back_populates="listing")

    __table_args__ = (
        Index("ix_listings_status", "status"),
        Index("ix_listings_sublet", "is_sublet", "sublet_start_date", "sublet_end_date"),
        Index("ix_listings_rent", "rent_per_room"),
        Index("ix_listings_property", "property_id"),
    )

class ListingImage(Base):
    __tablename__ = "listing_images"

    id = Column(Integer, primary_key=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    listing = relationship("Listing", back_populates="images")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    landlord_id = Column(Integer, ForeignKey("landlords.id", ondelete="CASCADE"), nullable=False)
    responsiveness = Column(Integer, nullable=False)
    maintenance_speed = Column(Integer, nullable=False)
    respect_privacy = Column(Integer, nullable=False)
    fairness_of_charges = Column(Integer, nullable=False)
    would_rent_again = Column(Boolean, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="reviews")
    property = relationship("Property", back_populates="reviews")
    landlord = relationship("Landlord", back_populates="reviews")
    flags = relationship("Flag", back_populates="review")

    __table_args__ = (
        CheckConstraint("responsiveness BETWEEN 1 AND 5", name="ck_reviews_responsiveness"),
        CheckConstraint("maintenance_speed BETWEEN 1 AND 5", name="ck_reviews_maintenance"),
        CheckConstraint("respect_privacy BETWEEN 1 AND 5", name="ck_reviews_privacy"),
        CheckConstraint("fairness_of_charges BETWEEN 1 AND 5", name="ck_reviews_fairness"),
        UniqueConstraint("student_id", "property_id", name="uq_one_review_per_student_per_property"),
        Index("ix_reviews_landlord", "landlord_id"),
        Index("ix_reviews_property", "property_id"),
    )


class HousingHealthScore(Base):
    __tablename__ = "housing_health_scores"

    id = Column(Integer, primary_key=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), unique=True, nullable=False)
    price_vs_market_score = Column(Numeric(4, 2), nullable=False)
    landlord_reputation_score = Column(Numeric(4, 2), nullable=False)
    maintenance_score = Column(Numeric(4, 2), nullable=False)
    lease_clarity_score = Column(Numeric(4, 2), nullable=False)
    overall_score = Column(Numeric(4, 2), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    listing = relationship("Listing", back_populates="health_score")

    __table_args__ = (
        CheckConstraint("overall_score BETWEEN 0 AND 100", name="ck_health_overall_range"),
    )

class Flag(Base):
    __tablename__ = "flags"

    id = Column(Integer, primary_key=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="SET NULL"), nullable=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="SET NULL"), nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(Enum(FlagStatus), default=FlagStatus.PENDING, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    reporter = relationship("User", back_populates="flags")
    listing = relationship("Listing", back_populates="flags")
    review = relationship("Review", back_populates="flags")

    __table_args__ = (
        Index("ix_flags_status", "status"),
    )

class SavedListing(Base):
    __tablename__ = "saved_listings"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="saved_listings")
    listing = relationship("Listing", back_populates="saved_by")

    __table_args__ = (
        UniqueConstraint("student_id", "listing_id", name="uq_one_save_per_student_per_listing"),
    )

Base.metadata.create_all(engine)

def get_db():
    db = Local_Session()
    try:
        yield db
    finally:
        db.close()