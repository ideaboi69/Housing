# FindYourCribb — Backend CLAUDE.md

> **Stack:** FastAPI · PostgreSQL (Neon) · SQLAlchemy · Cloudinary · AWS S3/Textract · Resend · APScheduler · Anthropic · slowapi · bcrypt · python-jose
> **Platform:** Student housing for University of Guelph
> **Deployed on:** Render · Python 3.11 (local) / 3.14 (Render)
> **Last updated:** March 2026

---

## Project Structure

```
Backend/
├── main.py                     # FastAPI app, CORS, router registration, APScheduler, slowapi
├── config.py                   # Pydantic Settings (env vars, computed DATABASE_URL)
├── tables.py                   # All SQLAlchemy models + enums + DB session
├── helpers.py                  # Shared helpers: require_landlord, cascade deletes, slug gen, etc.
├── requirements.txt
├── Routes/
│   ├── user.py                 # Student auth, profile, dashboard, notifications, write access
│   ├── landlord.py             # Landlord auth, registration with S3 doc upload, profile photo
│   ├── admin.py                # Admin CRUD, approval workflows, moderation, OG badges
│   ├── writer.py               # Writer applications + auth + profile photo
│   ├── property.py             # Property CRUD (landlord-owned)
│   ├── listing.py              # Listing CRUD under properties
│   ├── sublet.py               # Student sublet listings
│   ├── review.py               # Property reviews
│   ├── healthscore.py          # Cribb scores per listing
│   ├── saved.py                # Bookmarked listings
│   ├── flag.py                 # Flag inappropriate content (listings, reviews, marketplace, sublets)
│   ├── messages.py             # Landlord ↔ student messaging
│   ├── post.py                 # Blog posts — students + writers
│   ├── marketplace.py          # Buy/sell/free marketplace + similar items
│   ├── roommates.py            # Quiz, groups, invites, requests, group photos
│   ├── viewing.py              # Viewing slots + bookings for listings AND sublets
│   ├── landlord_invite.py      # Landlord invite link system for roommate groups
│   └── ai.py                   # AI-powered listing comparison (Claude Haiku)
├── Schemas/
│   ├── userSchema.py           # UserRole enum, UserCreate, UserUpdate (bio/program/year), UserResponse
│   ├── landlordSchema.py       # DocumentType, IDType, LandlordVerification enums + schemas
│   ├── propertySchema.py       # PropertyType, PropertyRange enums + schemas
│   ├── listingSchema.py        # LeaseType, GenderPreference, ListingStatus + schemas
│   ├── subletSchema.py         # RoomType, SubletStatus + schemas
│   ├── reviewSchema.py         # FlagStatus enum + review schemas
│   ├── convoSchema.py          # SenderType enum + message schemas
│   ├── writerSchema.py         # WriterStatus enum + schemas
│   ├── postSchema.py           # PostCategory, PostStatus + schemas
│   ├── marketplaceSchema.py    # MarketplaceCategory, ItemCondition, PricingType, ItemStatus + schemas
│   ├── roommateSchema.py       # All roommate enums (10+ quiz enums) + quiz/group/invite/request schemas
│   ├── viewingSchema.py        # ViewingSlotStatus, BookingStatus + availability/slot/booking schemas
│   ├── UDashSchema.py          # StudentYear, ProfileUpdate, NotificationPreferences, housing prefs
│   ├── adminSchema.py          # Admin response schemas + AdminStatsResponse
│   ├── healthscoreSchema.py
│   ├── savedSchema.py
│   ├── flagSchema.py           # FlagCreate supports listing, review, marketplace_item, sublet
│   └── landlordInviteSchema.py # LandlordInviteCreate, LandlordInviteResponse, LandlordInviteDetailResponse
├── Utils/
│   ├── security.py             # bcrypt hashing, JWT create/decode, all auth dependencies
│   ├── email.py                # All Resend HTML email templates (45KB — largest util)
│   ├── email_token.py          # Email verification token generation
│   ├── cloudinary.py           # Upload/delete image helpers
│   ├── cloudinary_config.py    # Cloudinary init (imported in main.py)
│   ├── textract.py             # AWS Textract document extraction
│   ├── verification.py         # Fuzzy matching extracted data vs landlord info
│   ├── roommate.py             # Compatibility scoring logic
│   ├── scheduler.py            # Daily viewing reminder cron job (listings + sublets)
│   └── rate_limit.py           # slowapi Limiter singleton
└── Tests/                      # Test files
```

