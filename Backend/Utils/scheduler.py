from datetime import date, timedelta
from sqlalchemy.orm import Session
from tables import get_db, ViewingBooking, ViewingSlot, User, Landlord, Listing, Property, Sublet, BookingStatus
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
            if not student:
                continue

            if booking.listing_id:
                landlord = db.query(Landlord).filter(Landlord.id == booking.landlord_id).first()
                listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
                if not landlord or not listing:
                    continue
                prop = db.query(Property).filter(Property.id == listing.property_id).first()
                if not prop:
                    continue
                booking_details = {
                    "listing_title": prop.title,
                    "address": prop.address,
                    "date": str(slot.date),
                    "start_time": str(slot.start_time),
                    "end_time": str(slot.end_time),
                }
                host_email = landlord.email
                host_name = landlord.first_name
                host_full = f"{landlord.first_name} {landlord.last_name}"
            else:
                sublet = db.query(Sublet).filter(Sublet.id == booking.sublet_id).first()
                owner = db.query(User).filter(User.id == booking.owner_id).first()
                if not sublet or not owner:
                    continue
                booking_details = {
                    "listing_title": sublet.title,
                    "address": sublet.address,
                    "date": str(slot.date),
                    "start_time": str(slot.start_time),
                    "end_time": str(slot.end_time),
                }
                host_email = owner.email
                host_name = owner.first_name
                host_full = f"{owner.first_name} {owner.last_name}"

            try:
                send_booking_reminder_email(
                    to_email=student.email,
                    name=student.first_name,
                    role="student",
                    booking_details={
                        **booking_details,
                        "other_party_name": host_full,
                    },
                )
            except Exception:
                pass

            try:
                send_booking_reminder_email(
                    to_email=host_email,
                    name=host_name,
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
