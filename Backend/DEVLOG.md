# Dev Log — Student Housing Platform

## February 17, 2025

1. **Project Structure** 

Set up the full FastAPI project structure
```
Backend/
├── main.py              # FastAPI entry point
├── config.py            # Environment variables via pydantic-settings
├── tables.py            # Database tables
├── helpers.py 
├── .env 
├── Utils/
│   └── security.py      # Password hashing, JWT, auth dependencies
├── Schemas/
│   ├── userSchema.py    # Schemas relating to users
│   ├── landlordSchema.py # Schemas relating to landlords
│   └── adminSchema.py    # Schemas relating to admins
│   ├── propertySchema.py
│   ├── listingSchema.py
│   ├── reviewSchema.py
│   ├── savedSchema.py
│   ├── flagSchema.py
│   └── healthscoreSchema.py
└── Routes/
|   └── user.py          # All user-related API endpoints
│   ├── landlord.py      # All landlord-related API endpoints 
│   └── admin.py         # All admin-related API endpoints
│   ├── property.py
│   ├── listing.py
│   ├── review.py
│   ├── saved.py
│   ├── flag.py
│   └── healthscore.py
└── Tests/
    ├── conftest.py      # Info related to tests  
    ├── constants.py     # Constants related to tests
    ├── test_user.py     # All user-related tests 
    ├── test_landlord.py # All landlord-related tests
    └── test_admin.py    # All admin-related tests
    ├── test_property.py
    ├── test_listing.py
    ├── test_review.py
    ├── test_saved.py
    ├── test_flag.py
    └── test_healthscore.py
```

# Dev Log — Student Housing Platform

## February 17, 2025

### Session 3: Property, Listing, Review, Saved, Flag & Health Score Systems

---

**1. Updated Project Structure**

```
Backend/
├── main.py
├── config.py
├── tables.py
├── helpers.py           # Shared scoring logic for health scores
├── .env
├── Utils/
│   └── security.py
├── Schemas/
│   ├── userSchema.py
│   ├── landlordSchema.py
│   ├── adminSchema.py
│   ├── propertySchema.py
│   ├── listingSchema.py
│   ├── reviewSchema.py
│   ├── savedSchema.py
│   ├── flagSchema.py
│   └── healthscoreSchema.py
├── Routes/
│   ├── user.py
│   ├── landlord.py
│   ├── admin.py
│   ├── property.py
│   ├── listing.py
│   ├── review.py
│   ├── saved.py
│   ├── flag.py
│   └── healthscore.py
└── Tests/
    ├── conftest.py
    ├── constants.py
    ├── test_user.py
    ├── test_landlord.py
    ├── test_admin.py
    ├── test_property.py
    ├── test_listing.py
    ├── test_review.py
    ├── test_saved.py
    ├── test_flag.py
    └── test_healthscore.py
```

**2. Property Schemas**

- `PropertyCreate` — full property details (title, address, coords, type, rooms, amenities, distance info)
- `PropertyUpdate` — all fields optional for partial updates
- `PropertyResponse` — full property info with timestamps

**3. Property Endpoints — Complete**

| Method | Endpoint | Who | What It Does |
|--------|----------|-----|-------------|
| POST | `/api/properties/` | Landlord | Create a property |
| GET | `/api/properties/` | Anyone | Browse all properties |
| GET | `/api/properties/me/all` | Landlord | View own properties only |
| GET | `/api/properties/{id}` | Anyone | View single property |
| PATCH | `/api/properties/{id}` | Landlord (owner) | Update property fields |
| DELETE | `/api/properties/{id}` | Landlord (owner) | Delete + cascade listings/reviews |

Key design decisions:
- `get_property_owned_by` helper verifies ownership before update/delete
- `/me/all` route placed before `/{id}` to avoid FastAPI matching "me" as an integer
- Delete cascades: listings → images, scores, saves, flags + reviews on the property

**4. Listing Schemas**

- `ListingCreate` — rent details, lease type, move-in date, sublet fields, gender preference
- `ListingUpdate` — partial updates including status changes (active/rented/expired)
- `SubletConvert` — dedicated schema for converting a listing to sublet
- `ListingResponse` — basic listing info for landlord management
- `ListingDetailResponse` — full listing with property + landlord info baked in (what students see when browsing)

**5. Listing Endpoints — Complete**

