from conftest import (
    client,
    auth_header,
    register_and_get_token,
    make_landlord,
    make_verified_student,
    create_property_and_get_id,
    create_review_api,
)
from constants import *

# Create Review Tests 
class TestCreateReview:
    def test_create_review(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student_token = make_verified_student(STUDENT_TWO)
        res = create_review_api(student_token, prop_id)

        assert res.status_code == HTTP_201
        data = res.json()
        assert data["property_id"] == prop_id
        assert data["responsiveness"] == REVIEW_ONE["responsiveness"]
        assert data["would_rent_again"] == REVIEW_ONE["would_rent_again"]
        assert data["comment"] == REVIEW_ONE["comment"]
        assert data["landlord_id"] is not None

    def test_create_review_unverified_blocked(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student_token = register_and_get_token(STUDENT_TWO)  # not verified
        res = create_review_api(student_token, prop_id)

        assert res.status_code == HTTP_403
        assert MSG_EMAIL_NOT_VERIFIED in res.json()["detail"]

    def test_duplicate_review_blocked(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student_token = make_verified_student(STUDENT_TWO)
        create_review_api(student_token, prop_id)
        res = create_review_api(student_token, prop_id)

        assert res.status_code == HTTP_409
        assert MSG_ALREADY_REVIEWED in res.json()["detail"]

    def test_review_nonexistent_property(self):
        student_token = make_verified_student()
        res = create_review_api(student_token, NONEXISTENT_ID)

        assert res.status_code == HTTP_404
        assert MSG_PROPERTY_NOT_FOUND in res.json()["detail"]

    def test_invalid_rating_too_high(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student_token = make_verified_student(STUDENT_TWO)
        res = create_review_api(student_token, prop_id, REVIEW_BAD_RATING)

        assert res.status_code == HTTP_422

    def test_invalid_rating_too_low(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student_token = make_verified_student(STUDENT_TWO)
        bad_review = {**REVIEW_ONE, "responsiveness": 0}
        res = create_review_api(student_token, prop_id, bad_review)

        assert res.status_code == HTTP_422

    def test_review_auto_links_landlord(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student_token = make_verified_student(STUDENT_TWO)
        res = create_review_api(student_token, prop_id)

        # landlord_id should be set automatically from the property
        assert res.status_code == HTTP_201
        assert res.json()["landlord_id"] is not None

# Browse Review Tests (public)
class TestBrowseReviews:
    def test_list_reviews_empty(self):
        res = client.get(REVIEWS_URL)

        assert res.status_code == HTTP_200
        assert res.json() == []

    def test_list_reviews_with_data(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student_token = make_verified_student(STUDENT_TWO)
        create_review_api(student_token, prop_id)

        res = client.get(REVIEWS_URL)

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

    def test_list_reviews_no_auth_required(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student_token = make_verified_student(STUDENT_TWO)
        create_review_api(student_token, prop_id)

        res = client.get(REVIEWS_URL)  # no auth header
        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

    def test_filter_reviews_by_property(self):
        landlord_token = make_landlord()
        prop1_id = create_property_and_get_id(landlord_token, PROPERTY_ONE)
        prop2_id = create_property_and_get_id(landlord_token, PROPERTY_TWO)

        student_token = make_verified_student(STUDENT_TWO)
        create_review_api(student_token, prop1_id)
        create_review_api(student_token, prop2_id)

        res = client.get(REVIEWS_URL, params={"property_id": prop1_id})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1
        assert res.json()[0]["property_id"] == prop1_id

    def test_filter_reviews_by_landlord(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student_token = make_verified_student(STUDENT_TWO)
        review = create_review_api(student_token, prop_id).json()

        res = client.get(REVIEWS_URL, params={"landlord_id": review["landlord_id"]})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

    def test_get_single_review(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student_token = make_verified_student(STUDENT_TWO)
        review_id = create_review_api(student_token, prop_id).json()["id"]

        res = client.get(REVIEW_BY_ID_URL.format(review_id=review_id))

        assert res.status_code == HTTP_200
        assert res.json()["id"] == review_id

    def test_get_nonexistent_review(self):
        res = client.get(REVIEW_BY_ID_URL.format(review_id=NONEXISTENT_ID))

        assert res.status_code == HTTP_404

    def test_review_pagination(self):
        landlord_token = make_landlord()
        prop1_id = create_property_and_get_id(landlord_token, PROPERTY_ONE)
        prop2_id = create_property_and_get_id(landlord_token, PROPERTY_TWO)

        student_token = make_verified_student(STUDENT_TWO)
        create_review_api(student_token, prop1_id)
        create_review_api(student_token, prop2_id)

        res = client.get(REVIEWS_URL, params={"limit": 1})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

# My Review Tests
class TestMyReviews:
    def test_list_my_reviews(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student_token = make_verified_student(STUDENT_TWO)
        create_review_api(student_token, prop_id)

        res = client.get(MY_REVIEWS_URL, headers=auth_header(student_token))

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

    def test_my_reviews_only_shows_own(self):
        landlord_token = make_landlord()
        prop1_id = create_property_and_get_id(landlord_token, PROPERTY_ONE)
        prop2_id = create_property_and_get_id(landlord_token, PROPERTY_TWO)

        student1_token = make_verified_student(STUDENT_THREE)
        student2_token = make_verified_student(STUDENT_TWO)
        create_review_api(student1_token, prop1_id)
        create_review_api(student2_token, prop2_id)

        res = client.get(MY_REVIEWS_URL, headers=auth_header(student1_token))

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

# Update Review Tests
class TestUpdateReview:
    def test_update_own_review(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student_token = make_verified_student(STUDENT_TWO)
        review_id = create_review_api(student_token, prop_id).json()["id"]

        res = client.patch(REVIEW_BY_ID_URL.format(review_id=review_id),
                           json=REVIEW_UPDATE, headers=auth_header(student_token))

        assert res.status_code == HTTP_200
        assert res.json()["responsiveness"] == REVIEW_UPDATE["responsiveness"]
        assert res.json()["comment"] == REVIEW_UPDATE["comment"]
        # unchanged fields should stay
        assert res.json()["maintenance_speed"] == REVIEW_ONE["maintenance_speed"]

    def test_cannot_update_others_review(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student1_token = make_verified_student(STUDENT_THREE)
        student2_token = make_verified_student(STUDENT_TWO)
        review_id = create_review_api(student1_token, prop_id).json()["id"]

        res = client.patch(REVIEW_BY_ID_URL.format(review_id=review_id),
                           json=REVIEW_UPDATE, headers=auth_header(student2_token))

        assert res.status_code == HTTP_403
        assert MSG_NOT_YOUR_REVIEW in res.json()["detail"]

    def test_update_nonexistent_review(self):
        student_token = make_verified_student()
        res = client.patch(REVIEW_BY_ID_URL.format(review_id=NONEXISTENT_ID),
                           json=REVIEW_UPDATE, headers=auth_header(student_token))

        assert res.status_code == HTTP_404

# Delete Review Tests
class TestDeleteReview:
    def test_delete_own_review(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student_token = make_verified_student(STUDENT_TWO)
        review_id = create_review_api(student_token, prop_id).json()["id"]

        res = client.delete(REVIEW_BY_ID_URL.format(review_id=review_id), headers=auth_header(student_token))

        assert res.status_code == HTTP_204

        get_res = client.get(REVIEW_BY_ID_URL.format(review_id=review_id))
        assert get_res.status_code == HTTP_404

    def test_cannot_delete_others_review(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)

        student1_token = make_verified_student(STUDENT_THREE)
        student2_token = make_verified_student(STUDENT_TWO)
        review_id = create_review_api(student1_token, prop_id).json()["id"]

        res = client.delete(REVIEW_BY_ID_URL.format(review_id=review_id), headers=auth_header(student2_token))

        assert res.status_code == HTTP_403

    def test_delete_nonexistent_review(self):
        student_token = make_verified_student()
        res = client.delete(REVIEW_BY_ID_URL.format(review_id=NONEXISTENT_ID), headers=auth_header(student_token))

        assert res.status_code == HTTP_404