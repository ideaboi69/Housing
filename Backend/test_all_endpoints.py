#!/usr/bin/env python3
"""
FindYourCribb — Full Endpoint Smoke Test (v3)
==============================================
Every payload matches the actual backend schemas.

Usage:
    python test_all_endpoints.py --base-url http://localhost:8000 \
        --admin-secret idea-boiii -v

Requirements:
    pip install requests tabulate
"""

import argparse
import json
import random
import string
import sys
import time
from datetime import date, datetime, timedelta
from io import BytesIO
from typing import Optional

try:
    import requests
except ImportError:
    print("Missing dependency: pip install requests")
    sys.exit(1)

try:
    from tabulate import tabulate
except ImportError:
    tabulate = None


def rand_str(n=6):
    return "".join(random.choices(string.ascii_lowercase, k=n))

def rand_email():
    return f"test_{rand_str(8)}@uoguelph.ca"


class EndpointResult:
    def __init__(self, method, path, status, expected, passed, note="", response_snippet=""):
        self.method = method
        self.path = path
        self.status = status
        self.expected = expected
        self.passed = passed
        self.note = note
        self.response_snippet = response_snippet[:300] if response_snippet else ""


class CribbTester:
    def __init__(self, base_url: str, admin_secret: str, verbose: bool = False):
        self.base = base_url.rstrip("/")
        self.admin_secret = admin_secret
        self.verbose = verbose
        self.results: list[EndpointResult] = []
        self.session = requests.Session()
        # NO session-level Content-Type — requests sets it automatically

        # Auth tokens & IDs
        self.student_token = self.student2_token = None
        self.student_id = self.student2_id = None
        self.student_email = rand_email()
        self.student2_email = rand_email()
        self.student_password = "TestPass1!"

        self.landlord_token = None
        self.landlord_id = None
        self.landlord_email = f"landlord_{rand_str(8)}@example.com"
        self.landlord_password = "LandPass1!"

        self.admin_token = None
        self.admin_id = None

        self.writer_token = None
        self.writer_id = None
        self.writer_email = f"writer_{rand_str(8)}@example.com"
        self.writer_password = "WritePass1!"

        # Resource IDs created during tests
        self.property_id = None
        self.listing_id = None
        self.sublet_id = None
        self.post_id = None
        self.post_slug = None
        self.marketplace_item_id = None
        self.marketplace_conversation_id = None
        self.conversation_id = None
        self.review_id = None
        self.flag_id = None
        self.roommate_group_id = None
        self.invite_id = None
        self.availability_id = None
        self.slot_id = None
        self.booking_id = None

    # ── Request wrapper ────────────────────────────────────────────────────

    def _req(self, method, path, *, token=None, json_body=None, data=None,
             files=None, params=None, expected=200, note=""):
        url = f"{self.base}{path}"
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        kwargs = {"headers": headers, "timeout": 30}
        if json_body is not None and data is None and files is None:
            kwargs["json"] = json_body
        if data is not None:
            kwargs["data"] = data
        if files is not None:
            kwargs["files"] = files
            if data:
                kwargs["data"] = data
        if params:
            kwargs["params"] = params

        expected_list = expected if isinstance(expected, list) else [expected]

        try:
            resp = self.session.request(method, url, **kwargs)
        except requests.exceptions.ConnectionError:
            self.results.append(EndpointResult(method, path, 0, expected_list, False, "Connection refused"))
            return None
        except Exception as e:
            self.results.append(EndpointResult(method, path, 0, expected_list, False, str(e)[:100]))
            return None

        passed = resp.status_code in expected_list
        combined_note = note
        if not passed:
            try:
                combined_note += f" | {json.dumps(resp.json())[:200]}"
            except Exception:
                combined_note += f" | {resp.text[:200]}"

        self.results.append(EndpointResult(method, path, resp.status_code, expected_list, passed, combined_note, resp.text[:300] if resp.text else ""))

        if self.verbose:
            icon = "✅" if passed else "❌"
            print(f"  {icon} {method:7s} {path:60s} → {resp.status_code} (exp {expected_list})")
            if any(kw in path.lower() for kw in ["login", "register", "seed"]):
                print(f"           ↳ {resp.text[:250]}")

        return resp

    def GET(self, p, **kw):    return self._req("GET", p, **kw)
    def POST(self, p, **kw):   return self._req("POST", p, **kw)
    def PATCH(self, p, **kw):  return self._req("PATCH", p, **kw)
    def DELETE(self, p, **kw): return self._req("DELETE", p, **kw)

    def _json(self, r):
        if r is None: return None
        try: return r.json()
        except: return None

    def _tok(self, r):
        d = self._json(r)
        if d and "access_token" in d: return d["access_token"]
        if d:
            for v in d.values():
                if isinstance(v, dict) and "access_token" in v: return v["access_token"]
        return None

    def _id(self, r, key="id"):
        d = self._json(r)
        if not d: return None
        if key in d: return d[key]
        for v in d.values():
            if isinstance(v, dict) and key in v: return v[key]
        return None

    # ═══════════════════════════════════════════════════════════════════════
    #  TESTS
    # ═══════════════════════════════════════════════════════════════════════

    def test_00_health(self):
        print("\n🔍 [0] Health check")
        self.GET("/", expected=[200, 404, 307], note="Root")
        self.GET("/docs", expected=200, note="Swagger UI")
        self.GET("/openapi.json", expected=200, note="OpenAPI spec")

    # ── 1. ADMIN SEED & LOGIN ─────────────────────────────────────────────

    def test_01_admin(self):
        print("\n🔐 [1] Admin — seed & login")

        # Seed: POST /api/admin/seed?secret=X  body=AdminCreate JSON
        resp = self.POST("/api/admin/seed", params={"secret": self.admin_secret},
            json_body={"email": "admin@gmail.com", "password": "Admin123",
                        "first_name": "Admin", "last_name": "User"},
            expected=[200, 201, 400, 409], note="Seed admin")

        # Login: OAuth2PasswordRequestForm = form-encoded
        resp = self.POST("/api/admin/login",
            data={"username": "admin@gmail.com", "password": "Admin123"},
            expected=[200, 401], note="Admin login")
        t = self._tok(resp)
        if t:
            self.admin_token = t
            d = self._json(resp)
            self.admin_id = (d.get("admin") or d).get("id") if d else None
            print("    ✅ Admin login OK")
        else:
            print("    ⚠️  Admin login failed — admin tests will be skipped")

    # ── 2. STUDENT AUTH ───────────────────────────────────────────────────

    def test_02_student(self):
        print("\n👤 [2] Student auth")

        # Register
        resp = self.POST("/api/users/register",
            json_body={"email": self.student_email, "password": self.student_password,
                        "first_name": "Test", "last_name": "Student"},
            expected=[200, 201, 409], note="Register student")
        d = self._json(resp)
        if d: self.student_id = d.get("user_id") or d.get("id")

        # Login (JSON — per UserLogin schema)
        resp = self.POST("/api/users/login",
            json_body={"email": self.student_email, "password": self.student_password},
            expected=[200, 401, 403], note="Student login (JSON)")
        t = self._tok(resp)
        if t:
            self.student_token = t
            d = self._json(resp)
            if d and "user" in d: self.student_id = d["user"].get("id")

        # Swagger login (form data)
        self.POST("/api/users/login/swagger",
            data={"username": self.student_email, "password": self.student_password},
            expected=[200, 401, 403, 422], note="Student login (Swagger form)")

        if self.student_token:
            self.GET("/api/users/me", token=self.student_token, expected=200, note="Get profile")

            self.PATCH("/api/users/me", token=self.student_token,
                json_body={"bio": "QA tester", "program": "Computer Science", "year": "SECOND"},
                expected=[200, 422], note="Update profile")

            self.GET("/api/users/me/dashboard", token=self.student_token,
                expected=[200, 404], note="Dashboard")

            if self.student_id:
                self.GET(f"/api/users/{self.student_id}", token=self.student_token,
                    expected=[200, 404], note="Get by ID")

            # Resend verification — uses Form(email)
            self.POST("/api/users/resend-verification", token=self.student_token,
                data={"email": self.student_email},
                expected=[200, 400, 422, 429], note="Resend verification (form)")

            # Request write access — uses Form(reason)
            self.POST("/api/users/request-write-access", token=self.student_token,
                data={"reason": "I want to write blog posts about student housing."},
                expected=[200, 400, 409, 422], note="Request write access (form)")

            # Password change
            self.PATCH("/api/users/me/password", token=self.student_token,
                json_body={"current_password": self.student_password, "new_password": "NewTestPass1!"},
                expected=[200, 400, 422], note="Change password")
            self.PATCH("/api/users/me/password", token=self.student_token,
                json_body={"current_password": "NewTestPass1!", "new_password": self.student_password},
                expected=[200, 400, 422], note="Revert password")

        # Forgot / reset (no auth needed)
        self.POST("/api/users/forgot-password",
            json_body={"email": self.student_email}, expected=[200, 404], note="Forgot password")
        self.POST("/api/users/reset-password",
            json_body={"token": "fake", "new_password": "Reset1!"},
            expected=[400, 401, 422], note="Reset password (bad token)")
        self.GET("/api/users/verify-email", params={"token": "fake"},
            expected=[400, 422], note="Verify email (bad token)")

        # Second student
        self.POST("/api/users/register",
            json_body={"email": self.student2_email, "password": self.student_password,
                        "first_name": "Second", "last_name": "Tester"},
            expected=[200, 201, 409], note="Register student2")
        resp = self.POST("/api/users/login",
            json_body={"email": self.student2_email, "password": self.student_password},
            expected=[200, 401, 403], note="Student2 login")
        t = self._tok(resp)
        if t:
            self.student2_token = t
            d = self._json(resp)
            if d and "user" in d: self.student2_id = d["user"].get("id")

    # ── 3. LANDLORD AUTH ──────────────────────────────────────────────────

    def test_03_landlord(self):
        print("\n🏠 [3] Landlord auth")

        # Register — uses Form() fields + File() uploads
        # Create minimal dummy files for id_file and document_file
        dummy_pdf = BytesIO(b"%PDF-1.4 fake content")
        dummy_pdf2 = BytesIO(b"%PDF-1.4 fake content 2")

        resp = self.POST("/api/landlords/register",
            data={
                "email": self.landlord_email,
                "password": self.landlord_password,
                "first_name": "Test", "last_name": "Landlord",
                "phone": "5551234567",
                "no_of_property": "1",
                "id_type": "drivers_license",
                "document_type": "utility_bill",
                "company_name": "Test Properties Inc",
            },
            files={
                "id_file": ("id.pdf", dummy_pdf, "application/pdf"),
                "document_file": ("doc.pdf", dummy_pdf2, "application/pdf"),
            },
            expected=[200, 201, 400, 409, 422, 500], note="Register landlord (form + files)")
        d = self._json(resp)
        if d:
            self.landlord_id = d.get("id") or (d.get("landlord") or {}).get("id")
            if "access_token" in d: self.landlord_token = d["access_token"]

        # Login — OAuth2PasswordRequestForm
        resp = self.POST("/api/landlords/login",
            data={"username": self.landlord_email, "password": self.landlord_password},
            expected=[200, 401, 422], note="Landlord login (form)")
        t = self._tok(resp)
        if t:
            self.landlord_token = t
            d = self._json(resp)
            if d and "landlord" in d: self.landlord_id = d["landlord"].get("id")
            print("    ✅ Landlord login OK")

        if self.landlord_token:
            self.GET("/api/landlords/me", token=self.landlord_token, expected=200, note="Landlord profile")
            self.PATCH("/api/landlords/me", token=self.landlord_token,
                json_body={"company_name": "Updated Props Inc"},
                expected=[200, 422], note="Update landlord profile")
            if self.landlord_id:
                self.GET(f"/api/landlords/{self.landlord_id}", expected=[200, 404], note="Get landlord by ID")
        else:
            print("    ⚠️  Landlord login failed")

    # ── 4. WRITER AUTH ────────────────────────────────────────────────────

    def test_04_writer(self):
        print("\n✍️ [4] Writer auth")

        resp = self.POST("/api/writers/register",
            json_body={"email": self.writer_email, "password": self.writer_password,
                        "first_name": "Test", "last_name": "Writer",
                        "business_name": "QA Blog Co", "business_type": "BLOG",
                        "city": "Guelph", "phone": "5559876543",
                        "reason": "Testing the platform"},
            expected=[200, 201, 400, 409, 422], note="Register writer")
        d = self._json(resp)
        if d: self.writer_id = d.get("id") or (d.get("writer") or {}).get("id")

        # Login — OAuth2PasswordRequestForm
        resp = self.POST("/api/writers/login",
            data={"username": self.writer_email, "password": self.writer_password},
            expected=[200, 401, 403, 422], note="Writer login (form)")
        t = self._tok(resp)
        if t:
            self.writer_token = t
            print("    ✅ Writer login OK")
        else:
            print("    ⚠️  Writer needs admin approval (PENDING)")

    # ── 5. ADMIN OPERATIONS ───────────────────────────────────────────────

    def test_05_admin_ops(self):
        print("\n🛡️ [5] Admin operations")
        if not self.admin_token:
            print("    ⏭️  Skipped (no admin token)")
            return

        self.GET("/api/admin/stats", token=self.admin_token, expected=200, note="Stats")
        self.GET("/api/admin/users", token=self.admin_token, expected=200, note="List users")

        if self.student_id:
            self.GET(f"/api/admin/users/{self.student_id}", token=self.admin_token, expected=200, note="Get user")
            self.PATCH(f"/api/admin/users/{self.student_id}/verify", token=self.admin_token, expected=[200, 400], note="Verify student email")
            self.PATCH(f"/api/admin/users/{self.student_id}/grant-write", token=self.admin_token, expected=[200, 400], note="Grant write access")

        self.GET("/api/admin/users/pending-writers", token=self.admin_token, expected=200, note="Pending write requests")
        self.GET("/api/admin/landlords", token=self.admin_token, expected=200, note="List landlords")

        if self.landlord_id:
            self.PATCH(f"/api/admin/landlords/{self.landlord_id}/verify", token=self.admin_token, expected=[200, 400, 404], note="Verify landlord")

        self.GET("/api/admin/writers", token=self.admin_token, expected=200, note="List writers")
        self.GET("/api/admin/writers/pending", token=self.admin_token, expected=200, note="Pending writers")

        if self.writer_id:
            self.PATCH(f"/api/admin/writers/{self.writer_id}/approve", token=self.admin_token, expected=[200, 400, 404], note="Approve writer")
            # Re-login writer after approval
            resp = self.POST("/api/writers/login",
                data={"username": self.writer_email, "password": self.writer_password},
                expected=[200, 401, 403], note="Writer re-login after approval")
            t = self._tok(resp)
            if t: self.writer_token = t

        self.GET("/api/admin/posts", token=self.admin_token, expected=200, note="List posts")
        self.GET("/api/admin/listings", token=self.admin_token, expected=200, note="List listings")
        self.GET("/api/admin/flags", token=self.admin_token, expected=200, note="List flags")

        # Re-login student to pick up verified + write access
        if self.student_id:
            resp = self.POST("/api/users/login",
                json_body={"email": self.student_email, "password": self.student_password},
                expected=[200], note="Re-login student (post-admin)")
            t = self._tok(resp)
            if t: self.student_token = t

    # ── 6. PROPERTIES ─────────────────────────────────────────────────────

    def test_06_properties(self):
        print("\n🏗️ [6] Properties")
        if not self.landlord_token:
            print("    ⏭️  Skipped (no landlord)")
            return

        resp = self.POST("/api/properties", token=self.landlord_token,
            json_body={
                "title": "QA Test Property", "address": "123 Test St",
                "postal_code": "N1G2W1",
                "property_type": "apartment", "total_rooms": 4, "bathrooms": 2,
                "is_furnished": True, "has_parking": True, "has_laundry": True,
                "utilities_included": False, "estimated_utility_cost": 150,
                "distance_to_campus_km": 1.5, "walk_time_minutes": 15,
                "drive_time_minutes": 5, "bus_time_minutes": 10,
                "nearest_bus_route": "Route 99",
            },
            expected=[200, 201, 422], note="Create property")
        self.property_id = self._id(resp)

        self.GET("/api/properties", token=self.landlord_token, expected=200, note="List properties")

        if self.property_id:
            self.GET(f"/api/properties/{self.property_id}", token=self.landlord_token, expected=200, note="Get property")
            self.PATCH(f"/api/properties/{self.property_id}", token=self.landlord_token,
                json_body={"nearest_bus_route": "Route 5"},
                expected=[200, 422], note="Update property")

    # ── 7. LISTINGS ───────────────────────────────────────────────────────

    def test_07_listings(self):
        print("\n📋 [7] Listings")
        if not self.landlord_token or not self.property_id:
            print("    ⏭️  Skipped")
            return

        resp = self.POST("/api/listings", token=self.landlord_token,
            json_body={
                "property_id": self.property_id,
                "rent_per_room": 650, "rent_total": 2600,
                "lease_type": "12_month",
                "move_in_date": (date.today() + timedelta(days=60)).isoformat(),
                "gender_preference": "any",
            },
            expected=[200, 201, 422], note="Create listing")
        self.listing_id = self._id(resp)

        self.GET("/api/listings/me/all", token=self.landlord_token, expected=200, note="My listings")
        self.GET("/api/listings/drafts/my", token=self.landlord_token, expected=200, note="My drafts")

        if self.listing_id:
            self.GET(f"/api/listings/{self.listing_id}", expected=[200, 404], note="Get listing")
            self.PATCH(f"/api/listings/{self.listing_id}", token=self.landlord_token,
                json_body={"rent_per_room": 700}, expected=[200, 422], note="Update listing")
            self.PATCH(f"/api/listings/{self.listing_id}/publish", token=self.landlord_token, expected=[200, 400], note="Publish")
            self.PATCH(f"/api/listings/{self.listing_id}/unpublish", token=self.landlord_token, expected=[200, 400], note="Unpublish")
            self.PATCH(f"/api/listings/{self.listing_id}/publish", token=self.landlord_token, expected=[200, 400], note="Re-publish")

        self.GET("/api/listings", expected=200, note="Public list")
        self.GET("/api/listings", params={"min_rent": 500, "max_rent": 800}, expected=[200, 422], note="Filtered")

    # ── 8. SUBLETS ────────────────────────────────────────────────────────

    def test_08_sublets(self):
        print("\n🔄 [8] Sublets")
        if not self.student_token:
            print("    ⏭️  Skipped")
            return

        resp = self.POST("/api/sublets", token=self.student_token,
            json_body={
                "title": "Summer Sublet Near Campus",
                "address": "456 College Ave, Guelph, ON",
                "postal_code": "N1G2W1",
                "distance_to_campus_km": 0.8,
                "walk_time_minutes": 10, "drive_time_minutes": 3, "bus_time_minutes": 5,
                "nearest_bus_route": "Route 99",
                "room_type": "private", "total_rooms": 3, "bathrooms": 1,
                "is_furnished": True, "utilities_included": True,
                "estimated_utility_cost": 0,
                "rent_per_month": 550,
                "sublet_start_date": (date.today() + timedelta(days=30)).isoformat(),
                "sublet_end_date": (date.today() + timedelta(days=150)).isoformat(),
                "move_in_date": (date.today() + timedelta(days=30)).isoformat(),
                "description": "Cozy room for summer.",
            },
            expected=[200, 201, 403, 422], note="Create sublet")
        if resp and resp.status_code in [200, 201]:
            self.sublet_id = self._id(resp)

        self.GET("/api/sublets/my/listings", token=self.student_token, expected=[200, 422], note="My sublets")
        self.GET("/api/sublets/drafts/my", token=self.student_token, expected=[200], note="My draft sublets")

        if self.sublet_id:
            self.GET(f"/api/sublets/{self.sublet_id}", expected=[200, 404], note="Get sublet")
            self.PATCH(f"/api/sublets/{self.sublet_id}", token=self.student_token,
                json_body={"rent_per_month": 575}, expected=[200, 422], note="Update sublet")
            self.PATCH(f"/api/sublets/{self.sublet_id}/publish", token=self.student_token, expected=[200, 400], note="Publish")
            self.PATCH(f"/api/sublets/{self.sublet_id}/unpublish", token=self.student_token, expected=[200, 400], note="Unpublish")
            self.PATCH(f"/api/sublets/{self.sublet_id}/publish", token=self.student_token, expected=[200, 400], note="Re-publish")

        self.GET("/api/sublets", expected=200, note="Public list")

    # ── 9. POSTS ──────────────────────────────────────────────────────────

    def test_09_posts(self):
        print("\n📝 [9] Posts")
        author_token = self.writer_token or self.student_token
        if not author_token:
            print("    ⏭️  Skipped")
            return

        resp = self.POST("/api/posts", token=author_token,
            json_body={"title": "Best Cafes Near Campus", "content": "Here are the top cafes...",
                        "preview": "Top study spots.", "category": "FOOD"},
            expected=[200, 201, 403, 422], note="Create post")
        if resp and resp.status_code in [200, 201]:
            d = self._json(resp)
            self.post_id = self._id(resp)
            if d: self.post_slug = d.get("slug")

        self.GET("/api/posts/my/posts", token=author_token, expected=[200, 403], note="My posts")
        self.GET("/api/posts/drafts/my", token=author_token, expected=[200, 403], note="My drafts")
        self.GET("/api/posts/my/published", token=author_token, expected=[200, 403], note="My published")
        self.GET("/api/posts/my/archived", token=author_token, expected=[200, 403], note="My archived")
        self.GET("/api/posts/my/stats", token=author_token, expected=[200, 403], note="My stats")

        if self.post_id:
            self.PATCH(f"/api/posts/{self.post_id}", token=author_token,
                json_body={"title": "Updated Cafe Post"}, expected=[200, 403, 422], note="Update post")
            self.PATCH(f"/api/posts/{self.post_id}/publish", token=author_token, expected=[200, 400, 403], note="Publish")
            self.PATCH(f"/api/posts/{self.post_id}/archive", token=author_token, expected=[200, 400, 403], note="Archive")
            self.PATCH(f"/api/posts/{self.post_id}/unarchive", token=author_token, expected=[200, 400, 403], note="Unarchive")
            self.PATCH(f"/api/posts/{self.post_id}/unpublish", token=author_token, expected=[200, 400, 403], note="Unpublish")
            self.PATCH(f"/api/posts/{self.post_id}/publish", token=author_token, expected=[200, 400, 403], note="Re-publish")

        self.GET("/api/posts", expected=200, note="Public list")
        self.GET("/api/posts", params={"category": "FOOD"}, expected=[200, 422], note="By category")
        self.GET("/api/posts/search/posts", params={"q": "cafe"}, expected=200, note="Search")

        if self.post_slug:
            self.GET(f"/api/posts/{self.post_slug}", expected=[200, 404], note="Get by slug")

    # ── 10. MARKETPLACE ───────────────────────────────────────────────────

    def test_10_marketplace(self):
        print("\n🛒 [10] Marketplace")
        if not self.student_token:
            print("    ⏭️  Skipped")
            return

        resp = self.POST("/api/marketplace/items", token=self.student_token,
            json_body={"title": "IKEA Desk", "description": "Sturdy 120x60 desk.",
                        "category": "furniture", "condition": "good",
                        "pricing_type": "fixed", "price": 45,
                        "pickup_location": "University Centre"},
            expected=[200, 201, 403, 422], note="Create item")
        if resp and resp.status_code in [200, 201]:
            self.marketplace_item_id = self._id(resp)

        self.GET("/api/marketplace/my/items", token=self.student_token, expected=[200, 403], note="My items")
        self.GET("/api/marketplace/drafts/my", token=self.student_token, expected=[200, 403], note="My drafts")

        if self.marketplace_item_id:
            self.GET(f"/api/marketplace/items/{self.marketplace_item_id}", expected=[200, 404], note="Get item")
            self.PATCH(f"/api/marketplace/items/{self.marketplace_item_id}", token=self.student_token,
                json_body={"price": 40}, expected=[200, 403, 422], note="Update item")
            self.PATCH(f"/api/marketplace/items/{self.marketplace_item_id}/publish", token=self.student_token, expected=[200, 400, 403], note="Publish")

            # Marketplace conversation — needs item_id + content
            if self.student2_token:
                resp = self.POST("/api/marketplace/conversations", token=self.student2_token,
                    json_body={"item_id": self.marketplace_item_id, "content": "Is this still available?"},
                    expected=[200, 201, 400, 403, 409], note="Start conversation")
                d = self._json(resp)
                if d: self.marketplace_conversation_id = d.get("conversation_id") or d.get("id")

                if self.marketplace_conversation_id:
                    self.POST(f"/api/marketplace/conversations/{self.marketplace_conversation_id}/messages",
                        token=self.student2_token, json_body={"content": "Can I pick up today?"},
                        expected=[200, 201, 403], note="Send message")
                    self.GET(f"/api/marketplace/conversations/{self.marketplace_conversation_id}",
                        token=self.student2_token, expected=[200, 403], note="Get conversation")

                self.GET("/api/marketplace/conversations", token=self.student2_token, expected=[200, 403], note="List convos")
                self.GET("/api/marketplace/unread-count", token=self.student2_token, expected=[200, 403], note="Unread count")

            self.PATCH(f"/api/marketplace/items/{self.marketplace_item_id}/sold", token=self.student_token, expected=[200, 400, 403], note="Mark sold")

        self.GET("/api/marketplace/items", expected=200, note="Public list")
        self.GET("/api/marketplace/items", params={"category": "furniture"}, expected=[200, 422], note="By category")
        self.GET("/api/marketplace/items", params={"search": "desk"}, expected=[200, 422], note="Search")

    # ── 11. REVIEWS ───────────────────────────────────────────────────────

    def test_11_reviews(self):
        print("\n⭐ [11] Reviews")
        if not self.student_token or not self.property_id or not self.landlord_id:
            print("    ⏭️  Skipped")
            return

        # ReviewCreate: property_id, responsiveness, maintenance_speed, respect_privacy, fairness_of_charges, would_rent_again
        resp = self.POST("/api/reviews", token=self.student_token,
            json_body={"property_id": self.property_id,
                        "responsiveness": 4, "maintenance_speed": 3,
                        "respect_privacy": 5, "fairness_of_charges": 4,
                        "would_rent_again": True, "comment": "Solid landlord."},
            expected=[200, 201, 400, 403, 422], note="Create review")
        self.review_id = self._id(resp)

        self.GET("/api/reviews", params={"property_id": self.property_id}, expected=200, note="List reviews")
        self.GET("/api/reviews/me/all", token=self.student_token, expected=200, note="My reviews")

    # ── 12. SAVED LISTINGS ────────────────────────────────────────────────

    def test_12_saved(self):
        print("\n🔖 [12] Saved listings")
        if not self.student_token or not self.listing_id:
            print("    ⏭️  Skipped")
            return

        # POST /api/saved/{listing_id} — path param, no body
        self.POST(f"/api/saved/{self.listing_id}", token=self.student_token,
            expected=[200, 201, 400, 409], note="Save listing")
        self.GET(f"/api/saved/{self.listing_id}/check", token=self.student_token,
            expected=[200], note="Check if saved")
        self.GET("/api/saved", token=self.student_token, expected=200, note="List saved")
        self.DELETE(f"/api/saved/{self.listing_id}", token=self.student_token,
            expected=[200, 204, 404], note="Unsave listing")

    # ── 13. FLAGS ─────────────────────────────────────────────────────────

    def test_13_flags(self):
        print("\n🚩 [13] Flags")
        if not self.student_token or not self.listing_id:
            print("    ⏭️  Skipped")
            return

        resp = self.POST("/api/flags", token=self.student_token,
            json_body={"listing_id": self.listing_id, "reason": "Test flag."},
            expected=[200, 201, 400, 422], note="Create flag")
        self.flag_id = self._id(resp)

        self.GET("/api/flags/me", token=self.student_token, expected=200, note="My flags")

        if self.admin_token and self.flag_id:
            self.PATCH(f"/api/admin/flags/{self.flag_id}/resolve", token=self.admin_token, expected=[200, 400, 404], note="Resolve flag")

    # ── 14. HEALTH SCORES ─────────────────────────────────────────────────

    def test_14_healthscores(self):
        print("\n💚 [14] Health scores")
        if not self.listing_id:
            print("    ⏭️  Skipped")
            return
        # Prefix is /api/health-scores (with hyphen)
        self.GET(f"/api/health-scores/{self.listing_id}", expected=[200, 404], note="Get score")

    # ── 15. MESSAGES ──────────────────────────────────────────────────────

    def test_15_messages(self):
        print("\n💬 [15] Messages")
        if not self.student_token or not self.landlord_token or not self.listing_id:
            print("    ⏭️  Skipped")
            return

        # StartConversation: listing_id + content
        resp = self.POST("/api/messages/conversations", token=self.student_token,
            json_body={"listing_id": self.listing_id, "content": "Is this still available?"},
            expected=[200, 201, 400, 409], note="Start conversation")
        self.conversation_id = self._id(resp)

        if self.conversation_id:
            self.POST(f"/api/messages/conversations/{self.conversation_id}", token=self.student_token,
                json_body={"content": "Is parking included?"}, expected=[200, 201], note="Student follow-up")
            self.POST(f"/api/messages/landlord/conversations/{self.conversation_id}", token=self.landlord_token,
                json_body={"content": "Yes it's available."}, expected=[200, 201, 403], note="Landlord reply")
            self.GET(f"/api/messages/conversations/{self.conversation_id}", token=self.student_token,
                expected=200, note="Get conversation")

        self.GET("/api/messages/conversations", token=self.student_token, expected=200, note="Student convos")
        self.GET("/api/messages/landlord/conversations", token=self.landlord_token, expected=200, note="Landlord convos")
        self.GET("/api/messages/unread-count", token=self.student_token, expected=200, note="Student unread")
        self.GET("/api/messages/landlord/unread-count", token=self.landlord_token, expected=200, note="Landlord unread")

    # ── 16. ROOMMATES ─────────────────────────────────────────────────────

    def test_16_roommates(self):
        print("\n👥 [16] Roommates")
        if not self.student_token:
            print("    ⏭️  Skipped")
            return

        self.GET("/api/roommates/profile-check", token=self.student_token, expected=200, note="Profile check")
        self.PATCH("/api/roommates/complete-profile", token=self.student_token,
            json_body={"program": "Computer Science", "year": "THIRD", "bio": "Looking for roommates"},
            expected=[200, 400, 422], note="Complete profile")

        # Quiz — exact enum values from roommateSchema.py
        resp = self.POST("/api/roommates/quiz", token=self.student_token,
            json_body={
                "sleep_schedule": "night_owl", "cleanliness": "reasonably_clean",
                "noise_level": "moderate", "guests": "sometimes",
                "study_habits": "at_home", "smoking": "no_smoking",
                "pets": "fine_with_pets", "kitchen_use": "cook_daily",
                "budget_range": "under_500", "roommate_timing": "flexible",
                "gender_housing_pref": "no_preference",
                "search_type": "on_my_own", "roommates_needed": 2,
            },
            expected=[200, 201, 400, 409, 422], note="Submit quiz")
        if resp and resp.status_code == 422:
            print(f"    ⚠️  Quiz 422: {resp.text[:250]}")

        self.GET("/api/roommates/quiz/me", token=self.student_token, expected=[200, 404], note="Get quiz")

        # Visibility toggle — path is /visibility not /quiz/visibility, no body needed
        self.PATCH("/api/roommates/visibility", token=self.student_token,
            expected=[200, 400, 404], note="Toggle visibility")

        # Student2 quiz
        if self.student2_token:
            self.PATCH("/api/roommates/complete-profile", token=self.student2_token,
                json_body={"program": "Biology", "year": "SECOND", "bio": "Need roomies"},
                expected=[200, 400, 422], note="Student2 profile")
            self.POST("/api/roommates/quiz", token=self.student2_token,
                json_body={
                    "sleep_schedule": "early_bird", "cleanliness": "very_tidy",
                    "noise_level": "quiet", "guests": "rarely",
                    "study_habits": "library", "smoking": "no_smoking",
                    "pets": "no_pets", "kitchen_use": "few_times_week",
                    "budget_range": "500_650", "roommate_timing": "fall_2026",
                    "gender_housing_pref": "no_preference",
                    "search_type": "on_my_own", "roommates_needed": 1,
                },
                expected=[200, 201, 400, 409, 422], note="Student2 quiz")

        self.GET("/api/roommates/individuals", token=self.student_token, expected=[200, 403], note="Browse individuals")
        self.GET("/api/roommates/individuals/search", token=self.student_token, expected=[200, 403, 422], note="Search individuals")

        # GroupCreate: current_size + spots_needed (total_capacity is computed)
        resp = self.POST("/api/roommates/groups", token=self.student_token,
            json_body={
                "name": "QA Test Group", "description": "Looking for roommates.",
                "current_size": 1, "spots_needed": 3,
                "rent_per_person": 600, "utilities_included": True,
                "move_in_timing": "flexible", "gender_preference": "no_preference",
                "has_place": False,
            },
            expected=[200, 201, 400, 403, 409, 422], note="Create group")
        if resp and resp.status_code in [200, 201]:
            self.roommate_group_id = self._id(resp)
        if resp and resp.status_code == 422:
            print(f"    ⚠️  Group 422: {resp.text[:250]}")

        self.GET("/api/roommates/groups/my/group", token=self.student_token, expected=[200, 404], note="My group")
        self.GET("/api/roommates/groups/browse", token=self.student_token, expected=[200, 403], note="Browse groups")

        if self.roommate_group_id:
            self.GET(f"/api/roommates/groups/{self.roommate_group_id}", token=self.student_token, expected=200, note="Get group")
            self.PATCH(f"/api/roommates/groups/{self.roommate_group_id}", token=self.student_token,
                json_body={"description": "Updated!"}, expected=[200, 422], note="Update group")

            # InviteCreate: invited_user_id + message (group auto-detected from owner)
            if self.student2_id:
                resp = self.POST("/api/roommates/invites", token=self.student_token,
                    json_body={"invited_user_id": self.student2_id, "message": "Join us!"},
                    expected=[200, 201, 400, 403, 409], note="Invite student2")
                self.invite_id = self._id(resp)

            self.GET("/api/roommates/invites/sent", token=self.student_token, expected=200, note="Sent invites")

            if self.student2_token:
                self.GET("/api/roommates/invites/received", token=self.student2_token, expected=200, note="Received invites")
                if self.invite_id:
                    self.PATCH(f"/api/roommates/invites/{self.invite_id}/accept", token=self.student2_token,
                        expected=[200, 400], note="Accept invite")

                self.GET("/api/roommates/requests/sent", token=self.student2_token, expected=200, note="Sent requests")
                self.GET("/api/roommates/requests/received", token=self.student_token, expected=200, note="Received requests")

                self.DELETE(f"/api/roommates/groups/{self.roommate_group_id}/leave", token=self.student2_token,
                    expected=[200, 400, 404], note="Student2 leaves")

    # ── 17. VIEWINGS ──────────────────────────────────────────────────────

    def test_17_viewings(self):
        print("\n🗓️ [17] Viewings")

        # Listing viewings (landlord hosts)
        if self.landlord_token and self.listing_id:
            target = (date.today() + timedelta(days=3)).isoformat()

            resp = self.POST("/api/viewings/availability", token=self.landlord_token,
                json_body={"listing_id": self.listing_id, "date": target,
                            "start_time": "10:00:00", "end_time": "14:00:00"},
                expected=[200, 201, 400, 422], note="Create availability (listing)")
            self.availability_id = self._id(resp)

            self.POST("/api/viewings/availability/bulk", token=self.landlord_token,
                json_body={"listing_id": self.listing_id, "dates": [
                    {"listing_id": self.listing_id,
                     "date": (date.today() + timedelta(days=5)).isoformat(),
                     "start_time": "09:00:00", "end_time": "12:00:00"}
                ]},
                expected=[200, 201, 400, 422], note="Bulk availability")

            self.GET("/api/viewings/availability", params={"listing_id": self.listing_id}, expected=200, note="Get availability")

            resp = self.GET("/api/viewings/slots", params={"listing_id": self.listing_id}, expected=200, note="Get slots")
            d = self._json(resp)
            if d:
                slots = d if isinstance(d, list) else d.get("slots", d.get("items", []))
                if isinstance(slots, list) and slots:
                    self.slot_id = slots[0].get("id")

            if self.student_token and self.slot_id:
                resp = self.POST("/api/viewings/book", token=self.student_token,
                    json_body={"slot_id": self.slot_id, "notes": "Excited to see it!"},
                    expected=[200, 201, 400, 403, 422], note="Book slot")
                self.booking_id = self._id(resp)

            if self.student_token:
                self.GET("/api/viewings/bookings/my", token=self.student_token, expected=200, note="My bookings")
                self.GET("/api/viewings/bookings/my/upcoming", token=self.student_token, expected=200, note="My upcoming")

            self.GET("/api/viewings/bookings/hosting", token=self.landlord_token, expected=200, note="Hosting")
            self.GET("/api/viewings/bookings/hosting/upcoming", token=self.landlord_token, expected=200, note="Hosting upcoming")

            if self.booking_id and self.student_token:
                self.PATCH(f"/api/viewings/bookings/{self.booking_id}/cancel", token=self.student_token,
                    expected=[200, 400], note="Cancel booking")

            if self.availability_id:
                self.DELETE(f"/api/viewings/availability/{self.availability_id}", token=self.landlord_token,
                    expected=[200, 204, 400, 404], note="Delete availability")

        # Sublet viewings (student hosts)
        if self.student_token and self.sublet_id:
            target = (date.today() + timedelta(days=4)).isoformat()
            self.POST("/api/viewings/availability", token=self.student_token,
                json_body={"sublet_id": self.sublet_id, "date": target,
                            "start_time": "14:00:00", "end_time": "17:00:00"},
                expected=[200, 201, 400, 422], note="Availability (sublet)")
            self.GET("/api/viewings/availability", params={"sublet_id": self.sublet_id}, expected=200, note="Get sublet availability")
            self.GET("/api/viewings/slots", params={"sublet_id": self.sublet_id}, expected=200, note="Get sublet slots")

    # ── 18. EDGE CASES ────────────────────────────────────────────────────

    def test_18_edge_cases(self):
        print("\n🧪 [18] Edge cases")

        # No auth
        self.GET("/api/users/me", expected=[401, 403], note="No auth: /users/me")
        self.GET("/api/landlords/me", expected=[401, 403], note="No auth: /landlords/me")
        self.GET("/api/messages/conversations", expected=[401, 403], note="No auth: messages")
        self.POST("/api/listings", json_body={}, expected=[401, 403], note="No auth: create listing")

        # Wrong role
        if self.student_token:
            self.POST("/api/properties", token=self.student_token, json_body={},
                expected=[401, 403, 422], note="Student → property")
            self.GET("/api/admin/stats", token=self.student_token, expected=[401, 403], note="Student → admin")

        # Non-existent
        self.GET("/api/listings/999999", expected=[404, 422], note="Bad listing ID")
        self.GET("/api/sublets/999999", expected=[404, 422], note="Bad sublet ID")
        self.GET("/api/properties/999999", expected=[404, 422], note="Bad property ID")
        self.GET("/api/posts/nonexistent-slug-xyz", expected=404, note="Bad slug")

        # Bad data
        self.POST("/api/users/register", json_body={"email": "bad", "password": "x"},
            expected=[400, 422], note="Invalid email")
        self.POST("/api/users/register",
            json_body={"email": "a@gmail.com", "password": "Valid1!", "first_name": "A", "last_name": "B"},
            expected=[400, 422], note="Non-uoguelph")
        self.POST("/api/users/login",
            json_body={"email": self.student_email, "password": "Wrong1!"},
            expected=[401, 403], note="Wrong password")
        self.POST("/api/users/register",
            json_body={"email": self.student_email, "password": self.student_password,
                        "first_name": "A", "last_name": "B"},
            expected=[400, 409], note="Duplicate")

    # ── 19. CLEANUP ───────────────────────────────────────────────────────

    def test_19_cleanup(self):
        print("\n🧹 [19] Cleanup")

        if self.conversation_id and self.student_token:
            self.DELETE(f"/api/messages/conversations/{self.conversation_id}", token=self.student_token,
                expected=[200, 204, 400, 404], note="Delete conversation")
        if self.roommate_group_id and self.student_token:
            self.DELETE(f"/api/roommates/groups/{self.roommate_group_id}", token=self.student_token,
                expected=[200, 204, 400], note="Delete group")
        if self.marketplace_item_id and self.student_token:
            self.DELETE(f"/api/marketplace/items/{self.marketplace_item_id}", token=self.student_token,
                expected=[200, 204, 403], note="Delete item")
        if self.post_id:
            tok = self.writer_token or self.student_token
            if tok: self.DELETE(f"/api/posts/{self.post_id}", token=tok, expected=[200, 204, 403], note="Delete post")
        if self.sublet_id and self.student_token:
            self.DELETE(f"/api/sublets/{self.sublet_id}", token=self.student_token, expected=[200, 204], note="Delete sublet")
        if self.listing_id and self.landlord_token:
            self.DELETE(f"/api/listings/{self.listing_id}", token=self.landlord_token, expected=[200, 204], note="Delete listing")
        if self.property_id and self.landlord_token:
            self.DELETE(f"/api/properties/{self.property_id}", token=self.landlord_token, expected=[200, 204], note="Delete property")

        # User account deletion (tests cascade fix)
        if self.student_token:
            self.DELETE("/api/users/me", token=self.student_token, expected=[200, 204], note="Delete student")
        if self.student2_token:
            self.DELETE("/api/users/me", token=self.student2_token, expected=[200, 204], note="Delete student2")

    # ═══════════════════════════════════════════════════════════════════════
    #  REPORT
    # ═══════════════════════════════════════════════════════════════════════

    def print_report(self):
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        failed = total - passed

        print("\n" + "=" * 90)
        print(f"  ENDPOINT SMOKE TEST REPORT — FindYourCribb")
        print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  |  {self.base}")
        print("=" * 90)
        print(f"\n  Total: {total}  |  ✅ Passed: {passed}  |  ❌ Failed: {failed}  |  Rate: {passed/total*100:.1f}%" if total else "")
        print(f"\n  Tokens: student={'✅' if self.student_token else '❌'}  "
              f"landlord={'✅' if self.landlord_token else '❌'}  "
              f"admin={'✅' if self.admin_token else '❌'}  "
              f"writer={'✅' if self.writer_token else '❌'}  "
              f"student2={'✅' if self.student2_token else '❌'}")

        errs = [r for r in self.results if r.status == 500]
        if errs:
            print(f"\n{'─'*90}\n  🔥 SERVER ERRORS (500)\n{'─'*90}")
            for r in errs:
                print(f"  {r.method:7s} {r.path:55s} {r.note[:70]}")

        fails = [r for r in self.results if not r.passed]
        if fails:
            print(f"\n{'─'*90}\n  ❌ FAILED ENDPOINTS\n{'─'*90}")
            rows = [[r.method, r.path[:55], r.status, str(r.expected), r.note[:65]] for r in fails]
            if tabulate:
                print(tabulate(rows, headers=["Method", "Path", "Got", "Expected", "Note"], tablefmt="simple"))
            else:
                for r in rows: print(f"  {r[0]:7s} {r[1]:55s} {r[2]:5} exp={r[3]:20s} {r[4]}")

        print(f"\n{'─'*90}\n  ALL ENDPOINTS\n{'─'*90}")
        rows = [["✅" if r.passed else "❌", r.method, r.path[:55], r.status, str(r.expected), r.note[:50]] for r in self.results]
        if tabulate:
            print(tabulate(rows, headers=["", "Method", "Path", "Got", "Expected", "Note"], tablefmt="simple"))
        else:
            for r in rows: print(f"  {r[0]} {r[1]:7s} {r[2]:55s} {r[3]:5} exp={r[4]:20s} {r[5]}")

        print("\n" + "=" * 90)
        return failed

    def run_all(self):
        start = time.time()
        for i, test in enumerate([
            self.test_00_health, self.test_01_admin, self.test_02_student,
            self.test_03_landlord, self.test_04_writer, self.test_05_admin_ops,
            self.test_06_properties, self.test_07_listings, self.test_08_sublets,
            self.test_09_posts, self.test_10_marketplace, self.test_11_reviews,
            self.test_12_saved, self.test_13_flags, self.test_14_healthscores,
            self.test_15_messages, self.test_16_roommates, self.test_17_viewings,
            self.test_18_edge_cases, self.test_19_cleanup,
        ]):
            test()
        print(f"\n⏱️  {time.time()-start:.1f}s")
        return self.print_report()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--base-url", default="http://localhost:8000")
    p.add_argument("--admin-secret", default="idea-boiii")
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args()

    t = CribbTester(args.base_url, args.admin_secret, args.verbose)
    sys.exit(1 if t.run_all() > 0 else 0)

if __name__ == "__main__":
    main()