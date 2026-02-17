from conftest import (
    client,
    auth_header,
    register_and_get_token,
    make_landlord,
    create_property_and_get_id,
    create_listing_and_get_id,
    save_listing_api,
    unsave_listing_api,
)
from constants import *

# Save listing tests
class TestSaveListing:
    def test_save_listing(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = register_and_get_token(STUDENT_TWO)
        res = save_listing_api(student_token, listing_id)

        assert res.status_code == HTTP_201
        assert res.json()["listing_id"] == listing_id

    def test_save_duplicate_blocked(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = register_and_get_token(STUDENT_TWO)
        save_listing_api(student_token, listing_id)
        res = save_listing_api(student_token, listing_id)

        assert res.status_code == HTTP_409
        assert MSG_ALREADY_SAVED in res.json()["detail"]

    def test_save_nonexistent_listing(self):
        student_token = register_and_get_token()
        res = save_listing_api(student_token, NONEXISTENT_ID)

        assert res.status_code == HTTP_404

    def test_save_requires_auth(self):
        res = client.post(SAVED_LISTING_URL.format(listing_id=1))
        assert res.status_code == HTTP_401

# Unsave listing tests
class TestUnsaveListing:
    def test_unsave_listing(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = register_and_get_token(STUDENT_TWO)
        save_listing_api(student_token, listing_id)
        res = unsave_listing_api(student_token, listing_id)

        assert res.status_code == HTTP_204

    def test_unsave_not_saved(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = register_and_get_token(STUDENT_TWO)
        res = unsave_listing_api(student_token, listing_id)

        assert res.status_code == HTTP_404
        assert MSG_SAVED_NOT_FOUND in res.json()["detail"]

# View saved listing tests
class TestViewSavedListings:
    def test_list_saved_empty(self):
        student_token = register_and_get_token()
        res = client.get(SAVED_URL, headers=auth_header(student_token))

        assert res.status_code == HTTP_200
        assert res.json() == []

    def test_list_saved_with_data(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = register_and_get_token(STUDENT_TWO)
        save_listing_api(student_token, listing_id)

        res = client.get(SAVED_URL, headers=auth_header(student_token))

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1
        assert res.json()[0]["listing_id"] == listing_id
        assert res.json()[0]["title"] == PROPERTY_ONE["title"]

    def test_saved_only_shows_own(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student1_token = register_and_get_token(STUDENT_TWO)
        student2_token = register_and_get_token(STUDENT_THREE)
        save_listing_api(student1_token, listing_id)
        save_listing_api(student2_token, listing_id)

        res = client.get(SAVED_URL, headers=auth_header(student1_token))

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

    def test_unsaved_listing_disappears(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = register_and_get_token(STUDENT_TWO)
        save_listing_api(student_token, listing_id)
        unsave_listing_api(student_token, listing_id)

        res = client.get(SAVED_URL, headers=auth_header(student_token))

        assert res.status_code == HTTP_200
        assert res.json() == []

# Check saved status tests
class TestCheckSaved:
    def test_check_saved_true(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = register_and_get_token(STUDENT_TWO)
        save_listing_api(student_token, listing_id)

        res = client.get(SAVED_CHECK_URL.format(listing_id=listing_id), headers=auth_header(student_token))

        assert res.status_code == HTTP_200
        assert res.json()["saved"] is True

    def test_check_saved_false(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = register_and_get_token(STUDENT_TWO)

        res = client.get(SAVED_CHECK_URL.format(listing_id=listing_id), headers=auth_header(student_token))

        assert res.status_code == HTTP_200
        assert res.json()["saved"] is False