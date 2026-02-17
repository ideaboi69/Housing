# ──────────────────────────────────────────────
# User endpoints
# ──────────────────────────────────────────────
REGISTER_URL = "/api/users/register"
LOGIN_URL = "/api/users/login"
ME_URL = "/api/users/me"
PASSWORD_URL = "/api/users/me/password"
USER_ROLE_URL = "/api/users/me/role"
USER_BY_ID_URL = "/api/users/{user_id}"

# ──────────────────────────────────────────────
# Landlord endpoints
# ──────────────────────────────────────────────
LANDLORD_ME_URL = "/api/landlords/me"
LANDLORD_VERIFY_URL = "/api/landlords/me/verify"
LANDLORD_BY_ID_URL = "/api/landlords/{landlord_id}"
LANDLORD_PROPERTIES_URL = "/api/landlords/{landlord_id}/properties"
LANDLORD_REVIEWS_URL = "/api/landlords/{landlord_id}/reviews"

# ──────────────────────────────────────────────
# Admin endpoints
# ──────────────────────────────────────────────
ADMIN_STATS_URL = "/api/admin/stats"
ADMIN_USERS_URL = "/api/admin/users"
ADMIN_USER_BY_ID_URL = "/api/admin/users/{user_id}"
ADMIN_LANDLORDS_URL = "/api/admin/landlords"
ADMIN_LANDLORD_BY_ID_URL = "/api/admin/landlords/{landlord_id}"
ADMIN_VERIFY_LANDLORD_URL = "/api/admin/landlords/{landlord_id}/verify"
ADMIN_UNVERIFY_LANDLORD_URL = "/api/admin/landlords/{landlord_id}/unverify"
ADMIN_LISTINGS_URL = "/api/admin/listings"
ADMIN_LISTING_BY_ID_URL = "/api/admin/listings/{listing_id}"
ADMIN_REVIEWS_URL = "/api/admin/reviews/{review_id}"
ADMIN_FLAGS_URL = "/api/admin/flags"
ADMIN_FLAG_RESOLVE_URL = "/api/admin/flags/{flag_id}/resolve"
ADMIN_FLAG_DISMISS_URL = "/api/admin/flags/{flag_id}/dismiss"

# ──────────────────────────────────────────────
# Property endpoints
# ──────────────────────────────────────────────
PROPERTIES_URL = "/api/properties"
PROPERTY_BY_ID_URL = "/api/properties/{property_id}"
MY_PROPERTIES_URL = "/api/properties/me/all"

# ──────────────────────────────────────────────
# Listing endpoints
# ──────────────────────────────────────────────
LISTINGS_URL = "/api/listings"
LISTING_BY_ID_URL = "/api/listings/{listing_id}"
MY_LISTINGS_URL = "/api/listings/me/all"
LISTING_SUBLET_URL = "/api/listings/{listing_id}/sublet"

# ──────────────────────────────────────────────
# Review endpoints
# ──────────────────────────────────────────────
REVIEWS_URL = "/api/reviews"
REVIEW_BY_ID_URL = "/api/reviews/{review_id}"
MY_REVIEWS_URL = "/api/reviews/me/all"

# ──────────────────────────────────────────────
# Saved Endpoints
# ──────────────────────────────────────────────
SAVED_URL = "/api/saved"
SAVED_LISTING_URL = "/api/saved/{listing_id}"
SAVED_CHECK_URL = "/api/saved/{listing_id}/check"

# ──────────────────────────────────────────────
# Flag Endpoints
# ──────────────────────────────────────────────
FLAGS_URL = "/api/flags"
FLAG_BY_ID_URL = "/api/flags/{flag_id}"
MY_FLAGS_URL = "/api/flags/me"

# ──────────────────────────────────────────────
# Healthscore Endpoints
# ──────────────────────────────────────────────
HEALTH_SCORE_URL = "/api/health-scores/{listing_id}"
HEALTH_SCORE_COMPUTE_URL = "/api/health-scores/{listing_id}/compute"

