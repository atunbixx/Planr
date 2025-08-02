-- =============================================
-- SIMPLIFY VENDOR SCHEMA
-- =============================================
-- Remove unused fields and keep only what's on the form

-- Drop the existing vendor table
DROP TABLE IF EXISTS couple_vendors CASCADE;

-- Recreate with only form fields
CREATE TABLE couple_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    
    -- Core Information (from form)
    name VARCHAR(200) NOT NULL,
    business_name VARCHAR(200),
    category vendor_category NOT NULL,
    status vendor_status DEFAULT 'researching',
    
    -- Contact Information (from form)
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    contact_person VARCHAR(100),
    
    -- Location (from form)
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    
    -- Financial (from form)
    estimated_cost DECIMAL(10,2),
    
    -- Notes (from form)
    notes TEXT,
    referral_source VARCHAR(200),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_couple_vendors_couple_id ON couple_vendors(couple_id);
CREATE INDEX idx_couple_vendors_category ON couple_vendors(category);
CREATE INDEX idx_couple_vendors_status ON couple_vendors(status);

-- Row Level Security
ALTER TABLE couple_vendors ENABLE ROW LEVEL SECURITY;

-- Policies for couple_vendors
CREATE POLICY "Users can view their couple's vendors" ON couple_vendors
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM couples WHERE 
            partner1_user_id = auth.uid() OR 
            partner2_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert vendors for their couple" ON couple_vendors
    FOR INSERT WITH CHECK (
        couple_id IN (
            SELECT id FROM couples WHERE 
            partner1_user_id = auth.uid() OR 
            partner2_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their couple's vendors" ON couple_vendors
    FOR UPDATE USING (
        couple_id IN (
            SELECT id FROM couples WHERE 
            partner1_user_id = auth.uid() OR 
            partner2_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their couple's vendors" ON couple_vendors
    FOR DELETE USING (
        couple_id IN (
            SELECT id FROM couples WHERE 
            partner1_user_id = auth.uid() OR 
            partner2_user_id = auth.uid()
        )
    );

-- Update trigger for updated_at
CREATE TRIGGER update_couple_vendors_updated_at
    BEFORE UPDATE ON couple_vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();