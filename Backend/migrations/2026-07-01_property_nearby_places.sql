-- Cache nearest real POIs (grocery, gym, ...) per property, populated from
-- Google Places Nearby Search when the address/coords are set or changed.
-- Shape: {"grocery": {"name","lat","lng","distance_km"}, "gym": {...}}
ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS nearby_places JSONB;
