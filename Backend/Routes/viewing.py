from datetime import datetime, date, time, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from tables import get_db, Listing, Property, Landlord, User, ViewingAvailability, ViewingSlot, ViewingBooking, ViewingSlotStatus, BookingStatus
from Schemas.viewingSchema import AvailabilityCreate, BulkAvailabilityCreate, BookingCreate, AvailabilityResponse, ViewingSlotResponse, BookingResponse
from Utils.security import get_current_user
from Utils.email import send_booking_confirmed_email, send_booking_cancelled_email
from helpers import require_landlord, generate_hourly_slots, build_booking_response

viewing_router = APIRouter()

# Set availability
@viewing_router.post("/availability", response_model=AvailabilityResponse, status_code=status.HTTP_201_CREATED)
def set_availability(payload: AvailabilityCreate, db: Session = Depends(get_db), landlord: Landlord = Depends(require_landlord)):
    listing = db.query(Listing).filter(Listing.id == payload.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    prop = db.query(Property).filter(Property.id == listing.property_id).first()
    if prop.landlord_id != landlord.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    if payload.date < date.today():
        raise HTTPException(status_code=400, detail="Cannot set availability in the past")

    if payload.start_time >= payload.end_time:
        raise HTTPException(status_code=400, detail="Start time must be before end time")

    start_dt = datetime.combine(payload.date, payload.start_time)
    end_dt = datetime.combine(payload.date, payload.end_time)
    if (end_dt - start_dt) < timedelta(hours=1):
        raise HTTPException(status_code=400, detail="Time range must be at least 1 hour")

    existing = db.query(ViewingAvailability).filter(ViewingAvailability.listing_id == payload.listing_id, ViewingAvailability.date == payload.date).first()

    if existing:
        raise HTTPException(status_code=409, detail="Availability already set for this date. Delete it first to update.")

    availability = ViewingAvailability(
        listing_id=payload.listing_id,
        landlord_id=landlord.id,
        date=payload.date,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )
    db.add(availability)
    db.flush()

    slot_data = generate_hourly_slots(availability)
    for s in slot_data:
        slot = ViewingSlot(
            availability_id=availability.id,
            listing_id=payload.listing_id,
            date=payload.date,
            start_time=s["start_time"],
            end_time=s["end_time"],
        )
        db.add(slot)

    db.commit()
    db.refresh(availability)

    return AvailabilityResponse.model_validate(availability)

# Set bulk availability
@viewing_router.post("/availability/bulk", response_model=list[AvailabilityResponse], status_code=status.HTTP_201_CREATED)
def set_bulk_availability(payload: BulkAvailabilityCreate, db: Session = Depends(get_db), landlord: Landlord = Depends(require_landlord)):
    listing = db.query(Listing).filter(Listing.id == payload.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    prop = db.query(Property).filter(Property.id == listing.property_id).first()
    if prop.landlord_id != landlord.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    results = []
    for entry in payload.dates:
        if entry.date < date.today():
            continue
        if entry.start_time >= entry.end_time:
            continue

        existing = db.query(ViewingAvailability).filter(ViewingAvailability.listing_id == payload.listing_id, ViewingAvailability.date == entry.date).first()

        if existing:
            continue

        availability = ViewingAvailability(
            listing_id=payload.listing_id,
            landlord_id=landlord.id,
            date=entry.date,
            start_time=entry.start_time,
            end_time=entry.end_time,
        )
        db.add(availability)
        db.flush()

        slot_data = generate_hourly_slots(availability)
        for s in slot_data:
            slot = ViewingSlot(
                availability_id=availability.id,
                listing_id=payload.listing_id,
                date=entry.date,
                start_time=s["start_time"],
                end_time=s["end_time"],
            )
            db.add(slot)

        results.append(availability)

    db.commit()
    for a in results:
        db.refresh(a)

    return [AvailabilityResponse.model_validate(a) for a in results]

# Get availability for listing
@viewing_router.get("/availability/listing/{listing_id}", response_model=list[AvailabilityResponse])
def get_listing_availability(listing_id: int, from_date: Optional[date] = Query(None), db: Session = Depends(get_db)):
    query = db.query(ViewingAvailability).filter(ViewingAvailability.listing_id == listing_id)

    if from_date:
        query = query.filter(ViewingAvailability.date >= from_date)
    else:
        query = query.filter(ViewingAvailability.date >= date.today())

    availabilities = query.order_by(ViewingAvailability.date).all()
    return [AvailabilityResponse.model_validate(a) for a in availabilities]

# Get available slots for a listing
@viewing_router.get("/slots/listing/{listing_id}", response_model=list[ViewingSlotResponse])
def get_available_slots(listing_id: int, from_date: Optional[date] = Query(None), db: Session = Depends(get_db)):
    query = db.query(ViewingSlot).filter(ViewingSlot.listing_id == listing_id, ViewingSlot.status == ViewingSlotStatus.AVAILABLE)

    if from_date:
        query = query.filter(ViewingSlot.date >= from_date)
    else:
        query = query.filter(ViewingSlot.date >= date.today())

    slots = query.order_by(ViewingSlot.date, ViewingSlot.start_time).all()
    return [ViewingSlotResponse.model_validate(s) for s in slots]

# USER - book viewing
@viewing_router.post("/book", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def book_viewing(payload: BookingCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    slot = db.query(ViewingSlot).filter(ViewingSlot.id == payload.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status != ViewingSlotStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="This slot is no longer available")

    # Check slot is in the future
    slot_datetime = datetime.combine(slot.date, slot.start_time, tzinfo=timezone.utc)
    if slot_datetime <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Cannot book a slot in the past")

    # One booking per listing per student
    existing = db.query(ViewingBooking).filter(
        ViewingBooking.listing_id == slot.listing_id,
        ViewingBooking.student_id == current_user.id,
        ViewingBooking.status == BookingStatus.CONFIRMED,
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="You already have a viewing booked for this listing")

    listing = db.query(Listing).filter(Listing.id == slot.listing_id).first()
    prop = db.query(Property).filter(Property.id == listing.property_id).first()
    landlord = db.query(Landlord).filter(Landlord.id == prop.landlord_id).first()

    booking = ViewingBooking(
        slot_id=slot.id,
        listing_id=slot.listing_id,
        student_id=current_user.id,
        landlord_id=landlord.id,
        notes=payload.notes,
    )
    slot.status = ViewingSlotStatus.BOOKED
    db.add(booking)
    db.commit()
    db.refresh(booking)

    booking_details = {
        "listing_title": prop.title,
        "address": prop.address,
        "date": str(slot.date),
        "start_time": str(slot.start_time),
        "end_time": str(slot.end_time),
    }

    # Email student
    background_tasks.add_task(
        send_booking_confirmed_email,
        to_email=current_user.email,
        name=current_user.first_name,
        role="student",
        booking_details={
            **booking_details,
            "other_party_name": f"{landlord.first_name} {landlord.last_name}",
        },
    )

    # Email landlord
    background_tasks.add_task(
        send_booking_confirmed_email,
        to_email=landlord.email,
        name=landlord.first_name,
        role="landlord",
        booking_details={
            **booking_details,
            "other_party_name": f"{current_user.first_name} {current_user.last_name}",
        },
    )

    return build_booking_response(booking, db)

# USER - Cancel booking
@viewing_router.patch("/bookings/{booking_id}/cancel", response_model=BookingResponse)
def student_cancel_booking(booking_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    booking = db.query(ViewingBooking).filter(ViewingBooking.id == booking_id, ViewingBooking.student_id == current_user.id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Booking is not active")

    # 24hr notice check
    slot = booking.slot
    slot_datetime = datetime.combine(slot.date, slot.start_time, tzinfo=timezone.utc)
    if slot_datetime - datetime.now(timezone.utc) < timedelta(hours=24):
        raise HTTPException(status_code=400, detail="Cannot cancel within 24 hours of the viewing")

    booking.status = BookingStatus.CANCELLED_BY_STUDENT
    booking.cancelled_at = datetime.now(timezone.utc)
    slot.status = ViewingSlotStatus.AVAILABLE
    db.commit()
    db.refresh(booking)

    listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
    prop = db.query(Property).filter(Property.id == listing.property_id).first()
    landlord = db.query(Landlord).filter(Landlord.id == booking.landlord_id).first()

    booking_details = {
        "listing_title": prop.title,
        "date": str(slot.date),
        "start_time": str(slot.start_time),
        "end_time": str(slot.end_time),
    }

    background_tasks.add_task(
        send_booking_cancelled_email,
        to_email=current_user.email,
        name=current_user.first_name,
        cancelled_by="student",
        booking_details=booking_details,
    )

    background_tasks.add_task(
        send_booking_cancelled_email,
        to_email=landlord.email,
        name=landlord.first_name,
        cancelled_by="student",
        booking_details=booking_details,
    )

    return build_booking_response(booking, db)

# Landlord - Cancel booking
@viewing_router.patch("/bookings/{booking_id}/landlord-cancel", response_model=BookingResponse)
def landlord_cancel_booking(booking_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), landlord: Landlord = Depends(require_landlord)):
    booking = db.query(ViewingBooking).filter(ViewingBooking.id == booking_id, ViewingBooking.landlord_id == landlord.id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Booking is not active")

    slot = booking.slot
    slot_datetime = datetime.combine(slot.date, slot.start_time, tzinfo=timezone.utc)
    if slot_datetime - datetime.now(timezone.utc) < timedelta(hours=24):
        raise HTTPException(status_code=400, detail="Cannot cancel within 24 hours of the viewing")

    booking.status = BookingStatus.CANCELLED_BY_LANDLORD
    booking.cancelled_at = datetime.now(timezone.utc)
    slot.status = ViewingSlotStatus.AVAILABLE
    db.commit()
    db.refresh(booking)

    listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
    prop = db.query(Property).filter(Property.id == listing.property_id).first()
    student = db.query(User).filter(User.id == booking.student_id).first()

    booking_details = {
        "listing_title": prop.title,
        "date": str(slot.date),
        "start_time": str(slot.start_time),
        "end_time": str(slot.end_time),
    }

    background_tasks.add_task(
        send_booking_cancelled_email,
        to_email=student.email,
        name=student.first_name,
        cancelled_by="landlord",
        booking_details=booking_details,
    )

    background_tasks.add_task(
        send_booking_cancelled_email,
        to_email=landlord.email,
        name=landlord.first_name,
        cancelled_by="landlord",
        booking_details=booking_details,
    )

    return build_booking_response(booking, db)

# USER - Get my bookings
@viewing_router.get("/bookings/my", response_model=list[BookingResponse])
def get_my_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bookings = db.query(ViewingBooking).filter(ViewingBooking.student_id == current_user.id).order_by(ViewingBooking.created_at.desc()).all()

    return [build_booking_response(b, db) for b in bookings]

# Landlord - Get my bookings
@viewing_router.get("/bookings/landlord", response_model=list[BookingResponse])
def get_landlord_bookings(listing_id: Optional[int] = Query(None), db: Session = Depends(get_db), landlord: Landlord = Depends(require_landlord)):
    query = db.query(ViewingBooking).filter(ViewingBooking.landlord_id == landlord.id)

    if listing_id:
        query = query.filter(ViewingBooking.listing_id == listing_id)

    bookings = query.order_by(ViewingBooking.created_at.desc()).all()

    return [build_booking_response(b, db) for b in bookings]

# Landlord - Get Upcoming Bookings
@viewing_router.get("/bookings/landlord/upcoming", response_model=list[BookingResponse])
def get_landlord_upcoming_bookings(db: Session = Depends(get_db), landlord: Landlord = Depends(require_landlord)):
    bookings = db.query(ViewingBooking).join(ViewingSlot).filter(
        ViewingBooking.landlord_id == landlord.id,
        ViewingBooking.status == BookingStatus.CONFIRMED,
        ViewingSlot.date >= date.today(),
    ).order_by(ViewingSlot.date, ViewingSlot.start_time).all()

    return [build_booking_response(b, db) for b in bookings]

# User - Get Upcoming Bookings
@viewing_router.get("/bookings/my/upcoming", response_model=list[BookingResponse])
def get_my_upcoming_bookings(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    bookings = db.query(ViewingBooking).join(ViewingSlot).filter(
        ViewingBooking.student_id == current_user.id,
        ViewingBooking.status == BookingStatus.CONFIRMED,
        ViewingSlot.date >= date.today(),
    ).order_by(ViewingSlot.date, ViewingSlot.start_time).all()

    return [build_booking_response(b, db) for b in bookings]