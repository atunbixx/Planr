-- =============================================
-- COMPREHENSIVE BUDGET MANAGEMENT SYSTEM MIGRATION
-- Integrates advanced budget features with existing schema
-- =============================================

-- First, let's ensure we don't duplicate existing tables
DO $$ 
BEGIN
    -- Check if budget_periods table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budget_periods') THEN
        -- Budget periods for tracking budget over time
        CREATE TABLE budget_periods (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            total_budget DECIMAL(12,2) NOT NULL CHECK (total_budget >= 0),
            currency VARCHAR(3) DEFAULT 'USD',
            is_active BOOLEAN DEFAULT TRUE,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            CONSTRAINT no_overlapping_active_periods UNIQUE (couple_id, is_active) WHERE is_active = TRUE
        );
    END IF;

    -- Check if budget_category_types table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budget_category_types') THEN
        CREATE TABLE budget_category_types (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            icon VARCHAR(50),
            color VARCHAR(7),
            display_order INTEGER DEFAULT 0,
            is_system BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;

    -- Check if budget_allocations table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budget_allocations') THEN
        CREATE TABLE budget_allocations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
            category_type_id UUID NOT NULL REFERENCES budget_category_types(id),
            allocated_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
            allocated_percentage DECIMAL(5,2) CHECK (allocated_percentage >= 0 AND allocated_percentage <= 100),
            priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
            is_flexible BOOLEAN DEFAULT TRUE,
            minimum_amount DECIMAL(12,2) DEFAULT 0,
            maximum_amount DECIMAL(12,2),
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(period_id, category_type_id)
        );
    END IF;
END $$;

-- Create expense status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE expense_status AS ENUM (
        'planned',
        'committed',
        'partial',
        'paid',
        'cancelled',
        'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create payment method enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'cash',
        'check',
        'credit_card',
        'debit_card',
        'bank_transfer',
        'paypal',
        'venmo',
        'zelle',
        'gift',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enhanced budget items table
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES budget_periods(id),
    category_type_id UUID NOT NULL REFERENCES budget_category_types(id),
    vendor_id UUID REFERENCES couple_vendors(id) ON DELETE SET NULL,
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    estimated_amount DECIMAL(12,2) NOT NULL CHECK (estimated_amount >= 0),
    contracted_amount DECIMAL(12,2) CHECK (contracted_amount >= 0),
    final_amount DECIMAL(12,2) CHECK (final_amount >= 0),
    
    status expense_status DEFAULT 'planned',
    
    due_date DATE,
    contract_date DATE,
    service_date DATE,
    
    is_deposit BOOLEAN DEFAULT FALSE,
    is_gratuity BOOLEAN DEFAULT FALSE,
    is_tax_included BOOLEAN DEFAULT TRUE,
    requires_contract BOOLEAN DEFAULT FALSE,
    contract_signed BOOLEAN DEFAULT FALSE,
    
    tags TEXT[],
    attachments JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Budget transactions table (enhanced version of payment_history)
CREATE TABLE IF NOT EXISTS budget_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    budget_item_id UUID NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
    
    amount DECIMAL(12,2) NOT NULL CHECK (amount != 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'adjustment')),
    payment_method payment_method,
    
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_number VARCHAR(50),
    reference_number VARCHAR(100),
    card_last_four VARCHAR(4),
    
    paid_by VARCHAR(100),
    receipt_url TEXT,
    notes TEXT,
    
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_date DATE,
    reconciled_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Budget snapshots for historical tracking
CREATE TABLE IF NOT EXISTS budget_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES budget_periods(id),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    total_budget DECIMAL(12,2) NOT NULL,
    total_allocated DECIMAL(12,2) NOT NULL,
    total_spent DECIMAL(12,2) NOT NULL,
    total_committed DECIMAL(12,2) NOT NULL,
    total_remaining DECIMAL(12,2) NOT NULL,
    
    category_breakdown JSONB NOT NULL DEFAULT '[]',
    budget_health_score INTEGER CHECK (budget_health_score >= 0 AND budget_health_score <= 100),
    days_until_wedding INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget recommendations