---

## Authentication System

Four separate user types with independent tables and OAuth2 schemes:

| User Type | Table | Token URL (Swagger) | Scheme Name |
|-----------|-------|---------------------|-------------|
| Student | `users` | `/api/users/login/swagger` | `UserAuth` |
| Landlord | `landlords` | `/api/landlords/login` | `LandlordAuth` |
| Writer | `writers` | `/api/writers/login` | `WriterAuth` |
| Admin | `admins` | `/api/admin/login` | `AdminAuth` |

**Password handling:** `bcrypt` directly (passlib was removed — incompatible with bcrypt >= 4.1). Validation requires 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.

**Login endpoints** accept JSON (for frontend) with `UserLogin` BaseModel. Swagger endpoints use `OAuth2PasswordRequestForm`. Login returns `access_token` + full user object.

**Auth dependencies in `Utils/security.py`:**
- `get_current_user` — decodes JWT, returns User/Landlord/Writer based on `role` claim
- `get_current_student` — requires student role + email_verified
- `get_current_landlord` — requires landlord role
- `get_current_admin` — requires admin role + is_active
- `get_current_writer` — requires writer role + status=APPROVED
- `get_current_author` — accepts both students (is_writable=True) and approved writers via `HTTPBearer`
- `require_role(role)` — generic role checker factory

**Password reset:** `create_password_reset_token` / `decode_password_reset_token` with 1hr expiry and `purpose: "password_reset"` claim.

**Rate Limiting (slowapi):**
All auth endpoints are rate limited via `Utils/rate_limit.py`:

| Endpoint | Limit |
|----------|-------|
| User/Landlord/Writer register | 5/minute |
| All login endpoints | 10/minute |
| Forgot password | 3/minute |
| Reset password | 5/minute |
| AI compare | 10/hour |

Every rate-limited function **must** have `request: Request` as its first parameter or slowapi will crash.

---

## Database Models (tables.py)

### User
Columns: `id`, `email` (unique, @uoguelph.ca constraint), `password_hash`, `first_name`, `last_name`, `role` (UserRole enum), `email_verified`, `is_writable`, `write_access_requested`, `is_early_adopter` (OG badge, auto-granted to first 100 users), `profile_photo_url`, `program`, `year` (StudentYear enum), `bio` (max 200), `created_at`, `updated_at`

Relationships: reviews, saved_listings, flags, conversations, sublets, posts, marketplace_items, housing_preferences, notification_preferences, roommate_profile, owned_roommate_groups, roommate_memberships, roommate_invites_received, roommate_requests_sent, viewing_bookings (FK: student_id), viewing_availabilities (FK: owner_id)

### Landlord
Columns: `id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`, `company_name`, `no_of_property`, `identity_verified`, `profile_photo_url`, `created_at`, `updated_at`

Relationships: properties, documents, reviews, conversations, viewing_availabilities, viewing_bookings

### Admin
Columns: `id`, `email`, `password_hash`, `first_name`, `last_name`, `role`, `is_active`, `created_at`, `updated_at`

Seeded via `POST /admin/seed?secret=ADMIN_SECRET`. Subsequent admins created by existing admins.

### Writer
Columns: `id`, `email`, `password_hash`, `first_name`, `last_name`, `business_name`, `business_type` (BusinessType enum), `city`, `website`, `phone`, `reason`, `status` (WriterStatus: PENDING/APPROVED/REJECTED/REVOKED), `profile_photo_url`, `created_at`, `updated_at`

### Property → Listing → ListingImage
- Property: `title`, `address`, `postal_code`, `property_type`, `total_rooms`, `bathrooms`, `is_furnished`, `has_parking`, `has_laundry`, `utilities_included`, `estimated_utility_cost`, `distance_to_campus_km`, `walk_time_minutes`, `drive_time_minutes`, `bus_time_minutes`, `nearest_bus_route`, `latitude`, `longitude`
- Listing: `property_id` FK, `rent_per_room`, `rent_total`, `lease_type`, `move_in_date`, `is_sublet`, `gender_preference`, `status` (DRAFT/ACTIVE/RENTED/EXPIRED), `view_count`. **Identity_verified check on creation** — unverified landlords cannot create listings.
- ListingImage: `listing_id` FK, `image_url`, `display_order`. **MIME validation** on upload (JPEG, PNG, WebP, GIF only).

