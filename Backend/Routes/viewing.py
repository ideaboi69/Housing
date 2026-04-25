from datetime import datetime, date, time, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from tables import get_db, Listing, Property, Landlord, User, ViewingAvailability, ViewingSlot, ViewingBooking, ViewingSlotStatus, BookingStatus, Sublet
from Schemas.viewingSchema import AvailabilityCreate, BulkAvailabilityCreate, BookingCreate, AvailabilityResponse, ViewingSlotResponse, BookingResponse
from Utils.security import get_current_user, get_current_student
from Utils.email import send_booking_confirmed_email, send_booking_cancelled_email
from helpers import require_landlord, generate_hourly_slots, build_booking_response, get_booking_details, get_host_info

viewing_router = APIRouter()

# Set availability
@viewing_router.post("/availability", response_model=AvailabilityResponse, status_code=status.HTTP_201_CREATED)
def set_availability(payload: AvailabilityCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Determine if listing or sublet
    if payload.listing_id:
        listing = db.query(Listing).filter(Listing.id == payload.listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        prop = db.query(Property).filter(Property.id == listing.property_id).first()
        if not isinstance(current_user, Landlord) or prop.landlord_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your listing")

        existing = db.query(ViewingAvailability).filter(ViewingAvailability.listing_id == payload.listing_id, ViewingAvailability.date == payload.date).first()

    else:
        sublet = db.query(Sublet).filter(Sublet.id == payload.sublet_id).first()
        if not sublet:
            raise HTTPException(status_code=404, detail="Sublet not found")

        if not isinstance(current_user, User) or sublet.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your sublet")

        existing = db.query(ViewingAvailability).filter(ViewingAvailability.sublet_id == payload.sublet_id, ViewingAvailability.date == payload.date).first()

    if payload.date < date.today():
        raise HTTPException(status_code=400, detail="Cannot set availability in the past")

    if payload.start_time >= payload.end_time:
        raise HTTPException(status_code=400, detail="Start time must be before end time")

    start_dt = datetime.combine(payload.date, payload.start_time)
    end_dt = datetime.combine(payload.date, payload.end_time)
    if (end_dt - start_dt) < timedelta(hours=1):
        raise HTTPException(status_code=400, detail="Time range must be at least 1 hour")

    if existing:
        raise HTTPException(status_code=409, detail="Availability already set for this date")

    availability = ViewingAvailability(
        listing_id=payload.listing_id,
        sublet_id=payload.sublet_id,
        landlord_id=current_user.id if isinstance(current_user, Landlord) else None,
        owner_id=current_user.id if isinstance(current_user, User) else None,
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
            sublet_id=payload.sublet_id,
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
def set_bulk_availability(payload: BulkAvailabilityCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if payload.listing_id:
        listing = db.query(Listing).filter(Listing.id == payload.listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        prop = db.query(Property).filter(Property.id == listing.property_id).first()
        if not isinstance(current_user, Landlord) or prop.landlord_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your listing")
    else:
        sublet = db.query(Sublet).filter(Sublet.id == payload.sublet_id).first()
        if not sublet:
            raise HTTPException(status_code=404, detail="Sublet not found")
        if not isinstance(current_user, User) or sublet.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your sublet")

    results = []
    for entry in payload.dates:
        if entry.date < date.today():
            continue
        if entry.start_time >= entry.end_time:
            continue

        if payload.listing_id:
            existing = db.query(ViewingAvailability).filter(ViewingAvailability.listing_id == payload.listing_id, ViewingAvailability.date == entry.date).first()
        else:
            existing = db.query(ViewingAvailability).filter(ViewingAvailability.sublet_id == payload.sublet_id, ViewingAvailability.date == entry.date).first()

        if existing:
            continue

        availability = ViewingAvailability(
            listing_id=payload.listing_id,
            sublet_id=payload.sublet_id,
            landlord_id=current_user.id if isinstance(current_user, Landlord) else None,
            owner_id=current_user.id if isinstance(current_user, User) else None,
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
                sublet_id=payload.sublet_id,
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
@viewing_router.get("/availability", response_model=list[AvailabilityResponse])
def get_availability(listing_id: Optional[int] = Query(None), sublet_id: Optional[int] = Query(None), from_date: Optional[date] = Query(None), db: Session = Depends(get_db)):
    
    if not listing_id and not sublet_id:
        raise HTTPException(status_code=400, detail="Provide either listing_id or sublet_id")
    if listing_id and sublet_id:
        raise HTTPException(status_code=400, detail="Provide either listing_id or sublet_id, not both")

    if listing_id:
        query = db.query(ViewingAvailability).filter(ViewingAvailability.listing_id == listing_id)
    else:
        query = db.query(ViewingAvailability).filter(ViewingAvailability.sublet_id == sublet_id)

    if from_date:
        query = query.filter(ViewingAvailability.date >= from_date)
    else:
        query = query.filter(ViewingAvailability.date >= date.today())

    availabilities = query.order_by(ViewingAvailability.date).all()
    return [AvailabilityResponse.model_validate(a) for a in availabilities]

# Get available slots for a listing
@viewing_router.get("/slots", response_model=list[ViewingSlotResponse])
def get_available_slots(listing_id: Optional[int] = Query(None), sublet_id: Optional[int] = Query(None), from_date: Optional[date] = Query(None), db: Session = Depends(get_db)):
    if not listing_id and not sublet_id:
        raise HTTPException(status_code=400, detail="Provide either listing_id or sublet_id")
    if listing_id and sublet_id:
        raise HTTPException(status_code=400, detail="Provide either listing_id or sublet_id, not both")

    if listing_id:
        query = db.query(ViewingSlot).filter(ViewingSlot.listing_id == listing_id, ViewingSlot.status == ViewingSlotStatus.AVAILABLE)
    else:
        query = db.query(ViewingSlot).filter(ViewingSlot.sublet_id == sublet_id, ViewingSlot.status == ViewingSlotStatus.AVAILABLE)

    if from_date:
        query = query.filter(ViewingSlot.date >= from_date)
    else:
        query = query.filter(ViewingSlot.date >= date.today())

    slots = query.order_by(ViewingSlot.date, ViewingSlot.start_time).all()
    return [ViewingSlotResponse.model_validate(s) for s in slots]

# USER - book viewing
@viewing_router.post("/book", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def book_viewing(payload: BookingCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    slot = db.query(ViewingSlot).filter(ViewingSlot.id == payload.slot_id).with_for_update().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status != ViewingSlotStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="This slot is no longer available")

    slot_datetime = datetime.combine(slot.date, slot.start_time, tzinfo=timezone.utc)
    if slot_datetime <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Cannot book a slot in the past")

    # Determine type and check ownership
    if slot.listing_id:
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

        host_email = landlord.email
        host_name = landlord.first_name
        host_full = f"{landlord.first_name} {landlord.last_name}"
        title = prop.title
        address = prop.address

    else:
        sublet = db.query(Sublet).filter(Sublet.id == slot.sublet_id).first()
        if sublet.user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Can't book your own sublet")

        existing = db.query(ViewingBooking).filter(
            ViewingBooking.sublet_id == slot.sublet_id,
            ViewingBooking.student_id == current_user.id,
            ViewingBooking.status == BookingStatus.CONFIRMED,
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="You already have a viewing booked for this sublet")

        owner = db.query(User).filter(User.id == sublet.user_id).first()

        booking = ViewingBooking(
            slot_id=slot.id,
            sublet_id=slot.sublet_id,
            student_id=current_user.id,
            owner_id=sublet.user_id,
            notes=payload.notes,
        )
        host_email = owner.email
        host_name = owner.first_name
        host_full = f"{owner.first_name} {owner.last_name}"
        title = sublet.title
        address = sublet.address

    slot.status = ViewingSlotStatus.BOOKED
    db.add(booking)
    db.commit()
    db.refresh(booking)

    booking_details = {
        "listing_title": title,
        "address": address,
        "date": str(slot.date),
        "start_time": str(slot.start_time),
        "end_time": str(slot.end_time),
    }
    background_tasks.add_task(
        send_booking_confirmed_email,
        to_email=current_user.email,
        name=current_user.first_name,
        role="student",
        booking_details={**booking_details, "other_party_name": host_full},
    )
    background_tasks.add_task(
        send_booking_confirmed_email,
        to_email=host_email,
        name=host_name,
        role="landlord",
        booking_details={**booking_details, "other_party_name": f"{current_user.first_name} {current_user.last_name}"},
    )
    return build_booking_response(booking, db)

# USER - Cancel booking
@viewing_router.patch("/bookings/{booking_id}/cancel", response_model=BookingResponse)
def student_cancel_booking(booking_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
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

    details = get_booking_details(booking, db)
    host_email, host_name, _ = get_host_info(booking, db)

    background_tasks.add_task(
        send_booking_cancelled_email,
        to_email=current_user.email,
        name=current_user.first_name,
        cancelled_by="student",
        booking_details=details,
    )

    background_tasks.add_task(
        send_booking_cancelled_email,
        to_email=host_email,
        name=host_name,
        cancelled_by="student",
        booking_details=details,
    )

    return build_booking_response(booking, db)

# Landlord/Sublet owner - Cancel booking
@viewing_router.patch("/bookings/{booking_id}/host-cancel", response_model=BookingResponse)
def host_cancel_booking(booking_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    booking = db.query(ViewingBooking).filter(ViewingBooking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Verify host ownership
    is_host = False
    if booking.landlord_id and isinstance(current_user, Landlord) and booking.landlord_id == current_user.id:
        is_host = True
    elif booking.owner_id and isinstance(current_user, User) and booking.owner_id == current_user.id:
        is_host = True

    if not is_host:
        raise HTTPException(status_code=403, detail="Not your booking")

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

    details = get_booking_details(booking, db)
    student = db.query(User).filter(User.id == booking.student_id).first()
    host_email, host_name, _ = get_host_info(booking, db)

    background_tasks.add_task(
        send_booking_cancelled_email,
        to_email=student.email,
        name=student.first_name,
        cancelled_by="host",
        booking_details=details,
    )

    background_tasks.add_task(
        send_booking_cancelled_email,
        to_email=host_email,
        name=host_name,
        cancelled_by="host",
        booking_details=details,
    )

    return build_booking_response(booking, db)

# USER - Get my bookings
@viewing_router.get("/bookings/my", response_model=list[BookingResponse])
def get_my_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    bookings = db.query(ViewingBooking).filter(ViewingBooking.student_id == current_user.id).order_by(ViewingBooking.created_at.desc()).all()

    return [build_booking_response(b, db) for b in bookings]

# Landlord/Sublet owner - Get my bookings
@viewing_router.get("/bookings/hosting", response_model=list[BookingResponse])
def get_hosting_bookings(listing_id: Optional[int] = Query(None), sublet_id: Optional[int] = Query(None), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if isinstance(current_user, Landlord):
        query = db.query(ViewingBooking).filter(ViewingBooking.landlord_id == current_user.id)
        if listing_id:
            query = query.filter(ViewingBooking.listing_id == listing_id)
    elif isinstance(current_user, User):
        query = db.query(ViewingBooking).filter(ViewingBooking.owner_id == current_user.id)
        if sublet_id:
            query = query.filter(ViewingBooking.sublet_id == sublet_id)
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    bookings = query.order_by(ViewingBooking.created_at.desc()).all()
    return [build_booking_response(b, db) for b in bookings]

# Landlord/Sublet owner - Get Upcoming Bookings
@viewing_router.get("/bookings/hosting/upcoming", response_model=list[BookingResponse])
def get_hosting_upcoming_bookings(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if isinstance(current_user, Landlord):
        bookings = db.query(ViewingBooking).join(ViewingSlot).filter(
            ViewingBooking.landlord_id == current_user.id,
            ViewingBooking.status == BookingStatus.CONFIRMED,
            ViewingSlot.date >= date.today(),
        ).order_by(ViewingSlot.date, ViewingSlot.start_time).all()

    elif isinstance(current_user, User):
        bookings = db.query(ViewingBooking).join(ViewingSlot).filter(
            ViewingBooking.owner_id == current_user.id,
            ViewingBooking.status == BookingStatus.CONFIRMED,
            ViewingSlot.date >= date.today(),
        ).order_by(ViewingSlot.date, ViewingSlot.start_time).all()
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    return [build_booking_response(b, db) for b in bookings]

# User - Get Upcoming Bookings
@viewing_router.get("/bookings/my/upcoming", response_model=list[BookingResponse])
def get_my_upcoming_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    bookings = db.query(ViewingBooking).join(ViewingSlot).filter(
        ViewingBooking.student_id == current_user.id,
        ViewingBooking.status == BookingStatus.CONFIRMED,
        ViewingSlot.date >= date.today(),
    ).order_by(ViewingSlot.date, ViewingSlot.start_time).all()

    return [build_booking_response(b, db) for b in bookings]



