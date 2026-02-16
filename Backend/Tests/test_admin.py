from conftest import (
    client,
    TestSession,
    auth_header,
    register_and_get_token,
    make_landlord,
    make_admin,
    get_landlord_id,
    seed_property,
    seed_listing,
    seed_review,
    seed_flag,
)
from constants import *
from tables import User, Landlord, Property, Listing, Review, Flag, FlagStatus

# Dashboard Tests
class TestAdminStats:
    def test_get_stats(self, db):
        admin_token = make_admin(db)
        res = client.get(ADMIN_STATS_URL, headers=auth_header(admin_token))

        assert res.status_code == HTTP_200
        data = res.json()
        assert "total_users" in data
        assert "total_landlords" in data
        assert "total_properties" in data
        assert "total_listings" in data
        assert "total_reviews" in data
        assert "total_flags_pending" in data

    def test_stats_blocked_for_student(self):
        token = register_and_get_token()
        res = client.get(ADMIN_STATS_URL, headers=auth_header(token))

        assert res.status_code == HTTP_403
        assert MSG_ADMIN_REQUIRED in res.json()["detail"]

    def test_stats_blocked_for_landlord(self):
        token = make_landlord()
        res = client.get(ADMIN_STATS_URL, headers=auth_header(token))

        assert res.status_code == HTTP_403

# User Tests
class TestAdminUserManagement:
    def test_list_all_users(self, db):
        admin_token = make_admin(db)
        register_and_get_token()

        res = client.get(ADMIN_USERS_URL, headers=auth_header(admin_token))

        assert res.status_code == HTTP_200
        assert len(res.json()) >= 2  # admin + student

    def test_get_user_by_id(self, db):
        admin_token = make_admin(db)
        student_token = register_and_get_token()
        student_id = client.get(ME_URL, headers=auth_header(student_token)).json()["id"]

        res = client.get(ADMIN_USER_BY_ID_URL.format(user_id=student_id), headers=auth_header(admin_token))

        assert res.status_code == HTTP_200
        assert res.json()["email"] == STUDENT_ONE["email"]

    def test_get_nonexistent_user(self, db):
        admin_token = make_admin(db)
        res = client.get(ADMIN_USER_BY_ID_URL.format(user_id=NONEXISTENT_USER_ID), headers=auth_header(admin_token))

        assert res.status_code == HTTP_404

    def test_delete_student(self, db):
        admin_token = make_admin(db)
        student_token = register_and_get_token()
        student_id = client.get(ME_URL, headers=auth_header(student_token)).json()["id"]

        res = client.delete(ADMIN_USER_BY_ID_URL.format(user_id=student_id), headers=auth_header(admin_token))

        assert res.status_code == HTTP_204

        user = db.query(User).filter(User.id == student_id).first()
        assert user is None

    def test_delete_landlord_user_cascades(self, db):
        admin_token = make_admin(db)
        landlord_token = make_landlord()
        landlord_id = get_landlord_id(landlord_token)
        landlord_user_id = client.get(ME_URL, headers=auth_header(landlord_token)).json()["id"]

        # seed some data
        prop = seed_property(landlord_id, db)
        seed_listing(prop.id, db)
        prop_id = prop.id     
        landlord_id_saved = landlord_id

        res = client.delete(ADMIN_USER_BY_ID_URL.format(user_id=landlord_user_id), headers=auth_header(admin_token))

        assert res.status_code == HTTP_204

        assert db.query(User).filter(User.id == landlord_user_id).first() is None
        assert db.query(Landlord).filter(Landlord.id == landlord_id).first() is None
        assert db.query(Property).filter(Property.landlord_id == landlord_id_saved).count() == 0
        assert db.query(Listing).filter(Listing.property_id == prop_id).count() == 0

    def test_cannot_delete_admin(self, db):
        admin_token = make_admin(db)
        admin_user = db.query(User).filter(User.email == ADMIN_USER["email"]).first()

        res = client.delete(ADMIN_USER_BY_ID_URL.format(user_id=admin_user.id), headers=auth_header(admin_token))

        assert res.status_code == HTTP_403
        assert MSG_CANNOT_DELETE_ADMIN in res.json()["detail"]

    def test_student_cannot_delete_users(self):
        token = register_and_get_token()
        res = client.delete(ADMIN_USER_BY_ID_URL.format(user_id=1), headers=auth_header(token))

        assert res.status_code == HTTP_403