### Sublet → SubletImage
`title`, `address`, `rent`, `room_type`, `start_date`, `end_date`, `description`, `nearest_bus_route`, `status` (DRAFT/ACTIVE/RENTED/EXPIRED), `view_count`, `user_id` FK

### Post
Dual authorship: `user_id` (nullable) OR `writer_id` (nullable) with CheckConstraint ensuring exactly one is set. Fields: `title`, `slug` (auto-generated with UUID suffix), `content`, `preview`, `cover_image_url`, `category` (EVENT/DEAL/NEWS/LIFESTYLE/FOOD/OTHER), `status` (DRAFT/PUBLISHED/ARCHIVED), `view_count`, event/deal fields.

### MarketplaceItem → MarketplaceImage
Student-only. Fields: `seller_id`, `title`, `description`, `category` (11 housing-related categories), `condition` (NEW/LIKE_NEW/GOOD/FAIR/POOR), `pricing_type` (FREE/FIXED/NEGOTIABLE), `price`, `pickup_location`, `pickup_notes`, `status` (DRAFT/AVAILABLE/SOLD/RESERVED/REMOVED), `view_count`. Max 5 images. **MIME validation** on upload.

### Marketplace Messaging
Separate from listing messaging. `MarketplaceConversation` (item_id, buyer_id, seller_id) + `MarketplaceMessage` (conversation_id, sender_id, content, is_read). UniqueConstraint on (item_id, buyer_id).

### Roommate System
- `RoommateProfile`: 10 quiz fields (sleep_schedule, cleanliness, noise_level, guests, study_habits, smoking, pets, kitchen_use, budget_range, roommate_timing) + gender_housing_pref, search_type, roommates_needed, quiz_completed, is_visible. Has `lifestyle_tags` property.
- `RoommateGroup`: owner_id, name, description, current_size, spots_needed, total_capacity, rent_per_person, utilities_included, move_in_timing, gender_preference, has_place, address, is_verified, listing_id (nullable FK for admin linking), is_active, `group_photo_url`. Has `spots_remaining` property.
- `RoommateGroupMember`: group_id, user_id, role (OWNER/MEMBER), is_active (soft delete for leave/kick, reactivation on rejoin)
- `RoommateInvite`: group owner → individual. UniqueConstraint(group_id, invited_user_id).
- `RoommateRequest`: individual → group. UniqueConstraint(group_id, user_id).

### LandlordInvite (NEW)
Group owner creates a link for a landlord to claim and create a listing. Fields: `group_id`, `created_by`, `token` (unique, URL-safe), `group_slug`, `status` (pending/claimed/cancelled), `claimed_by`, `claimed_at`, `property_id`, `listing_id`. Prefilled property/listing data: `address`, `postal_code`, `property_type`, `total_rooms`, `bathrooms`, amenity booleans, `rent_per_room`, `rent_total`, `lease_type`, `move_in_date`, `gender_preference`. Enum fields stored as lowercase `.value` strings in VARCHAR columns. One active invite per group (new invite cancels old). No expiry.

### Viewing / Booking System (unified for listings + sublets)
- `ViewingAvailability`: listing_id OR sublet_id (nullable, CheckConstraint), landlord_id OR owner_id, date, start_time, end_time. UniqueConstraints per listing/sublet per date.
- `ViewingSlot`: auto-generated 1hr slots from availability. listing_id OR sublet_id, status (AVAILABLE/BOOKED/CANCELLED). **Row locking** (`with_for_update()`) on booking to prevent double-booking.
- `ViewingBooking`: slot_id (unique), listing_id OR sublet_id, student_id, landlord_id OR owner_id, status (CONFIRMED/CANCELLED_BY_STUDENT/CANCELLED_BY_LANDLORD/COMPLETED), notes, cancelled_at.

