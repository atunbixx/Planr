-- Vendor Management Enhancement Schema
-- Run this in Supabase SQL Editor to enhance vendor management

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

-- Add category_id to vendors table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendors' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE vendors ADD COLUMN category_id UUID REFERENCES vendor_categories(id);
        
        -- Set default category for existing vendors
        UPDATE vendors SET category_id = (
            SELECT id FROM vendor_categories WHERE name = 'Other' LIMIT 1
        ) WHERE category_id IS NULL;
        
        COMMENT ON COLUMN vendors.category_id IS 'Reference to vendor category';
    END IF;
END $$;

-- Add additional useful columns to vendors table if they don't exist
DO $$ 
BEGIN
    -- Add status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendors' AND column_name = 'status'
    ) THEN
        ALTER TABLE vendors ADD COLUMN status VARCHAR(20) DEFAULT 'potential' 
        CHECK (status IN ('potential', 'contacted', 'quote_requested', 'in_discussion', 'booked', 'declined', 'cancelled'));
    END IF;
    
    -- Add priority column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendors' AND column_name = 'priority'
    ) THEN
        ALTER TABLE vendors ADD COLUMN priority VARCHAR(10) DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high'));
    END IF;
    
    -- Add rating column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendors' AND column_name = 'rating'
    ) THEN
        ALTER TABLE vendors ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
    END IF;
    
    -- Add estimated_cost column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendors' AND column_name = 'estimated_cost'
    ) THEN
        ALTER TABLE vendors ADD COLUMN estimated_cost DECIMAL(10,2);
    END IF;
    
    -- Add actual_cost column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendors' AND column_name = 'actual_cost'
    ) THEN
        ALTER TABLE vendors ADD COLUMN actual_cost DECIMAL(10,2);
    END IF;
    
    -- Add notes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendors' AND column_name = 'notes'
    ) THEN
        ALTER TABLE vendors ADD COLUMN notes TEXT;
    END IF;
    
    -- Add website column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendors' AND column_name = 'website'
    ) THEN
        ALTER TABLE vendors ADD COLUMN website VARCHAR(255);
    END IF;
    
    -- Add social_media column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendors' AND column_name = 'social_media'
    ) THEN
        ALTER TABLE vendors ADD COLUMN social_media JSONB; -- Store Instagram, Facebook, etc.
    END IF;
    
    -- Add meeting_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendors' AND column_name = 'meeting_date'
    ) THEN
        ALTER TABLE vendors ADD COLUMN meeting_date DATE;
    END IF;
    
    -- Add contract_signed column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendors' AND column_name = 'contract_signed'
    ) THEN
        ALTER TABLE vendors ADD COLUMN contract_signed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Vendor documents table for storing contracts, quotes, etc.
CREATE TABLE IF NOT EXISTS vendor_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- contract, quote, invoice, image, etc.
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER, -- in bytes
    uploaded_by VARCHAR(100), -- user who uploaded
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_categories (public read, admin write)
CREATE POLICY "Anyone can view vendor categories" ON vendor_categories
    FOR SELECT USING (true);

-- RLS Policies for vendor_documents
CREATE POLICY "Users can view their couple's vendor documents" ON vendor_documents
    FOR SELECT USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can insert vendor documents for their couple" ON vendor_documents
    FOR INSERT WITH CHECK (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update their couple's vendor documents" ON vendor_documents
    FOR UPDATE USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can delete their couple's vendor documents" ON vendor_documents
    FOR DELETE USING (
        couple_id IN (
            SELECT couples.id FROM couples
            JOIN users ON users.id = couples.user_id
            WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Update triggers
CREATE TRIGGER update_vendor_categories_updated_at BEFORE UPDATE ON vendor_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_documents_updated_at BEFORE UPDATE ON vendor_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Verify tables and columns were created successfully
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_name IN ('vendor_categories', 'vendor_documents', 'vendors')
    AND t.table_schema = 'public'
ORDER BY t.table_name;

-- Show vendor categories that were inserted
SELECT name, icon, color, industry_typical, display_order FROM vendor_categories ORDER BY display_order;