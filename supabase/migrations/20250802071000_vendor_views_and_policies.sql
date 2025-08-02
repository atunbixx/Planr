-- =============================================
-- VENDOR VIEWS AND IMPROVED POLICIES
-- =============================================
-- Create views to simplify vendor access

-- Create a vendors view that maps to couple_vendors for backward compatibility
CREATE OR REPLACE VIEW vendors AS
SELECT * FROM couple_vendors;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON vendors TO authenticated;

-- Create a detailed vendor view with calculated fields
CREATE OR REPLACE VIEW vendor_details AS
SELECT 
    cv.*,
    c.partner1_name,
    c.partner2_name,
    c.wedding_date,
    CASE 
        WHEN cv.status IN ('booked', 'confirmed') THEN true
        ELSE false
    END as is_booked,
    CASE 
        WHEN cv.deposit_paid = true THEN 'paid'
        WHEN cv.deposit_amount IS NOT NULL THEN 'pending'
        ELSE 'not_required'
    END as deposit_status,
    COALESCE(cv.actual_cost, cv.estimated_cost) as current_cost,
    CASE 
        WHEN cv.actual_cost IS NOT NULL THEN cv.actual_cost - COALESCE(cv.deposit_amount, 0)
        WHEN cv.estimated_cost IS NOT NULL THEN cv.estimated_cost - COALESCE(cv.deposit_amount, 0)
        ELSE NULL
    END as balance_due
FROM couple_vendors cv
JOIN couples c ON cv.couple_id = c.id;

-- Grant permissions on the detailed view
GRANT SELECT ON vendor_details TO authenticated;

-- Create a vendor statistics view
CREATE OR REPLACE VIEW vendor_statistics AS
SELECT 
    couple_id,
    COUNT(*) as total_vendors,
    COUNT(CASE WHEN status IN ('booked', 'confirmed') THEN 1 END) as booked_vendors,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_vendors,
    SUM(COALESCE(estimated_cost, 0)) as total_estimated_cost,
    SUM(COALESCE(actual_cost, 0)) as total_actual_cost,
    SUM(CASE WHEN deposit_paid = true THEN COALESCE(deposit_amount, 0) ELSE 0 END) as total_deposits_paid,
    AVG(CASE WHEN rating IS NOT NULL THEN rating ELSE NULL END) as average_rating,
    COUNT(DISTINCT category) as unique_categories
FROM couple_vendors
GROUP BY couple_id;

-- Grant permissions on statistics view
GRANT SELECT ON vendor_statistics TO authenticated;

-- Create a vendor by category view
CREATE OR REPLACE VIEW vendors_by_category AS
SELECT 
    couple_id,
    category,
    COUNT(*) as vendor_count,
    SUM(COALESCE(estimated_cost, 0)) as category_estimated_cost,
    SUM(COALESCE(actual_cost, 0)) as category_actual_cost,
    AVG(CASE WHEN rating IS NOT NULL THEN rating ELSE NULL END) as category_avg_rating,
    ARRAY_AGG(
        json_build_object(
            'id', id,
            'name', name,
            'status', status,
            'cost', COALESCE(actual_cost, estimated_cost)
        ) ORDER BY name
    ) as vendors
FROM couple_vendors
GROUP BY couple_id, category;

-- Grant permissions
GRANT SELECT ON vendors_by_category TO authenticated;