### Flag (updated)
Now supports flagging **listings, reviews, marketplace items, and sublets**. Fields: `reporter_id`, `listing_id`, `review_id`, `marketplace_item_id`, `sublet_id` (all nullable), `reason`, `status` (PENDING/REVIEWED/RESOLVED). Schema uses `model_validator` to ensure exactly one target is set. Relationships on both Flag and target models (MarketplaceItem, Sublet).

### Settings Tables
- `UserHousingPreferences`: budget, move_in_date, lease_term, preferred_areas (JSON), property_types (JSON), must_haves (JSON)
- `NotificationPreferences`: 5 boolean toggles (new_listings_matching, price_drops_saved, new_roommate_matches, weekly_bubble_digest, cribb_news_updates)

### Other
- `Conversation` + `Message`: listing-based messaging between students and landlords. **Landlord detection uses `isinstance(current_user, Landlord)`** not hasattr.
- `Review`: property reviews with ratings
- `HousingHealthScore`: cribb score per listing
- `SavedListing`: bookmarks
- `LandlordDocuments`: S3 paths, Textract extracted_data (JSON), verification_status

---

## Key Endpoints by Router

### Users (`/api/users`)
`POST /register` (rate limited 5/min, auto-grants OG badge to first 100) · `POST /login` (10/min) · `POST /login/swagger` (10/min) · `GET /verify-email` · `POST /resend-verification` · `POST /forgot-password` (3/min) · `POST /reset-password` (5/min) · `POST /refresh` · `GET /me` · `PATCH /me` (now supports bio, program, year) · `DELETE /me` · `PATCH /me/password` · `POST /me/profile-photo` · `DELETE /me/profile-photo` · `GET /me/notifications` · `PATCH /me/notifications` · `POST /request-write-access` · `GET /me/dashboard` · `GET /{user_id}`

### Landlords (`/api/landlords`)
`POST /register` (rate limited 5/min, with S3 doc upload + Textract) · `POST /login` (10/min) · `GET /me` · `PATCH /me` · `POST /me/profile-photo` · `DELETE /me/profile-photo` · `DELETE /me` · `GET /{landlord_id}` · `GET /{landlord_id}/properties` · `GET /{landlord_id}/reviews`

### Admin (`/api/admin`)
`POST /seed` · `POST /register` · `POST /login` (10/min) · `GET /stats` (now includes marketplace, sublets, posts, writers, roommate groups, roommate profiles)
Users: `GET /users` · `GET /users/pending-writers` · `GET /users/{id}` · `PATCH /users/{id}/verify` · `DELETE /users/{id}` · `PATCH /users/{id}/grant-write` · `/reject-write` · `/revoke-write` · `PATCH /users/{id}/grant-og` · `/revoke-og`
Landlords: `GET /landlords` · `PATCH /landlords/{id}/verify` · `/unverify` · `DELETE /landlords/{id}`
Writers: `GET /writers` · `/writers/pending` · `PATCH /writers/{id}/approve` · `/reject` · `/revoke` · `DELETE /writers/{id}`
Posts: `GET /posts` · `DELETE /posts/{id}`
Listings: `GET /listings` · `DELETE /listings/{id}`
Flags: `GET /flags` (includes flag_type, marketplace_item_id, sublet_id) · `PATCH /flags/{id}/resolve` · `/dismiss`
Roommate Groups: `GET /roommate-groups` · `PATCH /roommate-groups/{id}/verify` · `/link-listing`

### Properties (`/api/properties`)
`GET /` · `POST /` · `GET /{id}` · `PATCH /{id}` · `DELETE /{id}`

### Listings (`/api/listings`)
`POST /` (requires identity_verified) · `GET /` (public, filterable with PropertyType validation) · `GET /{id}` · `PATCH /{id}` · `DELETE /{id}` · `GET /me/all` · `GET /drafts/my` · `PATCH /{id}/publish` · `PATCH /{id}/unpublish` · `POST /{id}/images` (MIME validated) · `DELETE /{id}/images/{img_id}`

### Sublets (`/api/sublets`)
`POST /` · `GET /` (public) · `GET /{id}` · `PATCH /{id}` · `DELETE /{id}` · `GET /my` · `GET /drafts/my` · `PATCH /{id}/publish` · `PATCH /{id}/unpublish` · `POST /{id}/images`

