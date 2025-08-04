-- REQUIRED DATABASE SETUP FOR VENDORS FUNCTIONALITY
-- Run this ENTIRE script in Supabase SQL Editor to fix vendor functionality

-- =============================================================================
-- STEP 1: Create vendor_categories table and populate with wedding categories
-- =============================================================================

-- Vendor categories table for organizing vendors
CREATE TABLE IF NOT EXISTS vendor_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(10) DEFAULT '🏢',
    color VARCHAR(7) DEFAULT '#3B82F6', -- hex color
    description TEXT,
    industry_typical BOOLEAN DEFAULT false, -- whether this is a typical wedding vendor category
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default wedding vendor categories
INSERT INTO vendor_categories (name, icon, color, description, industry_typical, display_order) VALUES
('Venue', '🏛️', '#8B5CF6', 'Reception halls, outdoor venues, churches, and ceremony locations', true, 1),
('Catering', '🍽️', '#EF4444', 'Food service, bartending, and beverage providers', true, 2),
('Photography', '📸', '#F59E0B', 'Wedding photographers and photo booth services', true, 3),
('Videography', '🎥', '#10B981', 'Wedding videographers and drone services', true, 4),
('Music & DJ', '🎵', '#3B82F6', 'DJs, live bands, and ceremony musicians', true, 5),
('Flowers', '💐', '#EC4899', 'Florists, bouquets, and ceremony decorations', true, 6),
('Transportation', '🚗', '#84CC16', 'Limos, shuttles, and getaway cars', true, 7),
('Beauty', '💄', '#C2410C', 'Hair stylists, makeup artists, and spa services', true, 8),
('Attire', '👗', '#6366F1', 'Wedding dresses, suits, and formal wear', true, 9),
('Cake & Desserts', '🎂', '#BE185D', 'Wedding cakes, dessert tables, and sweet treats', true, 10),
('Decorations', '🎊', '#F97316', 'Event decorators, lighting, and ambiance', true, 11),
('Stationery', '💌', '#06B6D4', 'Invitations, programs, and paper goods', true, 12),
('Jewelry', '💍', '#D97706', 'Wedding rings, jewelry, and accessories', true, 13),
('Officiant', '👨‍💼', '#6B7280', 'Wedding officiants, ministers, and celebrants', true, 14),
('Planning', '📋', '#0891B2', 'Wedding planners and coordinators', true, 15),
('Other', '🏢', '#6B7280', 'Miscellaneous wedding services', false, 99)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- STEP 2: Create vendors table (Master Vendor Directory)
-- =============================================================================

-- Create the vendors table with proper columns matching the application code
CREATE TABLE IF NOT EXISTS vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Business name
    contact_name TEXT, -- Contact person name
    phone TEXT, -- Contact phone
    email TEXT, -- Contact email
    website TEXT,
    address TEXT,
    category_id UUID REFERENCES vendor_categories(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'potential' 
        CHECK (status IN ('potential', 'contacted', 'quote_requested', 'in_discussion', 'booked', 'declined', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    notes TEXT,
    meeting_date DATE,
    contract_signed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 3: Set up Row Level Security (RLS) and policies
-- =============================================================================

-- Enable Row Level Security
ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_categories (public read)
CREATE POLICY "Anyone can view vendor categories" ON vendor_categories
    FOR SELECT USING (true);

-- RLS Policies for vendors table
CREATE POLICY "Users can view their couple's vendors" ON vendors
    FOR SELECT USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can insert vendors for their couple" ON vendors
    FOR INSERT WITH CHECK (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update their couple's vendors" ON vendors
    FOR UPDATE USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can delete their couple's vendors" ON vendors
    FOR DELETE USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- =============================================================================
-- STEP 4: Create necessary functions for vendor management
-- =============================================================================

-- Function to get vendor statistics by category for a couple
CREATE OR REPLACE FUNCTION get_vendor_stats_by_category(p_couple_id UUID)
RETURNS TABLE(
    category_name VARCHAR(100),
    category_icon VARCHAR(10),
    category_color VARCHAR(7),
    vendor_count BIGINT,
    booked_count BIGINT,
    total_estimated_cost DECIMAL,
    total_actual_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vc.name as category_name,
        vc.icon as category_icon,
        vc.color as category_color,
        COUNT(v.id) as vendor_count,
        COUNT(CASE WHEN v.status = 'booked' THEN 1 END) as booked_count,
        COALESCE(SUM(v.estimated_cost), 0) as total_estimated_cost,
        COALESCE(SUM(v.actual_cost), 0) as total_actual_cost
    FROM vendor_categories vc
    LEFT JOIN vendors v ON v.category_id = vc.id AND v.couple_id = p_couple_id
    WHERE vc.industry_typical = true
    GROUP BY vc.id, vc.name, vc.icon, vc.color, vc.display_order
    ORDER BY vc.display_order;
END;
$$ LANGUAGE plpgsql;

-- Function to get vendor summary for a couple
CREATE OR REPLACE FUNCTION get_vendor_summary(p_couple_id UUID)
RETURNS TABLE(
    total_vendors INTEGER,
    booked_vendors INTEGER,
    pending_vendors INTEGER,
    total_estimated_cost DECIMAL,
    total_actual_cost DECIMAL,
    contracts_signed INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_vendors,
        COUNT(CASE WHEN status = 'booked' THEN 1 END)::INTEGER as booked_vendors,
        COUNT(CASE WHEN status IN ('potential', 'contacted', 'quote_requested', 'in_discussion') THEN 1 END)::INTEGER as pending_vendors,
        COALESCE(SUM(estimated_cost), 0) as total_estimated_cost,
        COALESCE(SUM(actual_cost), 0) as total_actual_cost,
        COUNT(CASE WHEN contract_signed = true THEN 1 END)::INTEGER as contracts_signed
    FROM vendors
    WHERE couple_id = p_couple_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 5: Create indexes and triggers for performance
-- =============================================================================

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_couple_id ON vendors(couple_id);
CREATE INDEX IF NOT EXISTS idx_vendors_category_id ON vendors(category_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_priority ON vendors(priority);

-- Create update triggers (requires update_updated_at_column function to exist)
DO $$ 
BEGIN
    -- Only create trigger if the update function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Drop existing triggers if they exist
        DROP TRIGGER IF EXISTS update_vendor_categories_updated_at ON vendor_categories;
        DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
        
        -- Create new triggers
        CREATE TRIGGER update_vendor_categories_updated_at BEFORE UPDATE ON vendor_categories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================================================
-- STEP 6: Verification - Show what was created
-- =============================================================================

-- Verify tables were created successfully
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_name IN ('vendor_categories', 'vendors')
    AND t.table_schema = 'public'
ORDER BY t.table_name;

-- Show vendor categories that were inserted
SELECT name, icon, color, industry_typical, display_order FROM vendor_categories ORDER BY display_order;

-- Show vendor table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'vendors' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show success message
SELECT 'VENDOR SYSTEM SETUP COMPLETE! 🎉' as status,
       'The vendors page should now work properly.' as message;