# Landlord Tests
class TestAdminLandlordManagement:
    def test_list_all_landlords(self, db):
        admin_token = make_admin(db)
        make_landlord()

        res = client.get(ADMIN_LANDLORDS_URL, headers=auth_header(admin_token))

        assert res.status_code == HTTP_200
        assert len(res.json()) >= 1
        assert res.json()[0]["first_name"] is not None
        assert res.json()[0]["email"] is not None

    def test_delete_landlord_reverts_to_student(self, db):
        admin_token = make_admin(db)
        landlord_token = make_landlord()
        landlord_id = get_landlord_id(landlord_token)
        user_id = client.get(ME_URL, headers=auth_header(landlord_token)).json()["id"]

        res = client.delete(ADMIN_LANDLORD_BY_ID_URL.format(landlord_id=landlord_id), headers=auth_header(admin_token))

        assert res.status_code == HTTP_204

        # landlord gone
        assert db.query(Landlord).filter(Landlord.id == landlord_id).first() is None
        # user still exists as student
        user = db.query(User).filter(User.id == user_id).first()
        assert user is not None
        assert user.role.value == ROLE_STUDENT

    def test_delete_landlord_cascades_properties(self, db):
        admin_token = make_admin(db)
        landlord_token = make_landlord()
        landlord_id = get_landlord_id(landlord_token)

        prop = seed_property(landlord_id, db)
        seed_listing(prop.id, db)
        prop_id = prop.id
        landlord_id_saved = landlord_id

        client.delete(ADMIN_LANDLORD_BY_ID_URL.format(landlord_id=landlord_id), headers=auth_header(admin_token))

        assert db.query(Property).filter(Property.landlord_id == landlord_id_saved).count() == 0
        assert db.query(Listing).filter(Listing.property_id == prop_id).count() == 0

    def test_delete_nonexistent_landlord(self, db):
        admin_token = make_admin(db)
        res = client.delete(ADMIN_LANDLORD_BY_ID_URL.format(landlord_id=NONEXISTENT_LANDLORD_ID), headers=auth_header(admin_token))

        assert res.status_code == HTTP_404

# Verification Tests
class TestAdminVerification:
    def test_verify_landlord(self, db):
        admin_token = make_admin(db)
        landlord_token = make_landlord()
        landlord_id = get_landlord_id(landlord_token)

        res = client.patch(ADMIN_VERIFY_LANDLORD_URL.format(landlord_id=landlord_id), headers=auth_header(admin_token))

        assert res.status_code == HTTP_200

        landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
        assert landlord.identity_verified is True

    def test_verify_already_verified(self, db):
        admin_token = make_admin(db)
        landlord_token = make_landlord()
        landlord_id = get_landlord_id(landlord_token)

        # verify first
        client.patch(ADMIN_VERIFY_LANDLORD_URL.format(landlord_id=landlord_id), headers=auth_header(admin_token))
        # try again
        res = client.patch(ADMIN_VERIFY_LANDLORD_URL.format(landlord_id=landlord_id), headers=auth_header(admin_token))

        assert res.status_code == HTTP_400

    def test_unverify_landlord(self, db):
        admin_token = make_admin(db)
        landlord_token = make_landlord()
        landlord_id = get_landlord_id(landlord_token)

        # verify then unverify
        client.patch(ADMIN_VERIFY_LANDLORD_URL.format(landlord_id=landlord_id), headers=auth_header(admin_token))
        res = client.patch(ADMIN_UNVERIFY_LANDLORD_URL.format(landlord_id=landlord_id), headers=auth_header(admin_token))

        assert res.status_code == HTTP_200

        landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
        assert landlord.identity_verified is False

    def test_unverify_not_verified(self, db):
        admin_token = make_admin(db)
        landlord_token = make_landlord()
        landlord_id = get_landlord_id(landlord_token)

        res = client.patch(ADMIN_UNVERIFY_LANDLORD_URL.format(landlord_id=landlord_id), headers=auth_header(admin_token))

        assert res.status_code == HTTP_400