### Posts (`/api/posts`)
`POST /` · `GET /` (public, by category) · `GET /{slug}` (increments views) · `GET /my/posts` · `GET /my/published` · `GET /my/archived` · `GET /my/stats` · `GET /drafts/my` · `GET /search/posts?q=...` · `PATCH /{id}` · `DELETE /{id}` · `PATCH /{id}/publish` · `/unpublish` · `/archive` · `/unarchive` (sets PUBLISHED not DRAFT) · `POST /{id}/cover-image`

### Marketplace (`/api/marketplace`)
`POST /items` · `GET /items` (public, filterable + searchable) · `GET /items/{id}` · `GET /items/{id}/similar` (8 items, same category) · `PATCH /items/{id}` · `DELETE /items/{id}` · `GET /my/items` · `GET /drafts/my` · `PATCH /items/{id}/publish` · `/unpublish` · `/sold` · `POST /items/{id}/images` (MIME validated) · `DELETE /items/{id}/images/{img_id}` · `POST /conversations` · `POST /conversations/{id}/messages` · `GET /conversations` · `GET /conversations/{id}` · `GET /unread-count`

### Roommates (`/api/roommates`)
`GET /profile-check` · `PATCH /complete-profile` · `POST /quiz` · `GET /quiz/me` · `PATCH /quiz/visibility`
Groups: `POST /groups` · `PATCH /groups/{id}` · `DELETE /groups/{id}` · `POST /groups/{id}/photo` · `DELETE /groups/{id}/photo` · `GET /groups/my/group` · `GET /groups/browse` (filterable) · `GET /groups/{id}`
Landlord Invites: `POST /groups/{id}/landlord-invite` · `GET /groups/{id}/landlord-invite` · `DELETE /groups/{id}/landlord-invite` · `GET /landlord-invites/{token}` (public preview) · `POST /landlord-invites/{token}/claim` (verified landlord)
Individuals: `GET /individuals` · `GET /individuals/search` (filterable by quiz fields + name/program)
Invites: `POST /invites` · `PATCH /invites/{id}/accept` · `/decline` · `GET /invites/received` · `/sent`
Requests: `POST /requests` · `PATCH /requests/{id}/accept` · `/decline` · `GET /requests/received` · `/sent`
Members: `DELETE /groups/{id}/members/{user_id}` · `DELETE /groups/{id}/leave`

### Writers (`/api/writers`)
`POST /register` (rate limited 5/min) · `POST /login` (10/min) · `POST /me/profile-photo` · `DELETE /me/profile-photo`

### Viewings (`/api/viewings`)
`POST /availability` (listings + sublets via model_validator) · `POST /availability/bulk` · `GET /availability?listing_id=X` or `?sublet_id=X` · `DELETE /availability/{id}` · `GET /slots?listing_id=X` or `?sublet_id=X` · `POST /book` (row-locked to prevent double-booking) · `PATCH /bookings/{id}/cancel` (student) · `PATCH /bookings/{id}/host-cancel` (landlord or sublet owner) · `GET /bookings/my` · `/my/upcoming` · `/hosting` · `/hosting/upcoming`

### Messages (`/api/messages`)
`POST /conversations` · `POST /conversations/{id}` · `POST /landlord/conversations/{id}` · `GET /conversations` · `GET /landlord/conversations` · `GET /conversations/{id}` · `GET /unread-count` · `GET /landlord/unread-count` · `DELETE /conversations/{id}/messages/{msg_id}` · `DELETE /conversations/{id}` · `DELETE /landlord/conversations/{id}`

### AI (`/api/ai`)
`POST /compare` (rate limited 10/hour) — accepts `listing_ids` (2-5), fetches full listing/property/landlord/cribb score data, sends to Claude Haiku, returns comparison summary. Requires verified student.

---

## User Dashboard (`GET /me/dashboard`)

Returns comprehensive stats for the logged-in student:

```json
{
  "sublets_active": 1,
  "sublets_drafts": 0,
  "sublets_total": 1,
  "posts": 3,
  "saved_listings": 5,
  "marketplace_active": 2,
  "marketplace_sold": 1,
  "marketplace_drafts": 0,
  "marketplace_unread_messages": 3,
  "marketplace_total_views": 47,
  "upcoming_viewings": 1,
  "unread_messages": 2,
  "reviews_written": 4,
  "has_roommate_profile": true,
  "roommate_quiz_completed": true,
  "is_in_group": true,
  "is_group_owner": true,
  "group_id": 3,
  "group_name": "The Guelph Boys",
  "pending_invites_received": 1,
  "pending_requests_sent": 0,
  "profile_completeness": 86
}
```

