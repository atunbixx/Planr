-- =============================================
-- DETAILED BUDGET ITEMS TRACKING
-- Adds granular budget item tracking capabilities
-- =============================================

-- Create subcategory types
CREATE TABLE IF NOT EXISTS budget_subcategory_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_type_id UUID NOT NULL REFERENCES budget_category_types(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_type_id, name)
);

-- Insert default subcategories
INSERT INTO budget_subcategory_types (category_type_id, name, display_order) 
SELECT 
    bct.id,
    sub.name,
    sub.display_order
FROM budget_category_types bct
CROSS JOIN LATERAL (
    VALUES 
    -- Venue & Reception subcategories
    ('Venue & Reception', 'Ceremony Venue', 1),
    ('Venue & Reception', 'Reception Venue', 2),
    ('Venue & Reception', 'Tent/Structure Rental', 3),
    ('Venue & Reception', 'Tables & Chairs', 4),
    ('Venue & Reception', 'Linens & Tableware', 5),
    ('Venue & Reception', 'Lighting', 6),
    ('Venue & Reception', 'Sound System', 7),
    ('Venue & Reception', 'Dance Floor', 8),
    ('Venue & Reception', 'Venue Coordination', 9),
    
    -- Catering & Bar subcategories
    ('Catering & Bar', 'Food Service', 1),
    ('Catering & Bar', 'Bar Service', 2),
    ('Catering & Bar', 'Cocktail Hour', 3),
    ('Catering & Bar', 'Wedding Cake', 4),
    ('Catering & Bar', 'Service Staff', 5),
    ('Catering & Bar', 'Rentals (China, Glassware)', 6),
    ('Catering & Bar', 'Gratuity', 7),
    
    -- Photography & Videography subcategories
    ('Photography & Videography', 'Wedding Photographer', 1),
    ('Photography & Videography', 'Second Shooter', 2),
    ('Photography & Videography', 'Videographer', 3),
    ('Photography & Videography', 'Photo Albums', 4),
    ('Photography & Videography', 'Prints & Enlargements', 5),
    ('Photography & Videography', 'Digital Files', 6),
    ('Photography & Videography', 'Drone Coverage', 7),
    
    -- Music & Entertainment subcategories
    ('Music & Entertainment', 'Ceremony Music', 1),
    ('Music & Entertainment', 'Cocktail Hour Music', 2),
    ('Music & Entertainment', 'Reception DJ', 3),
    ('Music & Entertainment', 'Live Band', 4),
    ('Music & Entertainment', 'Dance Performances', 5),
    ('Music & Entertainment', 'Photo Booth', 6),
    ('Music & Entertainment', 'Special Entertainment', 7),
    
    -- Flowers & Decorations subcategories
    ('Flowers & Decorations', 'Bridal Bouquet', 1),
    ('Flowers & Decorations', 'Bridesmaids Bouquets', 2),
    ('Flowers & Decorations', 'Boutonnieres', 3),
    ('Flowers & Decorations', 'Corsages', 4),
    ('Flowers & Decorations', 'Ceremony Arrangements', 5),
    ('Flowers & Decorations', 'Reception Centerpieces', 6),
    ('Flowers & Decorations', 'Decorative Lighting', 7),
    ('Flowers & Decorations', 'Signage & Props', 8),
    
    -- Wedding Attire subcategories
    ('Wedding Attire', 'Wedding Dress', 1),
    ('Wedding Attire', 'Alterations', 2),
    ('Wedding Attire', 'Veil & Headpiece', 3),
    ('Wedding Attire', 'Wedding Shoes', 4),
    ('Wedding Attire', 'Groom Attire', 5),
    ('Wedding Attire', 'Groomsmen Attire', 6),
    ('Wedding Attire', 'Bridesmaids Dresses', 7),
    ('Wedding Attire', 'Accessories', 8),
    
    -- Beauty & Wellness subcategories
    ('Beauty & Wellness', 'Hair Styling', 1),
    ('Beauty & Wellness', 'Makeup', 2),
    ('Beauty & Wellness', 'Trial Sessions', 3),
    ('Beauty & Wellness', 'Spa Services', 4),
    ('Beauty & Wellness', 'Nails', 5),
    ('Beauty & Wellness', 'Tanning/Skin Prep', 6)
) AS sub(category_name, name, display_order)
WHERE bct.name = sub.category_name
ON CONFLICT (category_type_id, name) DO NOTHING;

