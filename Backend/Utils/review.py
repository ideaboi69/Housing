
from tables import  Property, Listing, Local_Session
from Routes.healthscore import compute_and_save
import logging

logger = logging.getLogger(__name__)

def recompute_landlord_scores(landlord_id: int):
    db = Local_Session()
    try:
        listings = (
            db.query(Listing)
            .join(Property)
            .filter(Property.landlord_id == landlord_id)
            .all()
        )
        for listing in listings:
            try:
                compute_and_save(listing.id, db)
            except Exception as e:
                logger.warning(f"Score recompute failed for listing {listing.id}: {e}")
    except Exception as e:
        logger.warning(f"Score recompute job failed for landlord {landlord_id}: {e}")
    finally:
        db.close()