Profile completeness checks: first_name, last_name, email_verified, program, year, bio, profile_photo_url.

---

## OG Badge (Early Adopter)

- `is_early_adopter` column on User model (Boolean, default False)
- Auto-granted on registration when `db.query(User).count() < 100`
- Admin can manually grant/revoke via `PATCH /admin/users/{id}/grant-og` and `/revoke-og`
- Included in `UserResponse` and `AdminUserResponse`

---

## Landlord Invite Link System

Flow:
1. Group owner → `POST /api/roommates/groups/{id}/landlord-invite` with house details (address, property_type, rooms, amenities, rent, lease_type, etc.)
2. Backend generates token, returns link: `{FRONTEND_URL}/{slugified-group-name}/landlord-invite/{token}`
3. Landlord clicks link → `GET /api/roommates/landlord-invites/{token}` shows public preview
4. Landlord signs up, verifies identity
5. Landlord → `POST /api/roommates/landlord-invites/{token}/claim` → creates Property + Listing (DRAFT), links to group
6. Landlord edits via normal PATCH endpoints, publishes when ready

One active invite per group (creating new cancels old). No expiry. Enum values stored as lowercase `.value` strings in VARCHAR columns, converted back to enums on claim.

---

## Profile Photo Endpoints

| Endpoint | Auth | Cloudinary Folder |
|----------|------|-------------------|
| `POST/DELETE /api/users/me/profile-photo` | Student | `users/{id}` |
| `POST/DELETE /api/landlords/me/profile-photo` | Landlord | `landlords/{id}` |
| `POST/DELETE /api/writers/me/profile-photo` | Approved Writer | `writers/{id}` |
| `POST/DELETE /api/roommates/groups/{id}/photo` | Group Owner | `roommate-groups/{id}` |

All validate MIME type (JPEG, PNG, WebP only). Delete old photo from Cloudinary before uploading new. Default avatar (initials) handled on frontend.

---

## Compatibility Scoring (Roommates)

Weighted matching across 10 quiz fields. Defined in `Utils/roommate.py`.

| Field | Weight | Why |
|-------|--------|-----|
| Cleanliness | 20% | #1 roommate conflict source |
| Sleep Schedule | 15% | Daily impact |
| Noise Level | 15% | Daily impact |
| Smoking | 15% | Dealbreaker for many |
| Guests | 10% | Social compatibility |
| Study Habits | 5% | Lower friction |
| Pets | 5% | Preference-based |
| Kitchen Use | 5% | Minor friction |
| Budget Range | 5% | Practical alignment |
| Timing | 5% | Practical alignment |

Exact match = full weight. Adjacent values = 50% partial credit scaled by distance. Group compatibility = average of all active member scores.

---

## Email Templates (Utils/email.py — 45KB)

All emails use consistent HTML with dark header, colored badge, responsive tables.

| Function | Trigger | Badge |
|----------|---------|-------|
| `send_verification_email` | User registers | — |
| `send_approval_email` | Writer/student approved | Green |
| `send_rejection_email` | Writer/student rejected | Red |
| `send_revoked_email` | Access revoked | Yellow |
| `send_message_notification` | New message | — |
| `send_booking_confirmed_email` | Viewing booked | Green |
| `send_booking_cancelled_email` | Viewing cancelled | Red |
| `send_booking_reminder_email` | 24hrs before viewing (cron) | Blue |
| `send_password_reset_email` | Forgot password | — |

---

## Scheduled Jobs

APScheduler runs inside the app (`main.py`):
```python
scheduler = BackgroundScheduler()
scheduler.add_job(send_viewing_reminders, "cron", hour=9, minute=0)
```

`Utils/scheduler.py` finds all confirmed bookings for tomorrow and sends reminder emails to both parties. Handles both listing and sublet bookings with null checks.

---

## Cascade Delete Order

**Delete Listing:** messages → conversations → images (+ Cloudinary) → health scores → saved → flags → viewing bookings → viewing slots → viewing availabilities → listing

