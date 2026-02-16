# Dev Log — Student Housing Platform

## February 16, 2025

1. **Project Structure** 

Set up the full FastAPI project structure
```
Backend/
├── main.py              # FastAPI entry point
├── config.py            # Environment variables via pydantic-settings
├── tables.py            # Database tables
├── helpers.py 
├── .env 
├── utils/
│   └── security.py      # Password hashing, JWT, auth dependencies
├── Schemas/
│   ├── userSchema.py    # Schemas relating to users
│   ├── landlordSchema.py # Schemas relating to landlords
│   └── adminSchema.py    # Schemas relating to admins
└── Routes/
|   └── user.py          # All user-related API endpoints
│   ├── landlord.py      # All landlord-related API endpoints 
│   └── admin.py         # All admin-related API endpoints
└── Tests/
    ├── conftest.py      # Info related to tests  
    ├── constants.py     # Constants related to tests
    ├── test_user.py     # All user-related tests 
    ├── test_landlord.py # All landlord-related tests
    └── test_admin.py    # All admin-related tests
```

**2. Landlord Schemas**

Created request/response schemas for the landlord system:

- `LandlordUpdate` — partial profile updates (company_name, phone)
- `LandlordResponse` — full profile returned to the landlord themselves
- `LandlordPublicResponse` — what students see (includes computed avg ratings, would_rent_again %, property/review counts, landlord first/last name pulled from users table)
- `LandlordPropertyResponse` — property info for the landlord's properties endpoint
- `LandlordReviewResponse` — review info for the landlord's reviews endpoint

**3. Landlord Endpoints — Complete**

| Method | Endpoint | Who | What It Does |
|--------|----------|-----|-------------|
| GET | `/api/landlords/me` | Landlord | View own landlord profile |
| PATCH | `/api/landlords/me` | Landlord | Update company name / phone |
| POST | `/api/landlords/me/verify` | Landlord | Request identity verification |
| DELETE | `/api/landlords/me` | Landlord | Delete landlord profile, revert to student |
| GET | `/api/landlords/{id}` | Anyone | Public profile + avg ratings + stats |
| GET | `/api/landlords/{id}/properties` | Anyone | List landlord's properties |
| GET | `/api/landlords/{id}/reviews` | Anyone | List reviews on landlord |

Key design decisions:
- `require_landlord` dependency blocks students from landlord-only endpoints
- `compute_landlord_stats` helper calculates avg ratings from the reviews table on the fly
- Public profile pulls first/last name through the `Landlord → User` relationship
- Self-delete cascades all properties → listings → images/scores/saves/flags, but keeps user account as student

**4. Admin Schemas**

- `AdminUserResponse` — full user info for admin user management
- `AdminLandlordResponse` — landlord info with linked user name/email
- `AdminListingResponse` — listing summary for admin listing management
- `AdminStatsResponse` — platform-wide counts (users, landlords, properties, listings, reviews, pending flags)

**5. Admin Endpoints — Complete**

All endpoints gated behind `require_admin` dependency:

| Method | Endpoint | What It Does |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform dashboard counts |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/users/{id}` | View specific user |
| DELETE | `/api/admin/users/{id}` | Delete user + cascade everything (cannot delete other admins) |
| GET | `/api/admin/landlords` | List all landlords with user info |
| DELETE | `/api/admin/landlords/{id}` | Delete landlord, cascade properties/listings, revert user to student |
| PATCH | `/api/admin/landlords/{id}/verify` | Approve identity verification |
| PATCH | `/api/admin/landlords/{id}/unverify` | Revoke identity verification |
| GET | `/api/admin/listings` | List all listings |
| DELETE | `/api/admin/listings/{id}` | Delete listing + images/scores/saves/flags |
| DELETE | `/api/admin/reviews/{id}` | Delete review + associated flags |
| GET | `/api/admin/flags` | List all pending flags |
| PATCH | `/api/admin/flags/{id}/resolve` | Mark flag as resolved |
| PATCH | `/api/admin/flags/{id}/dismiss` | Mark flag as reviewed/dismissed |

Key design decisions:
- `cascade_delete_landlord` shared helper handles the full teardown chain (used by both admin delete and landlord self-delete)
- Admin deleting a landlord keeps the user account (reverts to student)
- Admin deleting a user nukes everything including landlord profile
- Admins cannot delete other admins (protection against accidental lockout)
- Admin accounts can only be created directly in the DB, no signup endpoint

**6. Test Infrastructure Refactor**

Moved from duplicated boilerplate in each test file to a shared setup:

- `conftest.py` — single source for DB engine, session, FastAPI app, TestClient, all fixtures and helper functions. Pytest auto-discovers fixtures without explicit imports.
- `constants.py` — all URLs, status codes, test users, passwords, emails, role payloads, and expected messages in one place. Change a value once, every test updates.
- Test files are now pure test logic — no DB setup, no app creation, no duplicate helpers.

Shared helpers created:
- `register_user`, `login_user`, `register_and_get_token` — auth flow
- `get_me`, `update_me`, `change_password`, `switch_role`, `delete_me` — user actions
- `make_landlord`, `get_landlord_id` — landlord setup
- `make_admin` — creates admin directly in DB (bypasses signup)
- `seed_property`, `seed_listing`, `seed_review`, `seed_flag` — DB seeding for tests that need pre-existing data
- `db` fixture — direct DB session for assertion queries

**7. Test Coverage**

| File | Tests | What's Covered |
|------|-------|---------------|
| test_user.py | 30 | Register, login, profile CRUD, password change, role switch, delete, get by ID |
| test_landlord.py | 20 | Profile view/update, verification, self-delete + cascade, public profiles, properties, reviews |
| test_admin.py | 24 | Dashboard stats, user/landlord/listing/review CRUD, verification management, flag resolve/dismiss, role gating |
| **Total** | **74** | |

**8. Bug Fixes Along the Way**

- Test file naming: renamed from `userTest.py` → `test_user.py` (pytest convention `test_*.py`)
- Relative imports: removed `.` prefix from test imports (no `__init__.py` needed in Tests/)
- `seed_property`: added missing NOT NULL fields (`walk_time_minutes`, `bus_time_minutes`, `utilities_included`)
- `seed_listing`: changed `move_in_date` from string to `date` object (SQLite requirement)
- Flag status: changed raw string assignment to `FlagStatus` enum in admin resolve/dismiss endpoints
- Session conflicts: saved entity IDs before cascade deletes to avoid `ObjectDeletedError`
