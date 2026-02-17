from conftest import (
    client,
    auth_header,
    register_and_get_token,
    make_landlord,
    get_landlord_id,
    create_property_api,
    create_property_and_get_id,
    create_listing_api,
)
from constants import *

# Create Property Tests
class TestCreateProperty:
    def test_create_property_as_landlord(self):
        token = make_landlord()
        res = create_property_api(token)

        assert res.status_code == HTTP_201
        data = res.json()
        assert data["title"] == PROPERTY_ONE["title"]
        assert data["address"] == PROPERTY_ONE["address"]
        assert data["is_furnished"] == PROPERTY_ONE["is_furnished"]
        assert data["landlord_id"] is not None

    def test_create_property_as_student_blocked(self):
        token = register_and_get_token()
        res = create_property_api(token)

        assert res.status_code == HTTP_403
        assert MSG_REQUIRES_LANDLORD in res.json()["detail"]

    def test_create_multiple_properties(self):
        token = make_landlord()
        res1 = create_property_api(token, PROPERTY_ONE)
        res2 = create_property_api(token, PROPERTY_TWO)

        assert res1.status_code == HTTP_201
        assert res2.status_code == HTTP_201
        assert res1.json()["id"] != res2.json()["id"]

# Browse Property Tests (public)
class TestBrowseProperties:
    def test_list_properties_empty(self):
        res = client.get(PROPERTIES_URL)

        assert res.status_code == HTTP_200
        assert res.json() == []

    def test_list_properties_with_data(self):
        token = make_landlord()
        create_property_api(token, PROPERTY_ONE)
        create_property_api(token, PROPERTY_TWO)

        res = client.get(PROPERTIES_URL)

        assert res.status_code == HTTP_200
        assert len(res.json()) == 2

    def test_list_properties_no_auth_required(self):
        token = make_landlord()
        create_property_api(token)

        res = client.get(PROPERTIES_URL)  # no auth header
        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

    def test_get_single_property(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)

        res = client.get(PROPERTY_BY_ID_URL.format(property_id=prop_id))

        assert res.status_code == HTTP_200
        assert res.json()["id"] == prop_id
        assert res.json()["title"] == PROPERTY_ONE["title"]

    def test_get_nonexistent_property(self):
        res = client.get(PROPERTY_BY_ID_URL.format(property_id=NONEXISTENT_ID))

        assert res.status_code == HTTP_404
        assert MSG_PROPERTY_NOT_FOUND in res.json()["detail"]

# My Property Tests
class TestMyProperties:
    def test_list_my_properties(self):
        token = make_landlord()
        create_property_api(token, PROPERTY_ONE)
        create_property_api(token, PROPERTY_TWO)

        res = client.get(MY_PROPERTIES_URL, headers=auth_header(token))

        assert res.status_code == HTTP_200
        assert len(res.json()) == 2

    def test_my_properties_only_shows_own(self):
        token1 = make_landlord()
        token2 = make_landlord(STUDENT_TWO)
        create_property_api(token1, PROPERTY_ONE)
        create_property_api(token2, PROPERTY_TWO)

        res = client.get(MY_PROPERTIES_URL, headers=auth_header(token1))

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1
        assert res.json()[0]["title"] == PROPERTY_ONE["title"]

    def test_my_properties_as_student_blocked(self):
        token = register_and_get_token()
        res = client.get(MY_PROPERTIES_URL, headers=auth_header(token))

        assert res.status_code == HTTP_403

# Update Property Tests
class TestUpdateProperty:
    def test_update_title(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)

        res = client.patch(PROPERTY_BY_ID_URL.format(property_id=prop_id),
                           json={"title": "Updated Title"}, headers=auth_header(token))

        assert res.status_code == HTTP_200
        assert res.json()["title"] == "Updated Title"

    def test_update_multiple_fields(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)

        res = client.patch(PROPERTY_BY_ID_URL.format(property_id=prop_id),
                           json={"is_furnished": False, "has_parking": False}, headers=auth_header(token))

        assert res.status_code == HTTP_200
        assert res.json()["is_furnished"] is False
        assert res.json()["has_parking"] is False

    def test_cannot_update_others_property(self):
        token1 = make_landlord()
        token2 = make_landlord(STUDENT_TWO)
        prop_id = create_property_and_get_id(token1)

        res = client.patch(PROPERTY_BY_ID_URL.format(property_id=prop_id),
                           json={"title": "Hacked"}, headers=auth_header(token2))

        assert res.status_code == HTTP_403
        assert MSG_NOT_YOUR_PROPERTY in res.json()["detail"]

    def test_update_nonexistent_property(self):
        token = make_landlord()
        res = client.patch(PROPERTY_BY_ID_URL.format(property_id=NONEXISTENT_ID),
                           json={"title": "Ghost"}, headers=auth_header(token))

        assert res.status_code == HTTP_404

# Delete Property Tests
class TestDeleteProperty:
    def test_delete_own_property(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)

        res = client.delete(PROPERTY_BY_ID_URL.format(property_id=prop_id), headers=auth_header(token))

        assert res.status_code == HTTP_204

        get_res = client.get(PROPERTY_BY_ID_URL.format(property_id=prop_id))
        assert get_res.status_code == HTTP_404

    def test_delete_cascades_listings(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)
        create_listing_api(token, prop_id)

        res = client.delete(PROPERTY_BY_ID_URL.format(property_id=prop_id), headers=auth_header(token))

        assert res.status_code == HTTP_204

    def test_cannot_delete_others_property(self):
        token1 = make_landlord()
        token2 = make_landlord(STUDENT_TWO)
        prop_id = create_property_and_get_id(token1)

        res = client.delete(PROPERTY_BY_ID_URL.format(property_id=prop_id), headers=auth_header(token2))

        assert res.status_code == HTTP_403

    def test_delete_nonexistent_property(self):
        token = make_landlord()
        res = client.delete(PROPERTY_BY_ID_URL.format(property_id=NONEXISTENT_ID), headers=auth_header(token))

        assert res.status_code == HTTP_404