-- Add fields to budget_items if they don't exist
DO $$ 
BEGIN
    -- Add subcategory_type_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'budget_items' 
                   AND column_name = 'subcategory_type_id') THEN
        ALTER TABLE budget_items ADD COLUMN subcategory_type_id UUID REFERENCES budget_subcategory_types(id);
    END IF;
    
    -- Add quantity if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'budget_items' 
                   AND column_name = 'quantity') THEN
        ALTER TABLE budget_items ADD COLUMN quantity INTEGER DEFAULT 1;
    END IF;
    
    -- Add unit_price if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'budget_items' 
                   AND column_name = 'unit_price') THEN
        ALTER TABLE budget_items ADD COLUMN unit_price DECIMAL(12,2);
    END IF;
    
    -- Add payment_schedule_details if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'budget_items' 
                   AND column_name = 'payment_schedule_details') THEN
        ALTER TABLE budget_items ADD COLUMN payment_schedule_details JSONB DEFAULT '[]';
    END IF;
    
    -- Add priority_level if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'budget_items' 
                   AND column_name = 'priority_level') THEN
        ALTER TABLE budget_items ADD COLUMN priority_level INTEGER DEFAULT 3 CHECK (priority_level >= 1 AND priority_level <= 5);
    END IF;
END $$;

-- Create budget analytics views
CREATE OR REPLACE VIEW budget_analytics_summary AS
SELECT 
    c.id as couple_id,
    c.names as couple_names,
    bp.id as period_id,
    bp.name as period_name,
    bp.total_budget,
    COUNT(DISTINCT bi.id) as total_items,
    COUNT(DISTINCT bi.vendor_id) as total_vendors,
    COUNT(DISTINCT bi.category_type_id) as categories_used,
    SUM(bi.estimated_amount) as total_estimated,
    SUM(COALESCE(bi.contracted_amount, bi.estimated_amount)) as total_contracted,
    SUM(COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount)) as total_final,
    SUM(CASE WHEN bi.status = 'paid' THEN COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount) ELSE 0 END) as total_paid,
    SUM(CASE WHEN bi.status IN ('planned', 'committed') THEN COALESCE(bi.contracted_amount, bi.estimated_amount) ELSE 0 END) as total_pending,
    COUNT(CASE WHEN bi.status = 'paid' END) as items_paid,
    COUNT(CASE WHEN bi.status = 'committed' END) as items_committed,
    COUNT(CASE WHEN bi.status = 'planned' END) as items_planned,
    COUNT(CASE WHEN bi.due_date < CURRENT_DATE AND bi.status NOT IN ('paid', 'cancelled') END) as overdue_items
FROM couples c
JOIN budget_periods bp ON bp.couple_id = c.id AND bp.is_active = TRUE
LEFT JOIN budget_items bi ON bi.couple_id = c.id AND bi.period_id = bp.id
GROUP BY c.id, c.names, bp.id, bp.name, bp.total_budget;

-- Create category breakdown view
CREATE OR REPLACE VIEW budget_category_breakdown AS
SELECT 
    bi.couple_id,
    bi.period_id,
    bct.id as category_id,
    bct.name as category_name,
    bct.icon,
    bct.color,
    COUNT(bi.id) as item_count,
    SUM(bi.estimated_amount) as estimated_total,
    SUM(COALESCE(bi.contracted_amount, bi.estimated_amount)) as contracted_total,
    SUM(COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount)) as final_total,
    SUM(CASE WHEN bi.status = 'paid' THEN COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount) ELSE 0 END) as paid_total,
    ba.allocated_amount,
    ba.allocated_percentage,
    CASE 
        WHEN ba.allocated_amount > 0 THEN 
            (SUM(COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount)) / ba.allocated_amount * 100)::DECIMAL(5,2)
        ELSE 0 
    END as percentage_used
FROM budget_items bi
JOIN budget_category_types bct ON bi.category_type_id = bct.id
LEFT JOIN budget_allocations ba ON ba.period_id = bi.period_id AND ba.category_type_id = bct.id
GROUP BY bi.couple_id, bi.period_id, bct.id, bct.name, bct.icon, bct.color, ba.allocated_amount, ba.allocated_percentage
ORDER BY bct.display_order;

