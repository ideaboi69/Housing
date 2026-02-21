from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, Boolean, Numeric, Date, TIMESTAMP, func, DECIMAL, Enum, text, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from Schemas.userSchema import UserRole
from Schemas.landlordSchema import DocumentType, IDType, LandlordVerification
from Schemas.propertySchema import PropertyType, PropertyRange 
from Schemas.listingSchema import LeaseType, GenderPreference, ListingStatus
from Schemas.reviewSchema import FlagStatus
from Schemas.convoSchema import SenderType
import os
from sqlalchemy import JSON
from config import settings
from dotenv import load_dotenv
from Schemas.subletSchema import RoomType, SubletStatus
load_dotenv()

engine = create_engine(settings.DATABASE_URL)
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

    reviews = relationship("Review", back_populates="student")
    saved_listings = relationship("SavedListing", back_populates="student")
    flags = relationship("Flag", back_populates="reporter")
    conversations = relationship("Conversation", back_populates="user")
    sublets = relationship("Sublet", back_populates="user")

    __table_args__ = (
        CheckConstraint("email LIKE '%@uoguelph.ca'", name="ck_users_uoguelph_email"),
    )

class Landlord(Base):
    __tablename__ = "landlords"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.LANDLORD)
    identity_verified = Column(Boolean, default=False, nullable=False)
    company_name = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=False)
    no_of_property = Column(Enum(PropertyRange), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    properties = relationship("Property", back_populates="landlord")
    reviews = relationship("Review", back_populates="landlord")
    documents = relationship("LandlordDocuments", back_populates="landlord")
    conversations = relationship("Conversation", back_populates="landlord")

class LandlordDocuments(Base):
    __tablename__ = "landlord_documents"

    id = Column(Integer, primary_key=True)
    landlord_id = Column(Integer, ForeignKey("landlords.id", ondelete="CASCADE"), nullable=False)
    id_type = Column(Enum(IDType), nullable=False)
    document_type = Column(Enum(DocumentType), nullable=False)
    id_filepath = Column(String, nullable=False)
    document_filepath = Column(String, nullable=False)
    id_url = Column(String, nullable=False)
    document_url = Column(String, nullable=False)
    verification_status = Column(Enum(LandlordVerification), nullable=False, default=LandlordVerification.PENDING)
    extracted_data = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    landlord = relationship("Landlord", back_populates="documents")

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True)
    landlord_id = Column(Integer, ForeignKey("landlords.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    address = Column(String(500), nullable=False)
    postal_code = Column(String, nullable=False) #new
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
    drive_time_minutes = Column(Integer, nullable=False)
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
    conversations = relationship("Conversation", back_populates="listing")

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

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    landlord_id = Column(Integer, ForeignKey("landlords.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="conversations")
    landlord = relationship("Landlord", back_populates="conversations")
    listing = relationship("Listing", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")

    __table_args__ = ( UniqueConstraint("user_id", "listing_id", name="uq_conversation_user_listing"),)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_type = Column(Enum(SenderType), nullable=False)
    sender_id = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")

class Sublet(Base):
    __tablename__ = "sublets"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    address = Column(String(500), nullable=False)
    postal_code = Column(String, nullable=False) #new
    latitude = Column(Numeric(9, 6), nullable=True)
    longitude = Column(Numeric(9, 6), nullable=True)
    distance_to_campus_km = Column(Numeric(5, 2), nullable=True)
    walk_time_minutes = Column(Integer, nullable=False)
    drive_time_minutes = Column(Integer, nullable=False)
    bus_time_minutes = Column(Integer, nullable=False)
    nearest_bus_route = Column(String(100), nullable=True)
    room_type = Column(Enum(RoomType), nullable=False)  # PRIVATE, SHARED
    total_rooms = Column(Integer, nullable=False)
    bathrooms = Column(Integer, nullable=False)
    is_furnished = Column(Boolean, default=False, nullable=False)
    has_parking = Column(Boolean, default=False, nullable=False)
    has_laundry = Column(Boolean, default=False, nullable=False)
    utilities_included = Column(Boolean, default=False, nullable=False)
    estimated_utility_cost = Column(Numeric(8, 2), nullable=True)
    rent_per_month = Column(Numeric(8, 2), nullable=False)
    sublet_start_date = Column(Date, nullable=False)
    sublet_end_date = Column(Date, nullable=False)
    move_in_date = Column(Date, nullable=False)
    gender_preference = Column(Enum(GenderPreference), nullable=True)
    status = Column(Enum(SubletStatus), default=SubletStatus.ACTIVE, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="sublets")
    images = relationship("SubletImage", back_populates="sublet", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_sublets_user", "user_id"),
        Index("ix_sublets_status", "status"),
        Index("ix_sublets_dates", "sublet_start_date", "sublet_end_date"),
        Index("ix_sublets_rent", "rent_per_month"),
    )

class SubletImage(Base):
    __tablename__ = "sublet_images"

    id = Column(Integer, primary_key=True)
    sublet_id = Column(Integer, ForeignKey("sublets.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    sublet = relationship("Sublet", back_populates="images")

Base.metadata.create_all(engine)

def get_db():
    db = Local_Session()
    try:
        yield db
    finally:
        db.close()