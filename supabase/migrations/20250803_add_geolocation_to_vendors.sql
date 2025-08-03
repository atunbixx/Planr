-- =============================================
-- ADD GEOLOCATION SUPPORT TO MARKETPLACE VENDORS
-- =============================================

-- Add latitude and longitude columns
ALTER TABLE marketplace_vendors
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create a geography point for spatial queries
ALTER TABLE marketplace_vendors
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Create function to update location from lat/lng
CREATE OR REPLACE FUNCTION update_vendor_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update location
CREATE TRIGGER update_vendor_location_trigger
BEFORE INSERT OR UPDATE ON marketplace_vendors
FOR EACH ROW
WHEN (NEW.latitude IS DISTINCT FROM OLD.latitude OR NEW.longitude IS DISTINCT FROM OLD.longitude)
EXECUTE FUNCTION update_vendor_location();

-- Create spatial index for fast geolocation queries
CREATE INDEX IF NOT EXISTS idx_marketplace_vendors_location
ON marketplace_vendors USING GIST (location);

-- Function to search vendors by distance
CREATE OR REPLACE FUNCTION search_vendors_by_distance(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_miles INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    business_name VARCHAR,
    category VARCHAR,
    distance_miles FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.business_name,
        v.category::VARCHAR,
        (ST_Distance(
            v.location,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)
        ) / 1609.34)::FLOAT as distance_miles
    FROM marketplace_vendors v
    WHERE 
        v.verified = true
        AND v.location IS NOT NULL
        AND ST_DWithin(
            v.location,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326),
            radius_miles * 1609.34 -- Convert miles to meters
        )
    ORDER BY distance_miles;
END;
$$ LANGUAGE plpgsql;

-- Update existing vendors with sample coordinates (for testing)
-- In production, these would be real geocoded addresses
UPDATE marketplace_vendors SET
    latitude = CASE 
        WHEN city = 'San Francisco' AND state = 'CA' THEN 37.7749 + (RANDOM() * 0.1 - 0.05)
        WHEN city = 'Los Angeles' AND state = 'CA' THEN 34.0522 + (RANDOM() * 0.1 - 0.05)
        WHEN city = 'New York' AND state = 'NY' THEN 40.7128 + (RANDOM() * 0.1 - 0.05)
        ELSE NULL
    END,
    longitude = CASE 
        WHEN city = 'San Francisco' AND state = 'CA' THEN -122.4194 + (RANDOM() * 0.1 - 0.05)
        WHEN city = 'Los Angeles' AND state = 'CA' THEN -118.2437 + (RANDOM() * 0.1 - 0.05)
        WHEN city = 'New York' AND state = 'NY' THEN -74.0060 + (RANDOM() * 0.1 - 0.05)
        ELSE NULL
    END
WHERE latitude IS NULL;