# ──────────────────────────────────────────────
# Status codes
# ──────────────────────────────────────────────
HTTP_200 = 200
HTTP_201 = 201
HTTP_204 = 204
HTTP_400 = 400
HTTP_401 = 401
HTTP_403 = 403
HTTP_404 = 404
HTTP_409 = 409
HTTP_422 = 422

# ──────────────────────────────────────────────
# Dummy users
# ──────────────────────────────────────────────
STUDENT_ONE = {
    "email": "testuser@uoguelph.ca",
    "password": "securepassword123",
    "first_name": "Test",
    "last_name": "User",
}

STUDENT_TWO = {
    "email": "seconduser@uoguelph.ca",
    "password": "anotherpassword123",
    "first_name": "Second",
    "last_name": "User",
}

STUDENT_THREE = {
    "email": "thirduser@uoguelph.ca",
    "password": "thirdpassword123",
    "first_name": "Third",
    "last_name": "User",
}

ADMIN_USER = {
    "email": "admin@uoguelph.ca",
    "password": "adminpassword123",
    "first_name": "Admin",
    "last_name": "User",
}

# ──────────────────────────────────────────────
# Passwords
# ──────────────────────────────────────────────
NEW_PASSWORD = "newstrongpassword123"
SHORT_PASSWORD = "short"
WRONG_PASSWORD = "wrongpassword123"

# ──────────────────────────────────────────────
# Emails
# ──────────────────────────────────────────────
VALID_NEW_EMAIL = "newemail@uoguelph.ca"
INVALID_EMAIL = "bad@gmail.com"
NONEXISTENT_EMAIL = "nobody@uoguelph.ca"

# ──────────────────────────────────────────────
# Roles
# ──────────────────────────────────────────────
ROLE_STUDENT = "student"
ROLE_LANDLORD = "landlord"
ROLE_ADMIN = "admin"

# ──────────────────────────────────────────────
# Landlord Info
# ──────────────────────────────────────────────
LANDLORD_SWITCH = {
    "role": ROLE_LANDLORD,
    "company_name": "Guelph Rentals Inc",
    "phone": "5551234567",
}

LANDLORD_SWITCH_BASIC = {"role": ROLE_LANDLORD}

LANDLORD_SWITCH_PERSIST = {
    "role": ROLE_LANDLORD,
    "company_name": "Persist Co",
}

LANDLORD_UPDATE = {
    "company_name": "Updated Rentals Co",
    "phone": "5559999999",
}

STUDENT_SWITCH = {"role": ROLE_STUDENT}
ADMIN_SWITCH = {"role": ROLE_ADMIN}

# ──────────────────────────────────────────────
# Property Info
# ──────────────────────────────────────────────
PROPERTY_ONE = {
    "title": "Cozy Student House",
    "address": "123 College Ave, Guelph",
    "property_type": "house",
    "total_rooms": 4,
    "bathrooms": 2,
    "is_furnished": True,
    "has_parking": True,
    "has_laundry": True,
    "utilities_included": False,
    "distance_to_campus_km": 1.5,
    "walk_time_minutes": 15,
    "bus_time_minutes": 8,
}

PROPERTY_TWO = {
    "title": "Downtown Apartment",
    "address": "456 Gordon St, Guelph",
    "property_type": "apartment",
    "total_rooms": 2,
    "bathrooms": 1,
    "is_furnished": False,
    "has_parking": False,
    "has_laundry": False,
    "utilities_included": True,
    "distance_to_campus_km": 3.0,
    "walk_time_minutes": 30,
    "bus_time_minutes": 12,
}

# ──────────────────────────────────────────────
# Listing Info
# ──────────────────────────────────────────────
LISTING_ONE = {
    "rent_per_room": 650.00,
    "rent_total": 2600.00,
    "lease_type": "12_month",
    "move_in_date": "2025-09-01",
    "is_sublet": False,
}