-- Create payment timeline view
CREATE OR REPLACE VIEW budget_payment_timeline AS
SELECT 
    bi.couple_id,
    bi.period_id,
    DATE_TRUNC('month', COALESCE(bi.due_date, bi.service_date)) as payment_month,
    COUNT(bi.id) as items_due,
    SUM(CASE WHEN bi.status NOT IN ('paid', 'cancelled') THEN COALESCE(bi.contracted_amount, bi.estimated_amount) ELSE 0 END) as amount_due,
    SUM(CASE WHEN bi.status = 'paid' THEN COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount) ELSE 0 END) as amount_paid,
    COUNT(CASE WHEN bi.status = 'paid' END) as items_paid,
    COUNT(CASE WHEN bi.status NOT IN ('paid', 'cancelled') AND bi.due_date < CURRENT_DATE END) as overdue_items
FROM budget_items bi
WHERE bi.due_date IS NOT NULL OR bi.service_date IS NOT NULL
GROUP BY bi.couple_id, bi.period_id, payment_month
ORDER BY payment_month;

-- Create vendor spending view
CREATE OR REPLACE VIEW budget_vendor_spending AS
SELECT 
    bi.couple_id,
    bi.period_id,
    bi.vendor_id,
    cv.business_name as vendor_name,
    cv.vendor_type,
    COUNT(bi.id) as item_count,
    SUM(bi.estimated_amount) as estimated_total,
    SUM(COALESCE(bi.contracted_amount, bi.estimated_amount)) as contracted_total,
    SUM(COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount)) as final_total,
    SUM(CASE WHEN bi.status = 'paid' THEN COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount) ELSE 0 END) as paid_total,
    MIN(bi.due_date) as next_payment_due,
    COUNT(CASE WHEN bi.status NOT IN ('paid', 'cancelled') AND bi.due_date < CURRENT_DATE END) as overdue_items
FROM budget_items bi
JOIN couple_vendors cv ON bi.vendor_id = cv.id
GROUP BY bi.couple_id, bi.period_id, bi.vendor_id, cv.business_name, cv.vendor_type
ORDER BY final_total DESC;

-- Create spending trends function
CREATE OR REPLACE FUNCTION get_budget_spending_trends(
    p_couple_id UUID,
    p_period_id UUID,
    p_months_back INTEGER DEFAULT 6
)
RETURNS TABLE (
    month DATE,
    items_added INTEGER,
    amount_committed DECIMAL(12,2),
    amount_paid DECIMAL(12,2),
    cumulative_committed DECIMAL(12,2),
    cumulative_paid DECIMAL(12,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT 
            DATE_TRUNC('month', bi.created_at) as month,
            COUNT(bi.id) as items_added,
            SUM(COALESCE(bi.contracted_amount, bi.estimated_amount)) as amount_committed,
            SUM(CASE WHEN bi.status = 'paid' THEN COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount) ELSE 0 END) as amount_paid
        FROM budget_items bi
        WHERE bi.couple_id = p_couple_id 
        AND bi.period_id = p_period_id
        AND bi.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * p_months_back)
        GROUP BY DATE_TRUNC('month', bi.created_at)
    )
    SELECT 
        md.month,
        md.items_added,
        md.amount_committed,
        md.amount_paid,
        SUM(md.amount_committed) OVER (ORDER BY md.month) as cumulative_committed,
        SUM(md.amount_paid) OVER (ORDER BY md.month) as cumulative_paid
    FROM monthly_data md
    ORDER BY md.month;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE budget_subcategory_types ENABLE ROW LEVEL SECURITY;

-- RLS policies for subcategory types
CREATE POLICY "Everyone can view budget subcategory types"
    ON budget_subcategory_types FOR SELECT
    USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_items_subcategory ON budget_items(subcategory_type_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_due_date ON budget_items(due_date);
CREATE INDEX IF NOT EXISTS idx_budget_items_service_date ON budget_items(service_date);
CREATE INDEX IF NOT EXISTS idx_budget_subcategory_types_category ON budget_subcategory_types(category_type_id);

-- Grant permissions
GRANT SELECT ON budget_subcategory_types TO authenticated;
GRANT SELECT ON budget_analytics_summary TO authenticated;
GRANT SELECT ON budget_category_breakdown TO authenticated;
GRANT SELECT ON budget_payment_timeline TO authenticated;
GRANT SELECT ON budget_vendor_spending TO authenticated;
GRANT EXECUTE ON FUNCTION get_budget_spending_trends TO authenticated;