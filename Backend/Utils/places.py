"""Google Places Nearby Search (New) — fetch the nearest real POIs for a
property and cache them on the property row.

Cost note: Nearby Search is a Pro-tier SKU (5,000 free calls/month). We call it
at most a few times per property (once per address change), so real-world usage
stays well inside the free tier. If GOOGLE_MAPS_API_KEY is unset, this module is
a no-op and callers fall back to the curated Guelph landmark list.
"""
import math
import logging

import httpx

from config import settings

logger = logging.getLogger(__name__)

_ENDPOINT = "https://places.googleapis.com/v1/places:searchNearby"
_SEARCH_RADIUS_M = 8000.0  # covers the whole Guelph student-housing footprint

# Category -> Google Places (New) place types. Keep in sync with the frontend's
# NearbyLandmarksList / GUELPH_LANDMARKS categories.
_CATEGORIES: dict[str, list[str]] = {
    "grocery": ["supermarket", "grocery_store"],
    "gym": ["gym"],
}


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    )
    return 2 * r * math.asin(math.sqrt(a))


def _nearest_of(client: httpx.Client, lat: float, lng: float, types: list[str]) -> dict | None:
    """Return the single nearest place of the given types, or None."""
    body = {
        "includedTypes": types,
        "maxResultCount": 1,
        "rankPreference": "DISTANCE",
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": _SEARCH_RADIUS_M,
            }
        },
    }
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_MAPS_API_KEY,
        # FieldMask keeps the response (and billing SKU) minimal.
        "X-Goog-FieldMask": "places.displayName,places.location",
    }
    resp = client.post(_ENDPOINT, json=body, headers=headers)
    resp.raise_for_status()
    places = resp.json().get("places") or []
    if not places:
        return None

    top = places[0]
    loc = top.get("location") or {}
    plat, plng = loc.get("latitude"), loc.get("longitude")
    if plat is None or plng is None:
        return None

    return {
        "name": (top.get("displayName") or {}).get("text") or "Nearby",
        "lat": plat,
        "lng": plng,
        "distance_km": round(_haversine_km(lat, lng, plat, plng), 2),
    }


def fetch_nearby_places(lat: float | None, lng: float | None) -> dict | None:
    """Fetch the nearest grocery/gym for a coordinate.

    Returns a dict keyed by category, or None if disabled/unavailable. Never
    raises — callers treat a None/partial result as "fall back to curated list".
    """
    if not settings.GOOGLE_MAPS_API_KEY or lat is None or lng is None:
        return None

    lat_f, lng_f = float(lat), float(lng)
    results: dict[str, dict] = {}
    try:
        with httpx.Client(timeout=6.0) as client:
            for category, types in _CATEGORIES.items():
                try:
                    place = _nearest_of(client, lat_f, lng_f, types)
                    if place:
                        results[category] = place
                except Exception as exc:  # one bad category shouldn't sink the rest
                    logger.warning("Places lookup failed for %s: %s", category, exc)
    except Exception as exc:
        logger.warning("Places Nearby Search unavailable: %s", exc)
        return None

    return results or None
