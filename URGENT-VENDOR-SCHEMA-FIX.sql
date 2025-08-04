-- ===============================================================================
-- URGENT: VENDOR TABLE SCHEMA FIX
-- Run this ENTIRE script in Supabase SQL Editor to fix the vendor functionality
-- ===============================================================================

-- Check current vendors table structure first
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'vendors' AND table_schema = 'public'
ORDER BY ordinal_position;

-- If the vendors table doesn't have the right columns, recreate it
-- WARNING: This will delete existing vendor data!
DROP TABLE IF EXISTS vendors CASCADE;

-- Create vendors table with correct schema matching the application
CREATE TABLE vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
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

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their couple's vendors" ON vendors;
DROP POLICY IF EXISTS "Users can insert vendors for their couple" ON vendors;
DROP POLICY IF EXISTS "Users can update their couple's vendors" ON vendors;
DROP POLICY IF EXISTS "Users can delete their couple's vendors" ON vendors;

-- Create RLS policies for vendors table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_couple_id ON vendors(couple_id);
CREATE INDEX IF NOT EXISTS idx_vendors_category_id ON vendors(category_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_priority ON vendors(priority);

-- Create helper functions for vendor management
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

-- Create vendor summary function
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

-- Verify the table was created correctly
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'vendors' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show success message
SELECT 'VENDOR TABLE SCHEMA FIXED! 🎉' as status,
       'The vendors page should now work properly with full form functionality.' as message;