CREATE TABLE IF NOT EXISTS budget_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    category_type_id UUID REFERENCES budget_category_types(id),
    
    recommendation_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    suggested_action TEXT,
    potential_savings DECIMAL(12,2),
    
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMPTZ,
    is_applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMPTZ,
    
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor packages
CREATE TABLE IF NOT EXISTS vendor_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES couple_vendors(id) ON DELETE CASCADE,
    
    package_name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(12,2) NOT NULL CHECK (base_price >= 0),
    is_starting_price BOOLEAN DEFAULT FALSE,
    
    included_items JSONB DEFAULT '[]',
    add_on_items JSONB DEFAULT '[]',
    
    minimum_guests INTEGER,
    maximum_guests INTEGER,
    minimum_hours DECIMAL(4,2),
    
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE,
    valid_until DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor quotes
CREATE TABLE IF NOT EXISTS vendor_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES couple_vendors(id) ON DELETE CASCADE,
    package_id UUID REFERENCES vendor_packages(id),
    
    quote_number VARCHAR(50),
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    
    base_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    gratuity_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    custom_items JSONB DEFAULT '[]',
    deposit_amount DECIMAL(12,2),
    deposit_due_date DATE,
    payment_schedule JSONB DEFAULT '[]',
    
    is_accepted BOOLEAN DEFAULT FALSE,
    accepted_date DATE,
    
    quote_document_url TEXT,
    contract_url TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget rules for automated monitoring
CREATE TABLE IF NOT EXISTS budget_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    
    category_type_id UUID REFERENCES budget_category_types(id),
    threshold_percentage INTEGER CHECK (threshold_percentage > 0 AND threshold_percentage <= 100),
    threshold_amount DECIMAL(12,2),
    days_before_due INTEGER,
    
    send_email BOOLEAN DEFAULT TRUE,
    send_push BOOLEAN DEFAULT TRUE,
    block_new_expenses BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget optimizations