# Listing Tests
class TestAdminListingManagement:
    def test_list_all_listings(self, db):
        admin_token = make_admin(db)
        landlord_token = make_landlord()
        landlord_id = get_landlord_id(landlord_token)

        prop = seed_property(landlord_id, db)
        seed_listing(prop.id, db)

        res = client.get(ADMIN_LISTINGS_URL, headers=auth_header(admin_token))

        assert res.status_code == HTTP_200
        assert len(res.json()) >= 1

    def test_delete_listing(self, db):
        admin_token = make_admin(db)
        landlord_token = make_landlord()
        landlord_id = get_landlord_id(landlord_token)

        prop = seed_property(landlord_id, db)
        listing = seed_listing(prop.id, db)

        res = client.delete(ADMIN_LISTING_BY_ID_URL.format(listing_id=listing.id), headers=auth_header(admin_token))

        assert res.status_code == HTTP_204
        assert db.query(Listing).filter(Listing.id == listing.id).first() is None

    def test_delete_nonexistent_listing(self, db):
        admin_token = make_admin(db)
        res = client.delete(ADMIN_LISTING_BY_ID_URL.format(listing_id=99999), headers=auth_header(admin_token))

        assert res.status_code == HTTP_404

# Review Tests
class TestAdminReviewManagement:
    def test_delete_review(self, db):
        admin_token = make_admin(db)
        landlord_token = make_landlord()
        landlord_id = get_landlord_id(landlord_token)
        student_token = register_and_get_token(STUDENT_TWO)
        student_id = client.get(ME_URL, headers=auth_header(student_token)).json()["id"]

        prop = seed_property(landlord_id, db)
        review = seed_review(student_id, prop.id, landlord_id, db)

        res = client.delete(ADMIN_REVIEWS_URL.format(review_id=review.id), headers=auth_header(admin_token))

        assert res.status_code == HTTP_204
        assert db.query(Review).filter(Review.id == review.id).first() is None

    def test_delete_nonexistent_review(self, db):
        admin_token = make_admin(db)
        res = client.delete(ADMIN_REVIEWS_URL.format(review_id=99999), headers=auth_header(admin_token))

        assert res.status_code == HTTP_404

# Flag Tests
class TestAdminFlagManagement:
    def test_list_pending_flags(self, db):
        admin_token = make_admin(db)
        student_token = register_and_get_token()
        student_id = client.get(ME_URL, headers=auth_header(student_token)).json()["id"]

        seed_flag(student_id, db)

        res = client.get(ADMIN_FLAGS_URL, headers=auth_header(admin_token))

        assert res.status_code == HTTP_200
        assert len(res.json()) >= 1
        assert res.json()[0]["status"] == "pending"

    def test_resolve_flag(self, db):
        admin_token = make_admin(db)
        student_token = register_and_get_token()
        student_id = client.get(ME_URL, headers=auth_header(student_token)).json()["id"]

        flag = seed_flag(student_id, db)
        res = client.patch(ADMIN_FLAG_RESOLVE_URL.format(flag_id=flag.id), headers=auth_header(admin_token))

        assert res.status_code == HTTP_200

        db.expire_all()
        updated = db.query(Flag).filter(Flag.id == flag.id).first()
        assert updated.status == FlagStatus.RESOLVED

    def test_dismiss_flag(self, db):
        admin_token = make_admin(db)
        student_token = register_and_get_token()
        student_id = client.get(ME_URL, headers=auth_header(student_token)).json()["id"]

        flag = seed_flag(student_id, db)
        res = client.patch(ADMIN_FLAG_DISMISS_URL.format(flag_id=flag.id), headers=auth_header(admin_token))

        assert res.status_code == HTTP_200

        db.expire_all()
        updated = db.query(Flag).filter(Flag.id == flag.id).first()
        assert updated.status == FlagStatus.REVIEWED

    def test_resolve_nonexistent_flag(self, db):
        admin_token = make_admin(db)
        res = client.patch(ADMIN_FLAG_RESOLVE_URL.format(flag_id=99999), headers=auth_header(admin_token))

        assert res.status_code == HTTP_404