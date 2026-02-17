from conftest import (
    client,
    auth_header,
    register_and_get_token,
    make_landlord,
    create_property_and_get_id,
    create_listing_api,
    create_listing_and_get_id,
)
from constants import *

# Create Listing Tests
class TestCreateListing:
    def test_create_listing(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)
        res = create_listing_api(token, prop_id)

        assert res.status_code == HTTP_201
        data = res.json()
        assert data["property_id"] == prop_id
        assert float(data["rent_per_room"]) == LISTING_ONE["rent_per_room"]
        assert data["status"] == "active"
        assert data["view_count"] == 0

    def test_create_sublet_listing(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)
        res = create_listing_api(token, prop_id, LISTING_SUBLET)

        assert res.status_code == HTTP_201
        assert res.json()["is_sublet"] is True
        assert res.json()["sublet_start_date"] == LISTING_SUBLET["sublet_start_date"]

    def test_create_listing_on_others_property(self):
        token1 = make_landlord()
        token2 = make_landlord(STUDENT_TWO)
        prop_id = create_property_and_get_id(token1)

        res = create_listing_api(token2, prop_id)

        assert res.status_code == HTTP_403

    def test_create_listing_on_nonexistent_property(self):
        token = make_landlord()
        res = create_listing_api(token, NONEXISTENT_ID)

        assert res.status_code == HTTP_404

    def test_create_listing_as_student_blocked(self):
        token = register_and_get_token()
        res = create_listing_api(token, 1)

        assert res.status_code == HTTP_403

# Browse Listing Tests (public)
class TestBrowseListings:
    def test_list_listings_empty(self):
        res = client.get(LISTINGS_URL)

        assert res.status_code == HTTP_200
        assert res.json() == []

    def test_list_listings_with_data(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)
        create_listing_api(token, prop_id)

        res = client.get(LISTINGS_URL)

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1
        # should include property info
        assert res.json()[0]["title"] == PROPERTY_ONE["title"]
        assert res.json()[0]["landlord_name"] is not None

    def test_list_listings_no_auth_required(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)
        create_listing_api(token, prop_id)

        res = client.get(LISTINGS_URL)  # no auth
        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

    def test_get_single_listing(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)
        listing_id = create_listing_and_get_id(token, prop_id)

        res = client.get(LISTING_BY_ID_URL.format(listing_id=listing_id))

        assert res.status_code == HTTP_200
        assert res.json()["id"] == listing_id
        assert res.json()["address"] == PROPERTY_ONE["address"]

    def test_get_listing_increments_view_count(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)
        listing_id = create_listing_and_get_id(token, prop_id)

        client.get(LISTING_BY_ID_URL.format(listing_id=listing_id))
        client.get(LISTING_BY_ID_URL.format(listing_id=listing_id))
        res = client.get(LISTING_BY_ID_URL.format(listing_id=listing_id))

        assert res.json()["view_count"] == 3

    def test_get_nonexistent_listing(self):
        res = client.get(LISTING_BY_ID_URL.format(listing_id=NONEXISTENT_ID))

        assert res.status_code == HTTP_404

# Filter Tests
class TestListingFilters:
    def _setup_two_listings(self):
        """Create two listings: one expensive furnished, one cheap unfurnished."""
        token = make_landlord()
        prop1_id = create_property_and_get_id(token, PROPERTY_ONE)   # furnished
        prop2_id = create_property_and_get_id(token, PROPERTY_TWO)   # not furnished
        create_listing_api(token, prop1_id, LISTING_ONE)             # 650/room
        create_listing_api(token, prop2_id, LISTING_CHEAP)           # 400/room
        return token

    def test_filter_by_price_max(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"price_max": 500})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1
        assert float(res.json()[0]["rent_per_room"]) == 400.0

    def test_filter_by_price_min(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"price_min": 600})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1
        assert float(res.json()[0]["rent_per_room"]) == 650.0

    def test_filter_by_price_range(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"price_min": 300, "price_max": 500})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

    def test_filter_by_furnished(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"is_furnished": True})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1
        assert res.json()[0]["is_furnished"] is True

    def test_filter_by_not_furnished(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"is_furnished": False})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1
        assert res.json()[0]["is_furnished"] is False

    def test_filter_by_property_type(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"property_type": "apartment"})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1
        assert res.json()[0]["property_type"] == "apartment"

    def test_filter_by_lease_type(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"lease_type": "8_month"})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

    def test_filter_by_sublet(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)
        create_listing_api(token, prop_id, LISTING_ONE)
        create_listing_api(token, prop_id, LISTING_SUBLET)

        res = client.get(LISTINGS_URL, params={"is_sublet": True})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1
        assert res.json()[0]["is_sublet"] is True

    def test_filter_by_distance(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"distance_max": 2.0})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1  # only property_one is 1.5km

    def test_filter_by_utilities_included(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"utilities_included": True})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1
        assert res.json()[0]["utilities_included"] is True

    def test_sort_by_price_asc(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"sort_by": "rent_per_room", "sort_order": "asc"})

        assert res.status_code == HTTP_200
        prices = [float(l["rent_per_room"]) for l in res.json()]
        assert prices == sorted(prices)

    def test_sort_by_price_desc(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"sort_by": "rent_per_room", "sort_order": "desc"})

        assert res.status_code == HTTP_200
        prices = [float(l["rent_per_room"]) for l in res.json()]
        assert prices == sorted(prices, reverse=True)

    def test_pagination_limit(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"limit": 1})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

    def test_pagination_skip(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"skip": 1, "limit": 10})

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

    def test_no_results_for_impossible_filter(self):
        self._setup_two_listings()
        res = client.get(LISTINGS_URL, params={"price_min": 9999})

        assert res.status_code == HTTP_200
        assert res.json() == []

