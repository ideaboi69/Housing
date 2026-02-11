# Dev Log — Student Housing Platform

## February 11, 2025

1. **Project Structure** 

Set up the full FastAPI project structure
```
Backend/
├── main.py              # FastAPI entry point
├── config.py            # Environment variables via pydantic-settings
├── tables.py            # Database tables
├── .env 
├── utils/
│   └── security.py      # Password hashing, JWT, auth dependencies
├── Schemas/
    └── restSchemas.py   # Enums and schemas for the rest of the .py's
│   └── userSchemas.py   # Enums and schemas for user.py
└── Routes/
    └── user.py          # All user-related API endpoints
```

**2. Database Setup**

- Connected to PostgreSQL via SQLAlchemy
- Session management handled through FastAPI's dependency injection (`get_db`)
- Tables auto-create on app startup via `Base.metadata.create_all()`

**3. Database Tables Created**

- `users` — students, landlords, and admins all in one table with a role enum
- `landlords` — extends users with landlord-specific fields (company, phone, verification)
- `properties` — physical addresses with coordinates, amenities, campus distance
- `listings` — rent details, lease type, sublet support, status tracking
- `listing_images` — image URLs tied to listings with display ordering
- `reviews` — structured 1-5 ratings across 4 categories + "would rent again" boolean
- `housing_health_scores` — cached composite scores per listing (price vs market, landlord rep, maintenance, lease clarity)
- `flags` — moderation reports on listings or reviews
- `saved_listings` — student bookmarks

Key design decisions:
- Shared `users` table for auth (students and landlords use the same login flow)
- Landlord profile is a separate linked table created on role switch
- Unique constraints to prevent duplicate reviews and duplicate saves

**4. Pydantic Schemas**

Created request/response schemas for the user system:

- `UserCreate` — registration payload with @uoguelph.ca email validation and password min length
- `UserLogin` — email + password
- `UserUpdate` — partial profile updates (name, email)
- `PasswordChange` — current + new password with validation
- `RoleSwitch` — uses the `UserRole` enum directly, includes optional landlord fields (company_name, phone)
- `UserResponse` — what gets sent back to the client (no password hash)
- `TokenResponse` — JWT + user data on login/register

**5. Security Layer**

- Passwords hashed with bcrypt
- JWT tokens with configurable expiry (default 30 min)
- `get_current_user` dependency extracts user from Authorization header
- `require_role` dependency for future role-gated endpoints

**6. User Endpoints — Complete**

All user-related endpoints are done:

| Method | Endpoint | What It Does |
|--------|----------|-------------|
| POST | `/api/users/register` | Create account (defaults to student role) |
| POST | `/api/users/login` | Authenticate, returns JWT |
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update name or email |
| PATCH | `/api/users/me/password` | Change password (requires current password) |
| PATCH | `/api/users/me/role` | Switch between student and landlord |
| DELETE | `/api/users/me` | Delete account + associated landlord profile |
| GET | `/api/users/{user_id}` | View a user's public profile |

Role switch behavior:
- Student → Landlord: creates a landlord profile row if one doesn't exist
- Landlord → Student: changes role but keeps landlord profile in DB for future re-activation

---

### Up Next

- Landlord routes (profile management, identity verification)
- Property + Listing CRUD (landlord-only creation, public browsing)
- Review system (student-only creation, public reading)
- Listing filters and search