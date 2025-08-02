-- Vendor contract management and document storage
-- Enables couples to manage vendor contracts, track important dates, and store documents

-- Add contract fields to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS contract_status VARCHAR(50) DEFAULT 'draft' 
    CHECK (contract_status IN ('draft', 'sent', 'negotiating', 'signed', 'cancelled')),
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS contract_end_date DATE,
ADD COLUMN IF NOT EXISTS contract_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_paid_date DATE,
ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
ADD COLUMN IF NOT EXISTS contract_notes TEXT,
ADD COLUMN IF NOT EXISTS payment_schedule JSONB;

-- Create vendor documents table
CREATE TABLE IF NOT EXISTS vendor_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'contract', 'invoice', 'receipt', 'proposal', 'insurance', 
        'license', 'portfolio', 'correspondence', 'other'
    )),
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES auth.users(id),
    is_signed BOOLEAN DEFAULT false,
    signed_date TIMESTAMP WITH TIME ZONE,
    expiration_date DATE,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create contract milestones table
CREATE TABLE IF NOT EXISTS contract_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    milestone_type VARCHAR(50) NOT NULL CHECK (milestone_type IN (
        'deposit_due', 'payment_due', 'final_payment', 'service_date',
        'meeting', 'tasting', 'fitting', 'rehearsal', 'delivery', 'setup', 'other'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    amount DECIMAL(10, 2),
    is_completed BOOLEAN DEFAULT false,
    completed_date DATE,
    reminder_days INTEGER DEFAULT 7,
    reminder_sent BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create contract terms table for specific terms tracking
CREATE TABLE IF NOT EXISTS contract_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    term_category VARCHAR(50) NOT NULL CHECK (term_category IN (
        'service_details', 'payment_terms', 'cancellation', 'liability',
        'force_majeure', 'additional_services', 'restrictions', 'other'
    )),
    term_title VARCHAR(255) NOT NULL,
    term_description TEXT NOT NULL,
    is_negotiable BOOLEAN DEFAULT false,
    is_agreed BOOLEAN DEFAULT false,
    importance VARCHAR(20) DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'critical')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vendor reviews table
CREATE TABLE IF NOT EXISTS vendor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    review_title VARCHAR(255),
    review_text TEXT,
    would_recommend BOOLEAN DEFAULT true,
    review_date DATE DEFAULT CURRENT_DATE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, couple_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor ON vendor_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_type ON vendor_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_contract_milestones_vendor ON contract_milestones(vendor_id);
CREATE INDEX IF NOT EXISTS idx_contract_milestones_due_date ON contract_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_contract_terms_vendor ON contract_terms(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor ON vendor_reviews(vendor_id);

-- Enable RLS for new tables
ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_documents
CREATE POLICY "Users can view their own vendor documents"
    ON vendor_documents FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can upload vendor documents"
    ON vendor_documents FOR INSERT
    WITH CHECK (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own vendor documents"
    ON vendor_documents FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own vendor documents"
    ON vendor_documents FOR DELETE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- RLS policies for contract_milestones
CREATE POLICY "Users can view their own contract milestones"
    ON contract_milestones FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can create contract milestones"
    ON contract_milestones FOR INSERT
    WITH CHECK (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own contract milestones"
    ON contract_milestones FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own contract milestones"
    ON contract_milestones FOR DELETE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- RLS policies for contract_terms
CREATE POLICY "Users can view their own contract terms"
    ON contract_terms FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can create contract terms"
    ON contract_terms FOR INSERT
    WITH CHECK (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own contract terms"
    ON contract_terms FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own contract terms"
    ON contract_terms FOR DELETE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- RLS policies for vendor_reviews
CREATE POLICY "Users can view their own vendor reviews"
    ON vendor_reviews FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can create vendor reviews"
    ON vendor_reviews FOR INSERT
    WITH CHECK (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own vendor reviews"
    ON vendor_reviews FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- Function to get contract status summary
CREATE OR REPLACE FUNCTION get_contract_status_summary(p_couple_id UUID)
RETURNS TABLE (
    status VARCHAR(50),
    count BIGINT,
    total_amount DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.contract_status as status,
        COUNT(*) as count,
        SUM(v.contract_amount) as total_amount
    FROM vendors v
    WHERE v.couple_id = p_couple_id
    AND v.contract_status IS NOT NULL
    GROUP BY v.contract_status
    ORDER BY 
        CASE v.contract_status
            WHEN 'signed' THEN 1
            WHEN 'negotiating' THEN 2
            WHEN 'sent' THEN 3
            WHEN 'draft' THEN 4
            WHEN 'cancelled' THEN 5
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming milestones
CREATE OR REPLACE FUNCTION get_upcoming_milestones(p_couple_id UUID, p_days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
    milestone_id UUID,
    vendor_id UUID,
    vendor_name VARCHAR(255),
    milestone_type VARCHAR(50),
    title VARCHAR(255),
    due_date DATE,
    amount DECIMAL(10, 2),
    days_until INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id as milestone_id,
        cm.vendor_id,
        v.business_name as vendor_name,
        cm.milestone_type,
        cm.title,
        cm.due_date,
        cm.amount,
        (cm.due_date - CURRENT_DATE)::INTEGER as days_until
    FROM contract_milestones cm
    JOIN vendors v ON v.id = cm.vendor_id
    WHERE cm.couple_id = p_couple_id
    AND cm.is_completed = false
    AND cm.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead
    ORDER BY cm.due_date ASC;
END;
$$ LANGUAGE plpgsql;