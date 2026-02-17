from conftest import (
    client,
    auth_header,
    make_landlord,
    make_verified_student,
    create_property_and_get_id,
    create_listing_and_get_id,
    create_review_api,
    compute_health_score_api,
    get_health_score_api,
)
from constants import *

# Calculate healthscore test
class TestComputeHealthScore:
    def test_compute_score_basic(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        res = compute_health_score_api(listing_id)

        assert res.status_code == HTTP_200
        data = res.json()
        assert data["listing_id"] == listing_id
        assert data["overall_score"] is not None
        assert data["price_vs_market_score"] is not None
        assert data["lease_clarity_score"] is not None
        assert 0 <= data["overall_score"] <= 100

    def test_compute_score_with_reviews(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = make_verified_student(STUDENT_TWO)
        create_review_api(student_token, prop_id)

        res = compute_health_score_api(listing_id)

        assert res.status_code == HTTP_200
        data = res.json()
        assert data["landlord_reputation_score"] is not None
        assert data["maintenance_score"] is not None
        # with good reviews, reputation should be above neutral
        assert data["landlord_reputation_score"] > 0

    def test_compute_score_recompute_updates(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        # compute without reviews
        res1 = compute_health_score_api(listing_id)
        score1 = res1.json()["landlord_reputation_score"]

        # add a review
        student_token = make_verified_student(STUDENT_TWO)
        create_review_api(student_token, prop_id)

        # recompute
        res2 = compute_health_score_api(listing_id)
        score2 = res2.json()["landlord_reputation_score"]

        # scores should differ after adding review
        assert res2.status_code == HTTP_200
        assert score1 != score2

    def test_compute_nonexistent_listing(self):
        res = compute_health_score_api(NONEXISTENT_ID)
        assert res.status_code == HTTP_404

    def test_scores_are_within_range(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        student_token = make_verified_student(STUDENT_TWO)
        create_review_api(student_token, prop_id)

        res = compute_health_score_api(listing_id)
        data = res.json()

        for field in ["price_vs_market_score", "landlord_reputation_score", "maintenance_score", "lease_clarity_score", "overall_score"]:
            assert 0 <= data[field] <= 100, f"{field} out of range: {data[field]}"

# Get healthscore tests
class TestGetHealthScore:
    def test_get_computed_score(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        compute_health_score_api(listing_id)
        res = get_health_score_api(listing_id)

        assert res.status_code == HTTP_200
        assert res.json()["listing_id"] == listing_id

    def test_get_score_not_computed(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        res = get_health_score_api(listing_id)

        assert res.status_code == HTTP_404
        assert MSG_HEALTH_NOT_COMPUTED in res.json()["detail"]

    def test_get_score_nonexistent_listing(self):
        res = get_health_score_api(NONEXISTENT_ID)
        assert res.status_code == HTTP_404

    def test_get_score_is_public(self):
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        compute_health_score_api(listing_id)

        # no auth header
        res = client.get(HEALTH_SCORE_URL.format(listing_id=listing_id))
        assert res.status_code == HTTP_200

# Scoring logic tests
class TestScoringLogic:
    def test_lease_clarity_higher_with_more_info(self):
        """Property with full info should score higher than sparse one."""
        landlord_token = make_landlord()

        # full info property
        prop1_id = create_property_and_get_id(landlord_token, PROPERTY_ONE)
        listing1_id = create_listing_and_get_id(landlord_token, prop1_id)

        # sparse property
        sparse_prop = {
            "title": "Bare Bones",
            "address": "999 Unknown St",
            "property_type": "room",
            "total_rooms": 1,
            "bathrooms": 1,
            "walk_time_minutes": 0, 
            "bus_time_minutes": 0,
        }
        prop2_id = create_property_and_get_id(landlord_token, sparse_prop)
        listing2_id = create_listing_and_get_id(landlord_token, prop2_id)

        score1 = compute_health_score_api(listing1_id).json()["lease_clarity_score"]
        score2 = compute_health_score_api(listing2_id).json()["lease_clarity_score"]
        assert score1 > score2

    def test_reputation_reflects_reviews(self):
        """Good reviews should produce higher reputation than neutral."""
        landlord_token = make_landlord()
        prop_id = create_property_and_get_id(landlord_token)
        listing_id = create_listing_and_get_id(landlord_token, prop_id)

        # compute without reviews (neutral = 50)
        score_no_reviews = compute_health_score_api(listing_id).json()["landlord_reputation_score"]

        # add a good review
        student_token = make_verified_student(STUDENT_TWO)
        create_review_api(student_token, prop_id, {
            "responsiveness": 5,
            "maintenance_speed": 5,
            "respect_privacy": 5,
            "fairness_of_charges": 5,
            "would_rent_again": True,
            "comment": "Perfect landlord.",
        })

        score_with_reviews = compute_health_score_api(listing_id).json()["landlord_reputation_score"]
        assert score_with_reviews > score_no_reviews