LISTING_SUBLET = {
    "rent_per_room": 500.00,
    "rent_total": 500.00,
    "lease_type": "flexible",
    "move_in_date": "2025-05-01",
    "is_sublet": True,
    "sublet_start_date": "2025-05-01",
    "sublet_end_date": "2025-08-31",
}

LISTING_CHEAP = {
    "rent_per_room": 400.00,
    "rent_total": 1600.00,
    "lease_type": "8_month",
    "move_in_date": "2025-09-01",
    "is_sublet": False,
}

SUBLET_CONVERT_DATA = {
    "sublet_start_date": "2025-05-01",
    "sublet_end_date": "2025-08-31",
}

# ──────────────────────────────────────────────
# Review Info
# ──────────────────────────────────────────────
REVIEW_ONE = {
    "responsiveness": 4,
    "maintenance_speed": 3,
    "respect_privacy": 5,
    "fairness_of_charges": 4,
    "would_rent_again": True,
    "comment": "Great landlord, very responsive.",
}

REVIEW_BAD_RATING = {
    "responsiveness": 6,
    "maintenance_speed": 3,
    "respect_privacy": 5,
    "fairness_of_charges": 4,
    "would_rent_again": False,
    "comment": "Bad rating test.",
}

REVIEW_UPDATE = {
    "responsiveness": 2,
    "comment": "Updated my review after second year.",
}

# ──────────────────────────────────────────────
# Flag Info
# ──────────────────────────────────────────────
FLAG_LISTING = {
    "reason": "This listing looks like a scam. Price too low for the area.",
}

FLAG_REVIEW = {
    "reason": "This review appears to be fake.",
}

# ──────────────────────────────────────────────
# Additional Info 
# ──────────────────────────────────────────────
INVALID_TOKEN = "garbage.token.here"
NONEXISTENT_USER_ID = 99999
NONEXISTENT_LANDLORD_ID = 99999
NONEXISTENT_ID = 99999

# ──────────────────────────────────────────────
#  Expected Messages
# ──────────────────────────────────────────────
MSG_PASSWORD_UPDATED = "Password updated successfully"
MSG_ALREADY_EXISTS = "already exists"
MSG_INVALID_CREDENTIALS = "Invalid"
MSG_INCORRECT_PASSWORD = "incorrect"
MSG_NOT_FOUND = "not found"
MSG_ADMIN_BLOCKED = "Cannot switch to admin"
MSG_REQUIRES_LANDLORD = "requires landlord role"
MSG_LANDLORD_NOT_FOUND = "Landlord not found"
MSG_ALREADY_VERIFIED = "Already verified"
MSG_VERIFICATION_SUBMITTED = "Verification request submitted"
MSG_ADMIN_REQUIRED = "Admin access required"
MSG_CANNOT_DELETE_ADMIN = "Cannot delete another admin"
MSG_LISTING_NOT_FOUND = "Listing not found"
MSG_REVIEW_NOT_FOUND = "Review not found"
MSG_FLAG_NOT_FOUND = "Flag not found"
MSG_PROPERTY_NOT_FOUND = "Property not found"
MSG_NOT_YOUR_PROPERTY = "You do not own this property"
MSG_NOT_YOUR_LISTING = "You do not own this listing"
MSG_NOT_YOUR_REVIEW = "You can only"
MSG_ALREADY_REVIEWED = "already reviewed"
MSG_EMAIL_NOT_VERIFIED = "Email must be verified"
MSG_ALREADY_SAVED = "already saved"
MSG_SAVED_NOT_FOUND = "Saved listing not found"
MSG_ALREADY_FLAGGED = "already flagged"
MSG_MUST_FLAG_SOMETHING = "Must provide"
MSG_HEALTH_NOT_COMPUTED = "not computed yet"