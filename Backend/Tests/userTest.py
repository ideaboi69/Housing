import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from tables import Base, get_db, User, Landlord
from utils.security import get_current_user, hash_password
from Schemas.userSchema import UserRole
from Routes.user import user_router

SQLALCHEMY_TEST_URL = "sqlite://"
engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()
app.include_router(user_router, prefix="/api/users")
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

# Helpers
TEST_USER = {
    "email": "testuser@uoguelph.ca",
    "password": "securepassword123",
    "first_name": "Test",
    "last_name": "User",
}

SECOND_USER = {
    "email": "seconduser@uoguelph.ca",
    "password": "anotherpassword123",
    "first_name": "Second",
    "last_name": "User",
}

def register_user(user_data=None):
    data = user_data or TEST_USER
    return client.post("/api/users/register", json=data)

def login_user(email=None, password=None):
    return client.post("/api/users/login", json={
        "email": email or TEST_USER["email"],
        "password": password or TEST_USER["password"],
    })

def auth_header(token):
    return {"Authorization": f"Bearer {token}"}

def register_and_get_token(user_data=None):
    res = register_user(user_data)
    return res.json()["access_token"]

# Register Tests
class TestRegister:
    def test_register_success(self):
        res = register_user()
        assert res.status_code == 201

        data = res.json()
        assert data["access_token"]
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == TEST_USER["email"]
        assert data["user"]["first_name"] == TEST_USER["first_name"]
        assert data["user"]["role"] == "student"
        assert data["user"]["email_verified"] is False

    def test_register_duplicate_email(self):
        register_user()
        res = register_user()
        assert res.status_code == 409
        assert "already exists" in res.json()["detail"]

    def test_register_invalid_email_domain(self):
        bad_user = {**TEST_USER, "email": "test@gmail.com"}
        res = register_user(bad_user)
        assert res.status_code == 400

    def test_register_short_password(self):
        bad_user = {**TEST_USER, "password": "short"}
        res = register_user(bad_user)
        assert res.status_code == 422

    def test_register_missing_fields(self):
        res = client.post("/api/users/register", json={"email": "test@uoguelph.ca"})
        assert res.status_code == 422

#Login Tests
class TestLogin:
    def test_login_success(self):
        register_user()
        res = login_user()
        assert res.status_code == 200

        data = res.json()
        assert data["access_token"]
        assert data["user"]["email"] == TEST_USER["email"]

    def test_login_wrong_password(self):
        register_user()
        res = login_user(password="wrongpassword123")
        assert res.status_code == 401
        assert "Invalid" in res.json()["detail"]

    def test_login_nonexistent_user(self):
        res = login_user(email="nobody@uoguelph.ca")
        assert res.status_code == 401

    def test_login_returns_valid_token(self):
        register_user()
        res = login_user()
        token = res.json()["access_token"]

        me_res = client.get("/api/users/me", headers=auth_header(token))
        assert me_res.status_code == 200
        assert me_res.json()["email"] == TEST_USER["email"]



# Viewing Profile Tests
class TestViewProfile:
    def test_get_me_authenticated(self):
        token = register_and_get_token()
        res = client.get("/api/users/me", headers=auth_header(token))
        assert res.status_code == 200
        assert res.json()["email"] == TEST_USER["email"]

    def test_get_me_no_token(self):
        res = client.get("/api/users/me")
        assert res.status_code == 401

    def test_get_me_invalid_token(self):
        res = client.get("/api/users/me", headers=auth_header("garbage.token.here"))
        assert res.status_code == 401

# Updating Profile Tests
class TestUpdateProfile:
    def test_update_first_name(self):
        token = register_and_get_token()
        res = client.patch("/api/users/me", json={"first_name": "Updated"}, headers=auth_header(token))
        assert res.status_code == 200
        assert res.json()["first_name"] == "Updated"

    def test_update_last_name(self):
        token = register_and_get_token()
        res = client.patch("/api/users/me", json={"last_name": "NewLast"}, headers=auth_header(token))
        assert res.status_code == 200
        assert res.json()["last_name"] == "NewLast"

    def test_update_email(self):
        token = register_and_get_token()
        res = client.patch("/api/users/me", json={"email": "newemail@uoguelph.ca"}, headers=auth_header(token))
        assert res.status_code == 200
        assert res.json()["email"] == "newemail@uoguelph.ca"
        assert res.json()["email_verified"] is False  # should reset on email change

    def test_update_email_to_existing(self):
        register_user()
        token = register_and_get_token(SECOND_USER)
        res = client.patch("/api/users/me", json={"email": TEST_USER["email"]}, headers=auth_header(token))
        assert res.status_code == 409

    def test_update_email_invalid_domain(self):
        token = register_and_get_token()
        res = client.patch("/api/users/me", json={"email": "bad@gmail.com"}, headers=auth_header(token))
        assert res.status_code == 400