# My Listings Test
class TestMyListings:
    def test_list_my_listings(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)
        create_listing_api(token, prop_id)

        res = client.get(MY_LISTINGS_URL, headers=auth_header(token))

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

    def test_my_listings_only_shows_own(self):
        token1 = make_landlord()
        token2 = make_landlord(STUDENT_TWO)
        prop1_id = create_property_and_get_id(token1)
        prop2_id = create_property_and_get_id(token2)
        create_listing_api(token1, prop1_id)
        create_listing_api(token2, prop2_id)

        res = client.get(MY_LISTINGS_URL, headers=auth_header(token1))

        assert res.status_code == HTTP_200
        assert len(res.json()) == 1

# Update Listing Tests
class TestUpdateListing:
    def test_update_rent(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)
        listing_id = create_listing_and_get_id(token, prop_id)

        res = client.patch(LISTING_BY_ID_URL.format(listing_id=listing_id),
                           json={"rent_per_room": 700.00}, headers=auth_header(token))

        assert res.status_code == HTTP_200
        assert float(res.json()["rent_per_room"]) == 700.0

    def test_update_status_to_rented(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)
        listing_id = create_listing_and_get_id(token, prop_id)

        res = client.patch(LISTING_BY_ID_URL.format(listing_id=listing_id),
                           json={"status": "rented"}, headers=auth_header(token))

        assert res.status_code == HTTP_200
        assert res.json()["status"] == "rented"

    def test_cannot_update_others_listing(self):
        token1 = make_landlord()
        token2 = make_landlord(STUDENT_TWO)
        prop_id = create_property_and_get_id(token1)
        listing_id = create_listing_and_get_id(token1, prop_id)

        res = client.patch(LISTING_BY_ID_URL.format(listing_id=listing_id),
                           json={"rent_per_room": 1.00}, headers=auth_header(token2))

        assert res.status_code == HTTP_403

# Sublet Conversion Tests
class TestSubletConversion:
    def test_convert_to_sublet(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)
        listing_id = create_listing_and_get_id(token, prop_id)

        res = client.patch(LISTING_SUBLET_URL.format(listing_id=listing_id),
                           json=SUBLET_CONVERT_DATA, headers=auth_header(token))

        assert res.status_code == HTTP_200
        assert res.json()["is_sublet"] is True
        assert res.json()["sublet_start_date"] == SUBLET_CONVERT_DATA["sublet_start_date"]
        assert res.json()["sublet_end_date"] == SUBLET_CONVERT_DATA["sublet_end_date"]

    def test_cannot_convert_others_listing(self):
        token1 = make_landlord()
        token2 = make_landlord(STUDENT_TWO)
        prop_id = create_property_and_get_id(token1)
        listing_id = create_listing_and_get_id(token1, prop_id)

        res = client.patch(LISTING_SUBLET_URL.format(listing_id=listing_id),
                           json=SUBLET_CONVERT_DATA, headers=auth_header(token2))

        assert res.status_code == HTTP_403

# Delete Listing Tests
class TestDeleteListing:
    def test_delete_own_listing(self):
        token = make_landlord()
        prop_id = create_property_and_get_id(token)
        listing_id = create_listing_and_get_id(token, prop_id)

        res = client.delete(LISTING_BY_ID_URL.format(listing_id=listing_id), headers=auth_header(token))

        assert res.status_code == HTTP_204

        get_res = client.get(LISTING_BY_ID_URL.format(listing_id=listing_id))
        assert get_res.status_code == HTTP_404

    def test_cannot_delete_others_listing(self):
        token1 = make_landlord()
        token2 = make_landlord(STUDENT_TWO)
        prop_id = create_property_and_get_id(token1)
        listing_id = create_listing_and_get_id(token1, prop_id)

        res = client.delete(LISTING_BY_ID_URL.format(listing_id=listing_id), headers=auth_header(token2))

        assert res.status_code == HTTP_403

    def test_delete_nonexistent_listing(self):
        token = make_landlord()
        res = client.delete(LISTING_BY_ID_URL.format(listing_id=NONEXISTENT_ID), headers=auth_header(token))

        assert res.status_code == HTTP_404