**Delete Property:** for each listing (above) → reviews → property

**Delete User Account:** marketplace items + images + conversations → sublets + images → posts + cover images → profile photo → conversations + messages → viewing bookings → saved → flags → reviews → settings tables → user

All deletes use `synchronize_session=False` to prevent autoflush FK violations.

---

## Draft System

All content defaults to DRAFT on creation:

| Content | Default | Published State |
|---------|---------|-----------------|
| Listing | `DRAFT` | `ACTIVE` |
| Sublet | `DRAFT` | `ACTIVE` |
| Post | `DRAFT` | `PUBLISHED` |
| Marketplace Item | `DRAFT` | `AVAILABLE` |

Each has `publish` / `unpublish` endpoints. Posts also have `archive` / `unarchive` (unarchive sets PUBLISHED not DRAFT).

---

## Environment Variables (config.py)

```
HGUSER, HGPASSWORD, HGDB, HGHOST, HGPORT     # PostgreSQL (Neon)
JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
CRIBB_RESEND_API                                # Resend email
FRONTEND_URL                                    # For email links + CORS
EMAIL_VERIFY_EXPIRE_MINUTES
ADMIN_SECRET                                    # Admin seed endpoint
CRIBB_CLOUDINARY_CLOUD_NAME, CRIBB_CLOUDINARY_API_KEY, CRIBB_CLOUDINARY_API_SECRET
FORMSPREE_ENDPOINT                              # Writer/write-access applications
ANTHROPIC_API_KEY                               # Claude API for AI compare
```

DATABASE_URL is a computed field: `postgresql://{user}:{pass}@{host}:{port}/{db}?sslmode=require`

CORS is set to `allow_origins=[settings.FRONTEND_URL]` with `allow_credentials=True`.

---

## Security Features

- **Rate limiting** on all auth endpoints via slowapi (see table above)
- **Row locking** (`with_for_update()`) on viewing slot booking to prevent double-booking
- **Identity verification check** on listing creation — unverified landlords blocked
- **MIME type validation** on all image uploads (JPEG, PNG, WebP)
- **Landlord detection** uses `isinstance(current_user, Landlord)` not `hasattr` in messages.py
- **CORS** restricted to `FRONTEND_URL` only (not wildcard)
- **`role == UserRole.WRITER.value`** in security.py (not string comparison)

---

## Known Issues / Gotchas

- **Route ordering matters:** Static paths (`/drafts/my`, `/my/posts`, `/groups/my/group`, `/groups/browse`) must be defined BEFORE dynamic paths (`/{id}`, `/{slug}`) in each router file, otherwise FastAPI matches the static segment as an ID.
- **ViewingBooking has 2 FKs to users** (student_id + owner_id): relationships require `foreign_keys=` to disambiguate.
- **ViewingAvailability has 2 FKs to users** (owner_id) and landlords (landlord_id): same foreign_keys fix needed.
- **Landlord is a separate table** from User — no FK between them. `get_current_user` returns either a User or Landlord object based on JWT role claim.
- **Writer login** still uses `OAuth2PasswordRequestForm` (form data), not JSON like user/landlord login.
- **Render deployment:** Python 3.14 on Render, 3.11 locally. `watchfiles` excluded from requirements.txt (Rust compilation fails on Render). `apscheduler` added for daily reminder cron.
- **Viewing schemas** use `model_validator` to enforce "provide listing_id or sublet_id, not both" on create requests.
- **Roommate group members** use soft delete (is_active=False). Accept invite/request checks for existing inactive member and reactivates instead of creating duplicate.
- **slowapi requires `request: Request`** as the first parameter on every rate-limited function. Missing it causes a startup crash.
- **`get_landlord_profile`** in helpers.py is used by `Routes/landlord.py` — do NOT delete it. Queries by `Landlord.id` (correct).
- **DB enums use UPPERCASE names** (STUDENT, DRAFT, PENDING) — SQLAlchemy default. Do NOT use `values_callable` wrapper.
- **`create_all()` doesn't add columns** to existing tables — always use ALTER TABLE for migrations.
- **LandlordInvite** stores enum values as lowercase strings in VARCHAR columns (not DB Enum type). Convert back with `PropertyType(invite.property_type)` on claim.

# Cribb — Project Context for Claude Code