# Changing Password Test
class TestChangePassword:
    def test_change_password_success(self):
        token = register_and_get_token()
        res = client.patch("/api/users/me/password", json={
            "current_password": TEST_USER["password"],
            "new_password": "newstrongpassword123",
        }, headers=auth_header(token))
        assert res.status_code == 200
        assert res.json()["message"] == "Password updated successfully"

        # verify new password works
        login_res = login_user(password="newstrongpassword123")
        assert login_res.status_code == 200

    def test_change_password_wrong_current(self):
        token = register_and_get_token()
        res = client.patch("/api/users/me/password", json={
            "current_password": "wrongcurrent",
            "new_password": "newstrongpassword123",
        }, headers=auth_header(token))
        assert res.status_code == 400
        assert "incorrect" in res.json()["detail"]

    def test_change_password_too_short(self):
        token = register_and_get_token()
        res = client.patch("/api/users/me/password", json={
            "current_password": TEST_USER["password"],
            "new_password": "short",
        }, headers=auth_header(token))
        assert res.status_code == 422

    def test_old_password_no_longer_works_after_change(self):
        token = register_and_get_token()
        client.patch("/api/users/me/password", json={
            "current_password": TEST_USER["password"],
            "new_password": "newstrongpassword123",
        }, headers=auth_header(token))

        login_res = login_user(password=TEST_USER["password"])
        assert login_res.status_code == 401

# Role switch tests
class TestRoleSwitch:
    def test_switch_to_landlord(self):
        token = register_and_get_token()
        res = client.patch("/api/users/me/role", json={
            "role": "landlord",
            "company_name": "Test Rentals",
            "phone": "5551234567",
        }, headers=auth_header(token))
        assert res.status_code == 200
        assert res.json()["role"] == "landlord"

    def test_switch_back_to_student(self):
        token = register_and_get_token()
        # become landlord
        client.patch("/api/users/me/role", json={"role": "landlord"}, headers=auth_header(token))
        # switch back
        res = client.patch("/api/users/me/role", json={"role": "student"}, headers=auth_header(token))
        assert res.status_code == 200
        assert res.json()["role"] == "student"

    def test_switch_to_admin_blocked(self):
        token = register_and_get_token()
        res = client.patch("/api/users/me/role", json={"role": "admin"}, headers=auth_header(token))
        assert res.status_code == 403
        assert "Cannot switch to admin" in res.json()["detail"]

    def test_landlord_profile_created_on_switch(self):
        token = register_and_get_token()
        client.patch("/api/users/me/role", json={
            "role": "landlord",
            "company_name": "My Rentals",
            "phone": "5559999999",
        }, headers=auth_header(token))

        # verify landlord row exists in db
        db = TestSession()
        user = db.query(User).filter(User.email == TEST_USER["email"]).first()
        landlord = db.query(Landlord).filter(Landlord.user_id == user.id).first()
        assert landlord is not None
        assert landlord.company_name == "My Rentals"
        assert landlord.phone == "5559999999"
        db.close()

    def test_landlord_profile_persists_after_switch_back(self):
        token = register_and_get_token()
        client.patch("/api/users/me/role", json={"role": "landlord", "company_name": "Persist Co"}, headers=auth_header(token))
        client.patch("/api/users/me/role", json={"role": "student"}, headers=auth_header(token))

        # landlord row should still exist
        db = TestSession()
        user = db.query(User).filter(User.email == TEST_USER["email"]).first()
        landlord = db.query(Landlord).filter(Landlord.user_id == user.id).first()
        assert landlord is not None
        assert landlord.company_name == "Persist Co"
        db.close()

    def test_switch_to_landlord_twice_no_duplicate(self):
        token = register_and_get_token()
        client.patch("/api/users/me/role", json={"role": "landlord"}, headers=auth_header(token))
        client.patch("/api/users/me/role", json={"role": "student"}, headers=auth_header(token))
        client.patch("/api/users/me/role", json={"role": "landlord"}, headers=auth_header(token))

        # should still be only one landlord row
        db = TestSession()
        user = db.query(User).filter(User.email == TEST_USER["email"]).first()
        count = db.query(Landlord).filter(Landlord.user_id == user.id).count()
        assert count == 1
        db.close()

# Delete profile tests
class TestDeleteAccount:
    def test_delete_student_account(self):
        token = register_and_get_token()
        res = client.delete("/api/users/me", headers=auth_header(token))
        assert res.status_code == 204

        # user should no longer exist
        db = TestSession()
        user = db.query(User).filter(User.email == TEST_USER["email"]).first()
        assert user is None
        db.close()

    def test_delete_landlord_account_cascades(self):
        token = register_and_get_token()
        client.patch("/api/users/me/role", json={"role": "landlord"}, headers=auth_header(token))
        res = client.delete("/api/users/me", headers=auth_header(token))
        assert res.status_code == 204

        # both user and landlord should be gone
        db = TestSession()
        user = db.query(User).filter(User.email == TEST_USER["email"]).first()
        assert user is None
        landlords = db.query(Landlord).all()
        assert len(landlords) == 0
        db.close()

    def test_token_invalid_after_delete(self):
        token = register_and_get_token()
        client.delete("/api/users/me", headers=auth_header(token))

        res = client.get("/api/users/me", headers=auth_header(token))
        assert res.status_code == 401

# Get UserId tests
class TestGetUserById:
    def test_get_existing_user(self):
        token = register_and_get_token()
        me = client.get("/api/users/me", headers=auth_header(token)).json()

        res = client.get(f"/api/users/{me['id']}")
        assert res.status_code == 200
        assert res.json()["email"] == TEST_USER["email"]

    def test_get_nonexistent_user(self):
        res = client.get("/api/users/99999")
        assert res.status_code == 404
        assert "not found" in res.json()["detail"]