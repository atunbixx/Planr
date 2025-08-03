-- =============================================
-- ADD INDEXES FOR MARKETPLACE PERFORMANCE
-- =============================================

-- Vendor search performance indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_vendors_category 
ON marketplace_vendors(category) 
WHERE verified = true;

CREATE INDEX IF NOT EXISTS idx_marketplace_vendors_city_state 
ON marketplace_vendors(city, state) 
WHERE verified = true;

CREATE INDEX IF NOT EXISTS idx_marketplace_vendors_rating 
ON marketplace_vendors(average_rating DESC NULLS LAST) 
WHERE verified = true;

CREATE INDEX IF NOT EXISTS idx_marketplace_vendors_featured 
ON marketplace_vendors(featured, average_rating DESC) 
WHERE verified = true;

-- Full text search index for vendor search
CREATE INDEX IF NOT EXISTS idx_marketplace_vendors_search 
ON marketplace_vendors USING gin(
  to_tsvector('english', 
    COALESCE(business_name, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(city, '') || ' ' || 
    COALESCE(search_keywords, '')
  )
) WHERE verified = true;

-- Vendor reviews indexes
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor_rating 
ON vendor_reviews(vendor_id, rating DESC) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_vendor_reviews_created 
ON vendor_reviews(created_at DESC) 
WHERE is_published = true;

-- Vendor packages indexes
CREATE INDEX IF NOT EXISTS idx_vendor_packages_vendor 
ON vendor_packages(vendor_id, display_order, is_popular DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_packages_price 
ON vendor_packages(price) 
WHERE price IS NOT NULL;

-- Vendor availability indexes
CREATE INDEX IF NOT EXISTS idx_vendor_availability_date 
ON vendor_availability(vendor_id, date) 
WHERE is_available = true AND is_booked = false;

CREATE INDEX IF NOT EXISTS idx_vendor_availability_future 
ON vendor_availability(date, vendor_id) 
WHERE date >= CURRENT_DATE AND is_available = true;

-- Vendor inquiries indexes
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_vendor 
ON vendor_inquiries(vendor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_couple 
ON vendor_inquiries(couple_id, created_at DESC) 
WHERE couple_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_unresponded 
ON vendor_inquiries(vendor_id, created_at) 
WHERE responded = false;

-- Vendor users index
CREATE INDEX IF NOT EXISTS idx_vendor_users_user 
ON vendor_users(user_id, vendor_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_marketplace_vendors_search_composite 
ON marketplace_vendors(verified, category, city, state, average_rating DESC) 
WHERE verified = true;

-- Performance monitoring view
CREATE OR REPLACE VIEW vendor_search_stats AS
SELECT 
    category,
    COUNT(*) as total_vendors,
    COUNT(*) FILTER (WHERE featured = true) as featured_count,
    AVG(average_rating) as avg_rating,
    COUNT(*) FILTER (WHERE latitude IS NOT NULL) as geocoded_count,
    COUNT(DISTINCT city || ',' || state) as unique_locations
FROM marketplace_vendors
WHERE verified = true
GROUP BY category;

-- Function to analyze vendor table sizes
CREATE OR REPLACE FUNCTION get_vendor_table_stats()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    total_size TEXT,
    index_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename AS table_name,
        n_live_tup AS row_count,
        pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
        pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename)) AS index_size
    FROM pg_stat_user_tables
    WHERE schemaname = 'public' 
    AND tablename LIKE '%vendor%'
    ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comment on indexes
COMMENT ON INDEX idx_marketplace_vendors_category IS 'Speeds up category-based vendor searches';
COMMENT ON INDEX idx_marketplace_vendors_city_state IS 'Speeds up location-based vendor searches';
COMMENT ON INDEX idx_marketplace_vendors_rating IS 'Speeds up sorting by rating';
COMMENT ON INDEX idx_marketplace_vendors_location IS 'Speeds up geolocation-based searches';
COMMENT ON INDEX idx_marketplace_vendors_search IS 'Enables fast full-text search';

-- Analyze tables to update statistics
ANALYZE marketplace_vendors;
ANALYZE vendor_reviews;
ANALYZE vendor_packages;
ANALYZE vendor_availability;
ANALYZE vendor_inquiries;