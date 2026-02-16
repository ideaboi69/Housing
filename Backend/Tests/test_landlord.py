from conftest import (
    client,
    TestSession,
    auth_header,
    register_and_get_token,
    make_landlord,
    get_landlord_id,
    seed_property,
    seed_review,
)
from constants import *
from tables import Landlord

# View own profile test
class TestViewLandlordProfile:
    def test_view_profile_as_landlord(self):
        token = make_landlord()
        res = client.get(LANDLORD_ME_URL, headers=auth_header(token))

        assert res.status_code == HTTP_200
        assert res.json()["company_name"] == LANDLORD_SWITCH["company_name"]
        assert res.json()["phone"] == LANDLORD_SWITCH["phone"]
        assert res.json()["identity_verified"] is False

    def test_view_profile_as_student_blocked(self):
        token = register_and_get_token()
        res = client.get(LANDLORD_ME_URL, headers=auth_header(token))

        assert res.status_code == HTTP_403
        assert MSG_REQUIRES_LANDLORD in res.json()["detail"]

# Update profile tests
class TestUpdateLandlordProfile:
    def test_update_company_name(self):
        token = make_landlord()
        res = client.patch(LANDLORD_ME_URL, json={"company_name": LANDLORD_UPDATE["company_name"]}, headers=auth_header(token))

        assert res.status_code == HTTP_200
        assert res.json()["company_name"] == LANDLORD_UPDATE["company_name"]

    def test_update_phone(self):
        token = make_landlord()
        res = client.patch(LANDLORD_ME_URL, json={"phone": LANDLORD_UPDATE["phone"]}, headers=auth_header(token))

        assert res.status_code == HTTP_200
        assert res.json()["phone"] == LANDLORD_UPDATE["phone"]

    def test_update_both_fields(self):
        token = make_landlord()
        res = client.patch(LANDLORD_ME_URL, json=LANDLORD_UPDATE, headers=auth_header(token))

        assert res.status_code == HTTP_200
        assert res.json()["company_name"] == LANDLORD_UPDATE["company_name"]
        assert res.json()["phone"] == LANDLORD_UPDATE["phone"]

    def test_update_as_student_blocked(self):
        token = register_and_get_token()
        res = client.patch(LANDLORD_ME_URL, json=LANDLORD_UPDATE, headers=auth_header(token))

        assert res.status_code == HTTP_403

# Verification Tests
class TestVerification:
    def test_request_verification(self):
        token = make_landlord()
        res = client.post(LANDLORD_VERIFY_URL, headers=auth_header(token))

        assert res.status_code == HTTP_200
        assert MSG_VERIFICATION_SUBMITTED in res.json()["message"]

    def test_already_verified(self, db):
        token = make_landlord()
        landlord_id = get_landlord_id(token)

        landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
        landlord.identity_verified = True
        db.commit()

        res = client.post(LANDLORD_VERIFY_URL, headers=auth_header(token))

        assert res.status_code == HTTP_400
        assert MSG_ALREADY_VERIFIED in res.json()["detail"]

    def test_verify_as_student_blocked(self):
        token = register_and_get_token()
        res = client.post(LANDLORD_VERIFY_URL, headers=auth_header(token))

        assert res.status_code == HTTP_403

# Public Profile Tests
class TestPublicProfile:
    def test_view_public_profile(self):
        token = make_landlord()
        landlord_id = get_landlord_id(token)

        res = client.get(LANDLORD_BY_ID_URL.format(landlord_id=landlord_id))

        assert res.status_code == HTTP_200
        assert res.json()["company_name"] == LANDLORD_SWITCH["company_name"]
        assert res.json()["total_reviews"] == 0
        assert res.json()["avg_responsiveness"] is None

    def test_public_profile_with_reviews(self, db):
        token = make_landlord()
        landlord_id = get_landlord_id(token)

        student_token = register_and_get_token(STUDENT_TWO)
        student_me = client.get(ME_URL, headers=auth_header(student_token)).json()

        prop = seed_property(landlord_id, db)
        seed_review(student_me["id"], prop.id, landlord_id, db)

        res = client.get(LANDLORD_BY_ID_URL.format(landlord_id=landlord_id))

        assert res.status_code == HTTP_200
        assert res.json()["total_reviews"] == 1
        assert res.json()["avg_responsiveness"] == 4.0
        assert res.json()["avg_maintenance_speed"] == 3.0
        assert res.json()["would_rent_again_pct"] == 100.0

    def test_nonexistent_landlord(self):
        res = client.get(LANDLORD_BY_ID_URL.format(landlord_id=NONEXISTENT_LANDLORD_ID))

        assert res.status_code == HTTP_404
        assert MSG_LANDLORD_NOT_FOUND in res.json()["detail"]

# Landlord properties test
class TestLandlordProperties:
    def test_get_properties_empty(self):
        token = make_landlord()
        landlord_id = get_landlord_id(token)

        res = client.get(LANDLORD_PROPERTIES_URL.format(landlord_id=landlord_id))

        assert res.status_code == HTTP_200
        assert res.json() == []

    def test_get_properties_with_data(self, db):
        token = make_landlord()
        landlord_id = get_landlord_id(token)

        seed_property(landlord_id, db, title="Unit A")
        seed_property(landlord_id, db, title="Unit B")

        res = client.get(LANDLORD_PROPERTIES_URL.format(landlord_id=landlord_id))

        assert res.status_code == HTTP_200
        assert len(res.json()) == 2
        titles = [p["title"] for p in res.json()]
        assert "Unit A" in titles
        assert "Unit B" in titles

    def test_properties_nonexistent_landlord(self):
        res = client.get(LANDLORD_PROPERTIES_URL.format(landlord_id=NONEXISTENT_LANDLORD_ID))

        assert res.status_code == HTTP_404

# Landlord reviews test
class TestLandlordReviews:
    def test_get_reviews_empty(self):
        token = make_landlord()
        landlord_id = get_landlord_id(token)

        res = client.get(LANDLORD_REVIEWS_URL.format(landlord_id=landlord_id))

        assert res.status_code == HTTP_200
        assert res.json() == []

    def test_get_reviews_with_data(self, db):
        token = make_landlord()
        landlord_id = get_landlord_id(token)

        student_token = register_and_get_token(STUDENT_TWO)
        student_me = client.get(ME_URL, headers=auth_header(student_token)).json()

        prop = seed_property(landlord_id, db)
        seed_review(student_me["id"], prop.id, landlord_id, db)

        res = client.get(LANDLORD_REVIEWS_URL.format(landlord_id=landlord_id))

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1
        assert res.json()[0]["responsiveness"] == 4
        assert res.json()[0]["would_rent_again"] is True

    def test_reviews_nonexistent_landlord(self):
        res = client.get(LANDLORD_REVIEWS_URL.format(landlord_id=NONEXISTENT_LANDLORD_ID))

        assert res.status_code == HTTP_404