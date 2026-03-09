from datetime import date, timedelta
from sqlalchemy.orm import Session
from tables import get_db, ViewingBooking, ViewingSlot, User, Landlord, Listing, Property, BookingStatus
from Utils.email import send_booking_reminder_email

def send_viewing_reminders():
    """Find all confirmed bookings for tomorrow and send reminders."""
    db: Session = next(get_db())

    try:
        tomorrow = date.today() + timedelta(days=1)

        bookings = db.query(ViewingBooking).join(ViewingSlot).filter(
            ViewingBooking.status == BookingStatus.CONFIRMED,
            ViewingSlot.date == tomorrow,
        ).all()

        for booking in bookings:
            slot = booking.slot
            student = db.query(User).filter(User.id == booking.student_id).first()
            landlord = db.query(Landlord).filter(Landlord.id == booking.landlord_id).first()
            listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
            prop = db.query(Property).filter(Property.id == listing.property_id).first()

            booking_details = {
                "listing_title": prop.title,
                "address": prop.address,
                "date": str(slot.date),
                "start_time": str(slot.start_time),
                "end_time": str(slot.end_time),
            }

            # Email student
            try:
                send_booking_reminder_email(
                    to_email=student.email,
                    name=student.first_name,
                    role="student",
                    booking_details={
                        **booking_details,
                        "other_party_name": f"{landlord.first_name} {landlord.last_name}",
                    },
                )
            except Exception:
                pass

            # Email landlord
            try:
                send_booking_reminder_email(
                    to_email=landlord.email,
                    name=landlord.first_name,
                    role="landlord",
                    booking_details={
                        **booking_details,
                        "other_party_name": f"{student.first_name} {student.last_name}",
                    },
                )
            except Exception:
                pass

    finally:
        db.close()