CREATE TABLE IF NOT EXISTS budget_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    
    optimization_type VARCHAR(50) NOT NULL,
    category_type_id UUID REFERENCES budget_category_types(id),
    
    current_scenario JSONB NOT NULL,
    suggested_scenario JSONB NOT NULL,
    potential_savings DECIMAL(12,2) NOT NULL,
    
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    is_reviewed BOOLEAN DEFAULT FALSE,
    is_accepted BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMPTZ,
    feedback TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budget_periods_couple_active ON budget_periods(couple_id, is_active);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_period ON budget_allocations(period_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_couple_period ON budget_items(couple_id, period_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON budget_items(category_type_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_vendor ON budget_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_status ON budget_items(status);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_item ON budget_transactions(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_date ON budget_transactions(payment_date);
CREATE INDEX IF NOT EXISTS idx_vendor_quotes_couple ON vendor_quotes(couple_id);
CREATE INDEX IF NOT EXISTS idx_vendor_quotes_vendor ON vendor_quotes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_budget_snapshots_couple_date ON budget_snapshots(couple_id, snapshot_date);

-- Enable RLS on all new tables
ALTER TABLE budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_category_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_optimizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Budget periods
CREATE POLICY "Users can view their budget periods"
    ON budget_periods FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

CREATE POLICY "Users can manage their budget periods"
    ON budget_periods FOR INSERT
    WITH CHECK (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

CREATE POLICY "Users can update their budget periods"
    ON budget_periods FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

CREATE POLICY "Users can delete their budget periods"
    ON budget_periods FOR DELETE
    USING (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

-- Budget category types (public read)
CREATE POLICY "Everyone can view budget category types"
    ON budget_category_types FOR SELECT
    USING (true);

-- Budget allocations
CREATE POLICY "Users can view their budget allocations"
    ON budget_allocations FOR SELECT
    USING (period_id IN (
        SELECT id FROM budget_periods WHERE couple_id IN (
            SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    ));

CREATE POLICY "Users can manage their budget allocations"
    ON budget_allocations FOR INSERT
    WITH CHECK (period_id IN (
        SELECT id FROM budget_periods WHERE couple_id IN (
            SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    ));

CREATE POLICY "Users can update their budget allocations"
    ON budget_allocations FOR UPDATE
    USING (period_id IN (
        SELECT id FROM budget_periods WHERE couple_id IN (
            SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    ));

CREATE POLICY "Users can delete their budget allocations"
    ON budget_allocations FOR DELETE
    USING (period_id IN (
        SELECT id FROM budget_periods WHERE couple_id IN (
            SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    ));

-- Budget items
CREATE POLICY "Users can view their budget items"
    ON budget_items FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

CREATE POLICY "Users can manage their budget items"
    ON budget_items FOR INSERT
    WITH CHECK (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

CREATE POLICY "Users can update their budget items"
    ON budget_items FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

CREATE POLICY "Users can delete their budget items"
    ON budget_items FOR DELETE
    USING (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

-- Apply similar RLS policies to all other tables...

-- Insert default budget category types
INSERT INTO budget_category_types (name, description, icon, color, display_order, is_system) VALUES
    ('Venue & Reception', 'Ceremony and reception venue costs', 'building', '#8B4513', 1, true),
    ('Catering & Bar', 'Food and beverage services', 'utensils', '#FF6347', 2, true),
    ('Photography & Videography', 'Photo and video services', 'camera', '#4169E1', 3, true),
    ('Music & Entertainment', 'DJ, band, and entertainment', 'music', '#9370DB', 4, true),
    ('Flowers & Decorations', 'Floral arrangements and decor', 'flower', '#FF69B4', 5, true),
    ('Wedding Attire', 'Dress, suit, and accessories', 'tshirt', '#DDA0DD', 6, true),
    ('Beauty & Wellness', 'Hair, makeup, and spa services', 'spa', '#FFB6C1', 7, true),
    ('Rings & Jewelry', 'Wedding rings and jewelry', 'gem', '#FFD700', 8, true),
    ('Invitations & Stationery', 'Save the dates, invitations, programs', 'envelope', '#F0E68C', 9, true),
    ('Transportation', 'Guest and couple transportation', 'car', '#696969', 10, true),
    ('Wedding Cake & Desserts', 'Cake and dessert services', 'cake', '#D2691E', 11, true),
    ('Favors & Gifts', 'Guest favors and wedding party gifts', 'gift', '#20B2AA', 12, true),
    ('Honeymoon', 'Post-wedding travel and accommodation', 'plane', '#00CED1', 13, true),
    ('Wedding Planner', 'Professional planning services', 'clipboard', '#32CD32', 14, true),
    ('Insurance & Legal', 'Wedding insurance and legal fees', 'shield', '#708090', 15, true),
    ('Miscellaneous', 'Other wedding expenses', 'more-horizontal', '#A9A9A9', 16, true)
ON CONFLICT (name) DO NOTHING;

-- Migration: Create initial budget period for existing couples with budget data
INSERT INTO budget_periods (couple_id, name, start_date, end_date, total_budget, is_active)
SELECT 
    c.id,
    'Initial Budget',
    COALESCE(c.wedding_date - INTERVAL '1 year', CURRENT_DATE),
    COALESCE(c.wedding_date, CURRENT_DATE + INTERVAL '1 year'),
    COALESCE(c.budget_total, 50000),
    true
FROM couples c
WHERE NOT EXISTS (
    SELECT 1 FROM budget_periods bp WHERE bp.couple_id = c.id
)
AND EXISTS (
    SELECT 1 FROM budget_categories bc WHERE bc.couple_id = c.id
);

-- Migration: Map existing budget_categories to new system
INSERT INTO budget_allocations (period_id, category_type_id, allocated_amount)
SELECT 
    bp.id,
    bct.id,
    bc.allocated_amount
FROM budget_categories bc
JOIN budget_periods bp ON bp.couple_id = bc.couple_id AND bp.is_active = true
JOIN budget_category_types bct ON LOWER(bc.name) LIKE '%' || LOWER(
    CASE 
        WHEN bct.name = 'Venue & Reception' THEN 'venue'
        WHEN bct.name = 'Catering & Bar' THEN 'catering'
        WHEN bct.name = 'Photography & Videography' THEN 'photo'
        WHEN bct.name = 'Music & Entertainment' THEN 'music'
        WHEN bct.name = 'Flowers & Decorations' THEN 'flower'
        WHEN bct.name = 'Wedding Attire' THEN 'attire'
        WHEN bct.name = 'Beauty & Wellness' THEN 'beauty'
        WHEN bct.name = 'Rings & Jewelry' THEN 'ring'
        WHEN bct.name = 'Invitations & Stationery' THEN 'invitation'
        WHEN bct.name = 'Transportation' THEN 'transport'
        WHEN bct.name = 'Wedding Cake & Desserts' THEN 'cake'
        WHEN bct.name = 'Favors & Gifts' THEN 'favor'
        WHEN bct.name = 'Honeymoon' THEN 'honeymoon'
        WHEN bct.name = 'Wedding Planner' THEN 'planner'
        ELSE 'miscellaneous'
    END
) || '%'
ON CONFLICT (period_id, category_type_id) DO NOTHING;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;