Cribb is a student-first housing platform built for University of Guelph students.
This file is loaded automatically every session. Read it before making changes.

## Repo layout

This is a monorepo with two top-level folders:

- `Frontend/` — Next.js (App Router) + React + TypeScript + Tailwind CSS + Framer Motion + Mapbox GL JS
- `Backend/` — FastAPI + SQLAlchemy + PostgreSQL (Neon) + APScheduler + WebSockets, hosted on Render

External services: Resend (email), Cloudinary + Amazon S3 (media), Anthropic (AI features).

## Roles

- **David** (you, the user) — owns frontend and product direction.
- **OJ** — owns backend. Backend changes are sent to him as structured fix lists, not edited live.

**Important:** Do not assume the backend can be changed in this session. If a frontend bug requires backend work, do not modify `Backend/` — instead, append a clear, structured entry to a section called "Backend fixes for OJ" in your final response, with: file path, what's wrong, what's needed, and why.

## Frontend conventions (read these before editing)

### Standard amenities
`src/lib/amenities.ts` is the single source of truth. 14 boolean fields shared across listings and sublets. Both detail pages use `getAmenityChecklist()`. Do not duplicate this list anywhere else — extend it here if a new amenity is needed (and flag it as a backend column add for OJ).

### Mock data pattern (critical)
Detail pages use **synchronous mock data only**. No `useEffect`, no API calls, no async fetching on detail pages. This was a deliberate fix because backend calls were hanging and leaving pages blank.

Files:
- `src/lib/mock-data.ts` — listings (with amenities + health score IDs)
- `src/lib/mock-sublets.ts` — sublets

If a page is showing blank or stuck loading, the first thing to check is whether someone added a `useEffect` + fetch — remove it and use the mock data pattern instead.

### Detail pages
- Reviews are **stars-only** — no comment text. This is for legal reasons. Do not add comment fields, ever.
- Health score breakdown appears on both listing detail and sublet detail.
- Sticky sidebar contains a map placeholder.
- Sublet cards link to `/sublets/[id]`.

### Routing
- `/app/the-bubble` is the live community hub (~1,047 lines).
- `/app/demand-board` exists but is a **dead placeholder** — Demand Board was scrapped. Don't build features into it.

### Types
`src/types/index.ts` holds extended types including amenity fields. Keep it in sync with `amenities.ts`.

## Brand & content guardrails (these are hard rules)

- **Never name competing platforms** in any user-facing copy or content: no "Cannon", no "apartments.com", no "realtor.ca", etc.
- **Cannon is NOT positioned as a competitor.** It's student-first and co-owned by the CSA and Guelph Campus Co-op. Do not write copy that frames Cribb as "vs Cannon."
- **Roommate matching = friends finding housing together**, not stranger-matching. Copy should reflect this.
- **Cribb does not handle leases.** Do not write copy or build features that imply lease management.

## Brand tokens

- Typography: **Inter** (Bold/800 for headings)
- Colors:
  - Primary orange `#FF6B35`
  - Dark navy `#1B2D45`
  - Cream `#FAF8F4`
  - Green `#4ADE80`
  - Amber `#FFB627`
  - Teal `#2EC4B6`

## Cribb Score (hybrid scoring)

Starts at launch as **100% property score** (price, location, amenities, listing completeness) because there are zero reviews. As reviews accumulate, weighting shifts toward tenant reviews. The scoring logic must work correctly with zero reviews on day one — don't introduce divide-by-zero or "no data" empty states.

## Working style

- Ship first, refine on browser review. Iterate fast.
- When in doubt about a frontend pattern, match what's already in `src/lib/` and existing detail pages rather than inventing a new approach.
- For non-trivial changes, briefly explain the plan before editing files.
- After making changes, run `npm run build` (or `tsc --noEmit`) to catch type errors before declaring done.

## Common commands

Frontend (run from `Frontend/`):
- `npm run dev` — local dev server
- `npm run build` — production build (good for catching type errors)
- `npm run lint`

Backend (David doesn't run this; OJ does — but for reference, from `Backend/`):
- `uvicorn main:app --reload`

## When starting a session

If the user says "let's fix bugs," ask them to either list the bugs or point to the affected pages/files before opening files. Don't go scanning the whole repo unprompted.