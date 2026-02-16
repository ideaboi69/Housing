from conftest import (
    client,
    TestSession,
    auth_header,
    register_user,
    login_user,
    register_and_get_token,
    get_me,
    update_me,
    change_password,
    switch_role,
    delete_me,
    get_user_by_id,
)
from constants import *
from tables import User, Landlord

# Register Tests
class TestRegister:
    def test_register_success(self):
        res = register_user()
        assert res.status_code == 201

        data = res.json()
        assert data["access_token"]
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == STUDENT_ONE["email"]
        assert data["user"]["first_name"] == STUDENT_ONE["first_name"]
        assert data["user"]["role"] == ROLE_STUDENT
        assert data["user"]["email_verified"] is False

    def test_register_duplicate_email(self):
        register_user()
        res = register_user()

        assert res.status_code == HTTP_409
        assert MSG_ALREADY_EXISTS in res.json()["detail"]

    def test_register_invalid_email_domain(self):
        res = register_user({**STUDENT_ONE, "email": INVALID_EMAIL})
        assert res.status_code == HTTP_400

    def test_register_short_password(self):
        res = register_user({**STUDENT_ONE, "password": SHORT_PASSWORD})
        assert res.status_code == HTTP_422

    def test_register_missing_fields(self):
        res = client.post(REGISTER_URL, json={"email": STUDENT_ONE["email"]})
        assert res.status_code == HTTP_422

#Login Tests
class TestLogin:
    def test_login_success(self):
        register_user()
        res = login_user()
        data = res.json()

        assert res.status_code == HTTP_200
        assert data["access_token"]
        assert data["user"]["email"] == STUDENT_ONE["email"]

    def test_login_wrong_password(self):
        register_user()
        res = login_user(password=WRONG_PASSWORD)

        assert res.status_code == HTTP_401
        assert MSG_INVALID_CREDENTIALS in res.json()["detail"]

    def test_login_nonexistent_user(self):
        res = login_user(email=NONEXISTENT_EMAIL)
        assert res.status_code == HTTP_401

    def test_login_returns_valid_token(self):
        register_user()
        token = login_user().json()["access_token"]
        res = get_me(token)

        assert res.status_code == HTTP_200
        assert res.json()["email"] == STUDENT_ONE["email"]

# Viewing Profile Tests
class TestViewProfile:
    def test_get_me_authenticated(self):
        token = register_and_get_token()
        res = get_me(token)

        assert res.status_code == HTTP_200
        assert res.json()["email"] == STUDENT_ONE["email"]

    def test_get_me_no_token(self):
        res = client.get(ME_URL)
        assert res.status_code == HTTP_401

    def test_get_me_invalid_token(self):
        res = get_me(INVALID_TOKEN)
        assert res.status_code == HTTP_401


# Updating Profile Tests
class TestUpdateProfile:
    def test_update_first_name(self):
        token = register_and_get_token()
        res = update_me(token, {"first_name": "Updated"})

        assert res.status_code == HTTP_200
        assert res.json()["first_name"] == "Updated"

    def test_update_last_name(self):
        token = register_and_get_token()
        res = update_me(token, {"last_name": "NewLast"})

        assert res.status_code == HTTP_200
        assert res.json()["last_name"] == "NewLast"

    def test_update_email(self):
        token = register_and_get_token()
        res = update_me(token, {"email": VALID_NEW_EMAIL})

        assert res.status_code == HTTP_200
        assert res.json()["email"] == VALID_NEW_EMAIL
        assert res.json()["email_verified"] is False

    def test_update_email_to_existing(self):
        register_user()
        token = register_and_get_token(STUDENT_TWO)
        res = update_me(token, {"email": STUDENT_ONE["email"]})

        assert res.status_code == HTTP_409

    def test_update_email_invalid_domain(self):
        token = register_and_get_token()
        res = update_me(token, {"email": INVALID_EMAIL})

        assert res.status_code == HTTP_400

