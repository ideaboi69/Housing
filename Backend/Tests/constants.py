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
# Additional Info 
# ──────────────────────────────────────────────
INVALID_TOKEN = "garbage.token.here"
NONEXISTENT_USER_ID = 99999
NONEXISTENT_LANDLORD_ID = 99999

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