| Method | Endpoint | Who | What It Does |
|--------|----------|-----|-------------|
| POST | `/api/listings/` | Landlord | Create listing on their property |
| GET | `/api/listings/` | Anyone | Browse with full filters + sort + pagination |
| GET | `/api/listings/me/all` | Landlord | View own listings |
| GET | `/api/listings/{id}` | Anyone | View listing detail (increments view count) |
| PATCH | `/api/listings/{id}` | Landlord (owner) | Update listing fields |
| PATCH | `/api/listings/{id}/sublet` | Landlord (owner) | Convert to sublet |
| DELETE | `/api/listings/{id}` | Landlord (owner) | Delete + cascade images/scores/saves/flags |

Filters available on `GET /api/listings/`:
- **Price:** `price_min`, `price_max`
- **Property:** `property_type`, `is_furnished`, `has_parking`, `has_laundry`, `utilities_included`
- **Distance:** `distance_max` (km from campus)
- **Lease:** `lease_type`, `is_sublet`, `gender_preference`
- **Date:** `move_in_before`, `move_in_after`
- **Status:** `status` (defaults to active)
- **Sorting:** `sort_by` (rent_per_room, distance_to_campus_km, created_at) + `sort_order` (asc/desc)
- **Pagination:** `skip`, `limit` (max 100)

Key design decisions:
- Flat listing structure (`/api/listings`) not nested under properties — students search listings, not properties
- `ListingDetailResponse` joins listing + property + landlord in a single response so the frontend doesn't need multiple calls
- View count increments on every `GET /{id}` hit
- Ownership verified through property → landlord chain
- Sublet conversion is a separate endpoint to keep the flow explicit

**6. Review Schemas**

- `ReviewCreate` — 4 ratings (1-5) + would_rent_again + optional comment, with `field_validator` for rating range
- `ReviewUpdate` — partial updates with same validation
- `ReviewResponse` — full review info

**7. Review Endpoints — Complete**

| Method | Endpoint | Who | What It Does |
|--------|----------|-----|-------------|
| POST | `/api/reviews/` | Verified student | Create review (one per property) |
| GET | `/api/reviews/` | Anyone | Browse reviews (filter by property_id or landlord_id) |
| GET | `/api/reviews/me/all` | Logged in | View own reviews |
| GET | `/api/reviews/{id}` | Anyone | View single review |
| PATCH | `/api/reviews/{id}` | Owner | Update own review |
| DELETE | `/api/reviews/{id}` | Owner | Delete own review |

Key design decisions:
- `require_verified_student` dependency blocks unverified emails from writing reviews
- One review per student per property (unique constraint checked before insert)
- `landlord_id` auto-linked from the property's landlord — students don't need to know it
- Review filters support both `property_id` and `landlord_id` query params

**8. Saved Listing Schemas**

- `SavedListingResponse` — basic saved record (id, student_id, listing_id, timestamp)
- `SavedListingDetailResponse` — saved record with listing + property info for the saved listings page

**9. Saved Listing Endpoints — Complete**

| Method | Endpoint | Who | What It Does |
|--------|----------|-----|-------------|
| POST | `/api/saved/{listing_id}` | Logged in | Bookmark a listing |
| DELETE | `/api/saved/{listing_id}` | Logged in | Remove bookmark |
| GET | `/api/saved/` | Logged in | View all saved listings with details |
| GET | `/api/saved/{listing_id}/check` | Logged in | Check if a listing is saved (returns boolean) |

Key design decisions:
- Duplicate save prevention (409 if already saved)
- List endpoint returns full listing + property info so the saved page renders without extra API calls
- Check endpoint useful for frontend to toggle save/unsave button state

**10. Flag Schemas**

- `FlagStatus` enum — `PENDING`, `REVIEWED`, `RESOLVED` (used consistently across flag creation and admin management)
- `FlagCreate` — listing_id and/or review_id + reason
- `FlagResponse` — full flag info

**11. Flag Endpoints — Complete**

| Method | Endpoint | Who | What It Does |
|--------|----------|-----|-------------|
| POST | `/api/flags/` | Logged in | Report a listing or review |
| GET | `/api/flags/me` | Logged in | View own flags |
| GET | `/api/flags/{id}` | Logged in (owner) | View single flag |

Key design decisions:
- Must provide at least one target (listing_id or review_id) — 400 if neither
- Duplicate flag prevention per user per target (409 if already flagged)
- Users can only view their own flags; admin endpoints handle flag management
- Flag status uses `FlagStatus.PENDING` enum on creation