-- Create function to get vendor recommendations
CREATE OR REPLACE FUNCTION get_vendor_recommendations(p_couple_id UUID, p_category vendor_category DEFAULT NULL)
RETURNS TABLE (
    category vendor_category,
    recommendation_reason TEXT,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH existing_vendors AS (
        SELECT category, COUNT(*) as count
        FROM couple_vendors
        WHERE couple_id = p_couple_id
        GROUP BY category
    ),
    essential_categories AS (
        SELECT * FROM (VALUES
            ('venue'::vendor_category, 'Essential - Wedding location', 1),
            ('catering'::vendor_category, 'Essential - Food and beverages', 2),
            ('photography'::vendor_category, 'Essential - Capture memories', 3),
            ('music_dj'::vendor_category, 'Essential - Entertainment', 4),
            ('florist'::vendor_category, 'Important - Decorations', 5),
            ('officiant'::vendor_category, 'Required - Ceremony leader', 6)
        ) AS t(cat, reason, pri)
    )
    SELECT 
        ec.cat as category,
        ec.reason as recommendation_reason,
        ec.pri as priority
    FROM essential_categories ec
    LEFT JOIN existing_vendors ev ON ec.cat = ev.category
    WHERE ev.count IS NULL OR ev.count = 0
    AND (p_category IS NULL OR ec.cat = p_category)
    ORDER BY ec.pri;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_vendor_recommendations TO authenticated;

-- Create function to calculate vendor budget summary
CREATE OR REPLACE FUNCTION get_vendor_budget_summary(p_couple_id UUID)
RETURNS TABLE (
    total_budget DECIMAL(10,2),
    allocated_budget DECIMAL(10,2),
    spent_budget DECIMAL(10,2),
    remaining_budget DECIMAL(10,2),
    deposit_total DECIMAL(10,2),
    deposits_paid DECIMAL(10,2),
    deposits_pending DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(COALESCE(estimated_cost, 0))::DECIMAL(10,2) as total_budget,
        SUM(CASE WHEN status IN ('booked', 'confirmed') THEN COALESCE(estimated_cost, 0) ELSE 0 END)::DECIMAL(10,2) as allocated_budget,
        SUM(COALESCE(actual_cost, 0))::DECIMAL(10,2) as spent_budget,
        (SUM(COALESCE(estimated_cost, 0)) - SUM(COALESCE(actual_cost, 0)))::DECIMAL(10,2) as remaining_budget,
        SUM(COALESCE(deposit_amount, 0))::DECIMAL(10,2) as deposit_total,
        SUM(CASE WHEN deposit_paid = true THEN COALESCE(deposit_amount, 0) ELSE 0 END)::DECIMAL(10,2) as deposits_paid,
        SUM(CASE WHEN deposit_paid = false THEN COALESCE(deposit_amount, 0) ELSE 0 END)::DECIMAL(10,2) as deposits_pending
    FROM couple_vendors
    WHERE couple_id = p_couple_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_vendor_budget_summary TO authenticated;

-- Create function to search vendors
CREATE OR REPLACE FUNCTION search_vendors(
    p_couple_id UUID,
    p_search_term TEXT DEFAULT NULL,
    p_category vendor_category DEFAULT NULL,
    p_status vendor_status DEFAULT NULL,
    p_min_cost DECIMAL DEFAULT NULL,
    p_max_cost DECIMAL DEFAULT NULL
)
RETURNS SETOF couple_vendors AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM couple_vendors
    WHERE couple_id = p_couple_id
    AND (p_search_term IS NULL OR (
        name ILIKE '%' || p_search_term || '%' OR
        business_name ILIKE '%' || p_search_term || '%' OR
        contact_person ILIKE '%' || p_search_term || '%' OR
        notes ILIKE '%' || p_search_term || '%'
    ))
    AND (p_category IS NULL OR category = p_category)
    AND (p_status IS NULL OR status = p_status)
    AND (p_min_cost IS NULL OR COALESCE(actual_cost, estimated_cost) >= p_min_cost)
    AND (p_max_cost IS NULL OR COALESCE(actual_cost, estimated_cost) <= p_max_cost)
    ORDER BY 
        CASE WHEN status IN ('booked', 'confirmed') THEN 0 ELSE 1 END,
        category,
        name;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_vendors TO authenticated;

-- Add helpful comments
COMMENT ON VIEW vendors IS 'Backward compatibility view mapping to couple_vendors table';
COMMENT ON VIEW vendor_details IS 'Detailed vendor information with calculated fields and couple data';
COMMENT ON VIEW vendor_statistics IS 'Aggregated statistics for vendors by couple';
COMMENT ON VIEW vendors_by_category IS 'Vendors grouped by category with aggregated data';
COMMENT ON FUNCTION get_vendor_recommendations IS 'Suggests missing essential vendor categories for a couple';
COMMENT ON FUNCTION get_vendor_budget_summary IS 'Calculates budget totals and remaining amounts for vendors';
COMMENT ON FUNCTION search_vendors IS 'Advanced vendor search with multiple filter options';