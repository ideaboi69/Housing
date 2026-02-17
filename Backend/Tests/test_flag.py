from conftest import (
    client,
    auth_header,
    register_and_get_token,
    make_landlord,
    make_verified_student,
    create_property_and_get_id,
    create_listing_and_get_id,
    create_review_api,
    create_flag_api,
)
from constants import *

# Create flag tests
class TestCreateFlag:
    def test_flag_listing(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = register_and_get_token(STUDENT_TWO)
        res = create_flag_api(student_token, listing_id=listing_id, reason=FLAG_LISTING["reason"])

        assert res.status_code == HTTP_201
        assert res.json()["listing_id"] == listing_id
        assert res.json()["status"] == "pending"

    def test_flag_review(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        reviewer_token = make_verified_student(STUDENT_TWO)
        review = create_review_api(reviewer_token, prop_id).json()

        flagger_token = register_and_get_token(STUDENT_THREE)
        res = create_flag_api(flagger_token, review_id=review["id"], reason=FLAG_REVIEW["reason"])

        assert res.status_code == HTTP_201
        assert res.json()["review_id"] == review["id"]

    def test_flag_nothing_blocked(self):
        student_token = register_and_get_token()
        res = client.post(FLAGS_URL, json={"reason": "No target"}, headers=auth_header(student_token))

        assert res.status_code == HTTP_400
        assert MSG_MUST_FLAG_SOMETHING in res.json()["detail"]

    def test_flag_nonexistent_listing(self):
        student_token = register_and_get_token()
        res = create_flag_api(student_token, listing_id=NONEXISTENT_ID)

        assert res.status_code == HTTP_404

    def test_flag_nonexistent_review(self):
        student_token = register_and_get_token()
        res = create_flag_api(student_token, review_id=NONEXISTENT_ID)

        assert res.status_code == HTTP_404

    def test_duplicate_flag_blocked(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = register_and_get_token(STUDENT_TWO)
        create_flag_api(student_token, listing_id=listing_id)
        res = create_flag_api(student_token, listing_id=listing_id)

        assert res.status_code == HTTP_409
        assert MSG_ALREADY_FLAGGED in res.json()["detail"]

    def test_flag_requires_auth(self):
        res = client.post(FLAGS_URL, json={"listing_id": 1, "reason": "test"})
        assert res.status_code == HTTP_401

# My flag tests
class TestMyFlags:
    def test_list_my_flags_empty(self):
        student_token = register_and_get_token()
        res = client.get(MY_FLAGS_URL, headers=auth_header(student_token))

        assert res.status_code == HTTP_200
        assert res.json() == []

    def test_list_my_flags_with_data(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = register_and_get_token(STUDENT_TWO)
        create_flag_api(student_token, listing_id=listing_id)

        res = client.get(MY_FLAGS_URL, headers=auth_header(student_token))

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1
        assert res.json()[0]["listing_id"] == listing_id

    def test_my_flags_only_shows_own(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student1_token = register_and_get_token(STUDENT_TWO)
        student2_token = register_and_get_token(STUDENT_THREE)
        create_flag_api(student1_token, listing_id=listing_id)
        create_flag_api(student2_token, listing_id=listing_id)

        res = client.get(MY_FLAGS_URL, headers=auth_header(student1_token))

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

# Get single flag test
class TestGetFlag:
    def test_get_own_flag(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = register_and_get_token(STUDENT_TWO)
        flag = create_flag_api(student_token, listing_id=listing_id).json()

        res = client.get(FLAG_BY_ID_URL.format(flag_id=flag["id"]), headers=auth_header(student_token))

        assert res.status_code == HTTP_200
        assert res.json()["id"] == flag["id"]

    def test_cannot_view_others_flag(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student1_token = register_and_get_token(STUDENT_TWO)
        student2_token = register_and_get_token(STUDENT_THREE)
        flag = create_flag_api(student1_token, listing_id=listing_id).json()

        res = client.get(FLAG_BY_ID_URL.format(flag_id=flag["id"]), headers=auth_header(student2_token))

        assert res.status_code == HTTP_403

    def test_get_nonexistent_flag(self):
        student_token = register_and_get_token()
        res = client.get(FLAG_BY_ID_URL.format(flag_id=NONEXISTENT_ID), headers=auth_header(student_token))

        assert res.status_code == HTTP_404