**12. Health Score Schemas**

- `HealthScoreResponse` — all sub-scores + overall score + timestamp

**13. Health Score Endpoints — Complete**

| Method | Endpoint | Who | What It Does |
|--------|----------|-----|-------------|
| POST | `/api/health-scores/{listing_id}/compute` | Anyone | Compute or recompute health score |
| GET | `/api/health-scores/{listing_id}` | Anyone | Get cached health score |

Scoring logic (in `helpers.py`):
- **Price vs Market (30%)** — compares listing's rent_per_room to market average for same property type. Cheaper = higher score.
- **Landlord Reputation (30%)** — average of all 4 review categories for the landlord, scaled 0-100. Neutral (50) when no reviews.
- **Maintenance (20%)** — average maintenance_speed rating, scaled 0-100. Neutral when no reviews.
- **Lease Clarity (20%)** — completeness check across 8 fields (move-in date, lease type, rent info, sublet dates, address, distance, transit, utilities). More info = higher score.
- **Overall** — weighted average of all four sub-scores.

Key design decisions:
- Upsert pattern: recomputing updates the existing record rather than creating duplicates
- Scores cached in DB so they don't need recomputation on every page view
- Public endpoints — no auth required to view scores
- Sub-scores individually available so frontend can show breakdowns

**14. Test Coverage**

| File | Tests | What's Covered |
|------|-------|---------------|
| test_user.py | 30 | Register, login, profile CRUD, password change, role switch, delete, get by ID |
| test_landlord.py | 20 | Profile view/update, verification, self-delete + cascade, public profiles, properties, reviews |
| test_admin.py | 24 | Dashboard stats, user/landlord/listing/review CRUD, verification management, flag resolve/dismiss, role gating |
| test_property.py | 19 | Create, browse, my properties, update, delete + cascade, ownership checks |
| test_listing.py | 38 | Create, browse, filters (price/furnished/type/lease/sublet/distance/utilities), sorting, pagination, update, sublet conversion, delete, ownership |
| test_review.py | 24 | Create (verified only), duplicate block, rating validation, auto-link landlord, browse with filters, my reviews, update, delete, ownership |
| test_saved.py | 12 | Save, duplicate block, unsave, list saved with details, only own saves, check status |
| test_flag.py | 13 | Flag listing, flag review, must target something, duplicate block, my flags, view own flag, cannot view others |
| test_healthscore.py | 11 | Compute basic, compute with reviews, recompute updates, score ranges, get cached, not computed yet, public access, lease clarity comparison, reputation reflects reviews |
| **Total** | **191** | |

**15. Bug Fixes Along the Way**

- Route ordering: moved `/me/all` before `/{id}` in property and listing routers to prevent FastAPI matching "me" as an integer param
- Student collision: added `STUDENT_THREE` constant to avoid duplicate registration when tests need 3 distinct users
- Enum consistency: switched all raw string assignments to enum values (`FlagStatus.PENDING`, `ListingStatus.ACTIVE`, etc.)
- Router prefix typo: fixed `/api/save` → `/api/saved` in conftest
- Health score model: removed `computed_at` keyword (column doesn't exist on `HousingHealthScore` table, uses auto `created_at`)
- Sparse property test: added required `walk_time_minutes` and `bus_time_minutes` fields to avoid NOT NULL constraint
- Date types: ensured `move_in_date` uses Python `date` objects not strings (SQLite requirement)

---

### Platform Status — All Core Features Complete

**Auth & Users:** Register, login, JWT, profile CRUD, role switching, account deletion
**Landlords:** Profile management, verification flow, public profiles with computed stats, self-delete with cascade
**Admin Panel:** Full CRUD over users/landlords/listings/reviews/flags, verification approval, dashboard stats
**Properties:** Landlord CRUD with ownership enforcement, public browsing
**Listings:** Full CRUD, sublet conversion, comprehensive filters/sort/pagination, view tracking
**Reviews:** Verified-only creation, one per property, auto-linked landlord, owner editing
**Saved Listings:** Bookmark/unbookmark, saved page with full details, check status
**Flags:** Report listings or reviews, duplicate prevention, admin resolution flow
**Health Scores:** 4-component scoring system, cached computation, public access

### Up Next

- Image upload handling for listing photos
- Email verification flow (send verification email on register)
- Search endpoint (full-text search across listings and properties)
- Rate limiting on public endpoints
- Frontend integration