# Changing Password Test
class TestChangePassword:
    def test_change_password_success(self):
        token = register_and_get_token()
        res = change_password(token, STUDENT_ONE["password"], NEW_PASSWORD)

        assert res.status_code == HTTP_200
        assert res.json()["message"] == MSG_PASSWORD_UPDATED

        login_res = login_user(password=NEW_PASSWORD)
        assert login_res.status_code == HTTP_200

    def test_change_password_wrong_current(self):
        token = register_and_get_token()
        res = change_password(token, WRONG_PASSWORD, NEW_PASSWORD)

        assert res.status_code == HTTP_400
        assert MSG_INCORRECT_PASSWORD in res.json()["detail"]

    def test_change_password_too_short(self):
        token = register_and_get_token()
        res = change_password(token, STUDENT_ONE["password"], SHORT_PASSWORD)

        assert res.status_code == HTTP_422

    def test_old_password_no_longer_works(self):
        token = register_and_get_token()
        change_password(token, STUDENT_ONE["password"], NEW_PASSWORD)

        res = login_user(password=STUDENT_ONE["password"])
        assert res.status_code == HTTP_401

# Role switch tests
class TestRoleSwitch:
    def test_switch_to_landlord(self):
        token = register_and_get_token()
        res = switch_role(token, LANDLORD_SWITCH)

        assert res.status_code == HTTP_200
        assert res.json()["role"] == ROLE_LANDLORD

    def test_switch_back_to_student(self):
        token = register_and_get_token()
        switch_role(token, LANDLORD_SWITCH_BASIC)
        res = switch_role(token, STUDENT_SWITCH)

        assert res.status_code == HTTP_200
        assert res.json()["role"] == ROLE_STUDENT

    def test_switch_to_admin_blocked(self):
        token = register_and_get_token()
        res = switch_role(token, ADMIN_SWITCH)

        assert res.status_code == HTTP_403
        assert MSG_ADMIN_BLOCKED in res.json()["detail"]

    def test_landlord_profile_created_on_switch(self, db):
        token = register_and_get_token()
        switch_role(token, LANDLORD_SWITCH)

        user = db.query(User).filter(User.email == STUDENT_ONE["email"]).first()
        landlord = db.query(Landlord).filter(Landlord.user_id == user.id).first()

        assert landlord is not None
        assert landlord.company_name == LANDLORD_SWITCH["company_name"]
        assert landlord.phone == LANDLORD_SWITCH["phone"]

    def test_landlord_profile_persists_after_switch_back(self, db):
        token = register_and_get_token()
        switch_role(token, LANDLORD_SWITCH_PERSIST)
        switch_role(token, STUDENT_SWITCH)

        user = db.query(User).filter(User.email == STUDENT_ONE["email"]).first()
        landlord = db.query(Landlord).filter(Landlord.user_id == user.id).first()

        assert landlord is not None
        assert landlord.company_name == LANDLORD_SWITCH_PERSIST["company_name"]

    def test_switch_to_landlord_twice_no_duplicate(self, db):
        token = register_and_get_token()
        switch_role(token, LANDLORD_SWITCH_BASIC)
        switch_role(token, STUDENT_SWITCH)
        switch_role(token, LANDLORD_SWITCH_BASIC)

        user = db.query(User).filter(User.email == STUDENT_ONE["email"]).first()
        count = db.query(Landlord).filter(Landlord.user_id == user.id).count()

        assert count == 1

# Delete profile tests
class TestDeleteAccount:
    def test_delete_student_account(self, db):
        token = register_and_get_token()
        res = delete_me(token)

        assert res.status_code == HTTP_204

        user = db.query(User).filter(User.email == STUDENT_ONE["email"]).first()
        assert user is None

    def test_delete_landlord_account_cascades(self, db):
        token = register_and_get_token()
        switch_role(token, LANDLORD_SWITCH_BASIC)
        res = delete_me(token)

        assert res.status_code == HTTP_204

        user = db.query(User).filter(User.email == STUDENT_ONE["email"]).first()
        assert user is None
        assert db.query(Landlord).count() == 0

    def test_token_invalid_after_delete(self):
        token = register_and_get_token()
        delete_me(token)

        res = get_me(token)
        assert res.status_code == HTTP_401

# Get UserId tests
class TestGetUserById:
    def test_get_existing_user(self):
        token = register_and_get_token()
        user_id = get_me(token).json()["id"]
        res = get_user_by_id(user_id)

        assert res.status_code == HTTP_200
        assert res.json()["email"] == STUDENT_ONE["email"]

    def test_get_nonexistent_user(self):
        res = get_user_by_id(NONEXISTENT_USER_ID)

        assert res.status_code == HTTP_404
        assert MSG_NOT_FOUND in res.json()["detail"]
