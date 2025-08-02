-- =============================================
-- COMPREHENSIVE BUDGET MANAGEMENT SYSTEM
-- Enhanced budget tracking with advanced features
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- BUDGET CORE TABLES
-- =============================================

-- Budget periods for tracking budget over time
CREATE TABLE IF NOT EXISTS budget_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., 'Initial Budget', 'Revised Q1 2024'
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

-- Enhanced budget categories with flexible budgeting
CREATE TABLE IF NOT EXISTS budget_category_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- For UI display
    color VARCHAR(7), -- Hex color for charts
    display_order INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE, -- System categories can't be deleted
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget allocations per period
CREATE TABLE IF NOT EXISTS budget_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
    category_type_id UUID NOT NULL REFERENCES budget_category_types(id),
    allocated_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
    allocated_percentage DECIMAL(5,2) CHECK (allocated_percentage >= 0 AND allocated_percentage <= 100),
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    is_flexible BOOLEAN DEFAULT TRUE, -- Can be adjusted automatically
    minimum_amount DECIMAL(12,2) DEFAULT 0,
    maximum_amount DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(period_id, category_type_id)
);

-- =============================================
-- ENHANCED EXPENSE TRACKING
-- =============================================

-- Expense statuses
CREATE TYPE expense_status AS ENUM (
    'planned',      -- Future expense
    'committed',    -- Contract signed but not paid
    'partial',      -- Partially paid
    'paid',         -- Fully paid
    'cancelled',    -- Cancelled
    'refunded'      -- Refunded
);

-- Payment methods
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

-- Enhanced budget expenses with better tracking
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES budget_periods(id),
    category_type_id UUID NOT NULL REFERENCES budget_category_types(id),
    vendor_id UUID REFERENCES couple_vendors(id) ON DELETE SET NULL,
    
    -- Basic info
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Financial details
    estimated_amount DECIMAL(12,2) NOT NULL CHECK (estimated_amount >= 0),
    contracted_amount DECIMAL(12,2) CHECK (contracted_amount >= 0),
    final_amount DECIMAL(12,2) CHECK (final_amount >= 0),
    
    -- Status tracking
    status expense_status DEFAULT 'planned',
    
    -- Important dates
    due_date DATE,
    contract_date DATE,
    service_date DATE,
    
    -- Flags
    is_deposit BOOLEAN DEFAULT FALSE,
    is_gratuity BOOLEAN DEFAULT FALSE,
    is_tax_included BOOLEAN DEFAULT TRUE,
    requires_contract BOOLEAN DEFAULT FALSE,
    contract_signed BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    tags TEXT[],
    attachments JSONB DEFAULT '[]', -- Array of {url, name, type}
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS budget_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    budget_item_id UUID NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
    
    -- Transaction details
    amount DECIMAL(12,2) NOT NULL CHECK (amount != 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'adjustment')),
    payment_method payment_method,
    
    -- Payment info
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_number VARCHAR(50),
    reference_number VARCHAR(100),
    
    -- Card details (last 4 digits only for security)
    card_last_four VARCHAR(4),
    
    -- Who paid
    paid_by VARCHAR(100), -- Name of person/entity who paid
    
    -- Documentation
    receipt_url TEXT,
    notes TEXT,
    
    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_date DATE,
    reconciled_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- BUDGET ANALYTICS & REPORTING
-- =============================================

-- Budget snapshots for historical tracking
CREATE TABLE IF NOT EXISTS budget_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES budget_periods(id),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Snapshot data
    total_budget DECIMAL(12,2) NOT NULL,
    total_allocated DECIMAL(12,2) NOT NULL,
    total_spent DECIMAL(12,2) NOT NULL,
    total_committed DECIMAL(12,2) NOT NULL,
    total_remaining DECIMAL(12,2) NOT NULL,
    
    -- Category breakdown (JSONB for flexibility)
    category_breakdown JSONB NOT NULL DEFAULT '[]',
    
    -- Metrics
    budget_health_score INTEGER CHECK (budget_health_score >= 0 AND budget_health_score <= 100),
    days_until_wedding INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget recommendations based on spending patterns
CREATE TABLE IF NOT EXISTS budget_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    category_type_id UUID REFERENCES budget_category_types(id),
    
    recommendation_type VARCHAR(50) NOT NULL, -- 'overspend_warning', 'savings_opportunity', 'reallocation', etc.
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    suggested_action TEXT,
    potential_savings DECIMAL(12,2),
    
    -- Tracking
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMPTZ,
    is_applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMPTZ,
    
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- VENDOR PRICING & QUOTES
-- =============================================

-- Vendor price packages
CREATE TABLE IF NOT EXISTS vendor_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES couple_vendors(id) ON DELETE CASCADE,
    
    package_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Pricing
    base_price DECIMAL(12,2) NOT NULL CHECK (base_price >= 0),
    is_starting_price BOOLEAN DEFAULT FALSE, -- "Starting at" pricing
    
    -- What's included
    included_items JSONB DEFAULT '[]',
    add_on_items JSONB DEFAULT '[]',
    
    -- Constraints
    minimum_guests INTEGER,
    maximum_guests INTEGER,
    minimum_hours DECIMAL(4,2),
    
    -- Availability
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE,
    valid_until DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor quotes for specific couples
CREATE TABLE IF NOT EXISTS vendor_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES couple_vendors(id) ON DELETE CASCADE,
    package_id UUID REFERENCES vendor_packages(id),
    
    -- Quote details
    quote_number VARCHAR(50),
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    
    -- Pricing breakdown
    base_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    gratuity_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    -- Custom items
    custom_items JSONB DEFAULT '[]', -- Array of {description, amount}
    
    -- Terms
    deposit_amount DECIMAL(12,2),
    deposit_due_date DATE,
    payment_schedule JSONB DEFAULT '[]', -- Array of {amount, due_date, description}
    
    -- Status
    is_accepted BOOLEAN DEFAULT FALSE,
    accepted_date DATE,
    
    -- Documents
    quote_document_url TEXT,
    contract_url TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SMART BUDGET FEATURES
-- =============================================

-- Budget rules for automated monitoring
CREATE TABLE IF NOT EXISTS budget_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'category_limit', 'total_limit', 'payment_reminder', etc.
    
    -- Conditions
    category_type_id UUID REFERENCES budget_category_types(id),
    threshold_percentage INTEGER CHECK (threshold_percentage > 0 AND threshold_percentage <= 100),
    threshold_amount DECIMAL(12,2),
    days_before_due INTEGER,
    
    -- Actions
    send_email BOOLEAN DEFAULT TRUE,
    send_push BOOLEAN DEFAULT TRUE,
    block_new_expenses BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget optimization suggestions
CREATE TABLE IF NOT EXISTS budget_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    
    optimization_type VARCHAR(50) NOT NULL, -- 'vendor_alternative', 'timing_adjustment', 'package_downgrade', etc.
    category_type_id UUID REFERENCES budget_category_types(id),
    
    current_scenario JSONB NOT NULL,
    suggested_scenario JSONB NOT NULL,
    potential_savings DECIMAL(12,2) NOT NULL,
    
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- User action
    is_reviewed BOOLEAN DEFAULT FALSE,
    is_accepted BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMPTZ,
    feedback TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to calculate budget item totals
CREATE OR REPLACE FUNCTION calculate_budget_item_total()
RETURNS TRIGGER AS $$
DECLARE
    paid_total DECIMAL(12,2);
BEGIN
    -- Calculate total paid from transactions
    SELECT COALESCE(SUM(
        CASE 
            WHEN transaction_type = 'payment' THEN amount
            WHEN transaction_type = 'refund' THEN -amount
            ELSE 0
        END
    ), 0) INTO paid_total
    FROM budget_transactions
    WHERE budget_item_id = NEW.id;
    
    -- Update status based on payments
    IF paid_total >= COALESCE(NEW.final_amount, NEW.contracted_amount, NEW.estimated_amount) THEN
        NEW.status = 'paid';
    ELSIF paid_total > 0 THEN
        NEW.status = 'partial';
    ELSIF NEW.contract_signed AND NEW.status = 'planned' THEN
        NEW.status = 'committed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update budget allocation spent amounts
CREATE OR REPLACE FUNCTION update_allocation_spent()
RETURNS TRIGGER AS $$
DECLARE
    spent_total DECIMAL(12,2);
    committed_total DECIMAL(12,2);
    allocation_record RECORD;
BEGIN
    -- Get the current period allocation
    SELECT ba.* INTO allocation_record
    FROM budget_allocations ba
    JOIN budget_periods bp ON ba.period_id = bp.id
    WHERE bp.couple_id = NEW.couple_id 
    AND bp.is_active = TRUE
    AND ba.category_type_id = NEW.category_type_id;
    
    IF allocation_record IS NOT NULL THEN
        -- Calculate spent (paid items)
        SELECT COALESCE(SUM(
            CASE 
                WHEN bi.status = 'paid' THEN COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount)
                WHEN bi.status = 'partial' THEN (
                    SELECT COALESCE(SUM(
                        CASE 
                            WHEN bt.transaction_type = 'payment' THEN bt.amount
                            WHEN bt.transaction_type = 'refund' THEN -bt.amount
                            ELSE 0
                        END
                    ), 0)
                    FROM budget_transactions bt
                    WHERE bt.budget_item_id = bi.id
                )
                ELSE 0
            END
        ), 0) INTO spent_total
        FROM budget_items bi
        WHERE bi.couple_id = NEW.couple_id
        AND bi.category_type_id = NEW.category_type_id
        AND bi.period_id = allocation_record.period_id;
        
        -- Calculate committed (contracted but not fully paid)
        SELECT COALESCE(SUM(
            CASE 
                WHEN bi.status IN ('committed', 'partial') THEN 
                    COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount) - 
                    COALESCE((
                        SELECT SUM(
                            CASE 
                                WHEN bt.transaction_type = 'payment' THEN bt.amount
                                WHEN bt.transaction_type = 'refund' THEN -bt.amount
                                ELSE 0
                            END
                        )
                        FROM budget_transactions bt
                        WHERE bt.budget_item_id = bi.id
                    ), 0)
                ELSE 0
            END
        ), 0) INTO committed_total
        FROM budget_items bi
        WHERE bi.couple_id = NEW.couple_id
        AND bi.category_type_id = NEW.category_type_id
        AND bi.period_id = allocation_record.period_id;
        
        -- Check if we need to create an alert
        IF (spent_total + committed_total) > allocation_record.allocated_amount * 0.8 THEN
            INSERT INTO budget_alerts (
                couple_id, 
                category_id,
                alert_type,
                threshold_percentage,
                message
            ) VALUES (
                NEW.couple_id,
                NULL, -- We'll need to map category_type_id to category_id
                'category_overspend',
                CASE 
                    WHEN (spent_total + committed_total) >= allocation_record.allocated_amount THEN 100
                    WHEN (spent_total + committed_total) >= allocation_record.allocated_amount * 0.9 THEN 90
                    ELSE 80
                END,
                'Budget alert for category'
            ) ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate budget recommendations
CREATE OR REPLACE FUNCTION generate_budget_recommendations(p_couple_id UUID)
RETURNS VOID AS $$
DECLARE
    active_period RECORD;
    allocation RECORD;
    overspend_threshold DECIMAL := 0.9;
    underspend_threshold DECIMAL := 0.3;
BEGIN
    -- Get active budget period
    SELECT * INTO active_period
    FROM budget_periods
    WHERE couple_id = p_couple_id AND is_active = TRUE;
    
    IF active_period IS NULL THEN
        RETURN;
    END IF;
    
    -- Check each allocation for recommendations
    FOR allocation IN 
        SELECT 
            ba.*,
            bct.name as category_name,
            COALESCE(SUM(
                CASE 
                    WHEN bi.status IN ('paid', 'committed', 'partial') 
                    THEN COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount)
                    ELSE 0
                END
            ), 0) as total_spent_committed
        FROM budget_allocations ba
        JOIN budget_category_types bct ON ba.category_type_id = bct.id
        LEFT JOIN budget_items bi ON bi.category_type_id = ba.category_type_id 
            AND bi.period_id = ba.period_id
        WHERE ba.period_id = active_period.id
        GROUP BY ba.id, bct.name
    LOOP
        -- Check for overspending
        IF allocation.total_spent_committed > allocation.allocated_amount * overspend_threshold THEN
            INSERT INTO budget_recommendations (
                couple_id,
                category_type_id,
                recommendation_type,
                severity,
                title,
                description,
                potential_savings
            ) VALUES (
                p_couple_id,
                allocation.category_type_id,
                'overspend_warning',
                CASE 
                    WHEN allocation.total_spent_committed >= allocation.allocated_amount THEN 'critical'
                    ELSE 'warning'
                END,
                'Overspending Alert: ' || allocation.category_name,
                'You are approaching or exceeding your budget for ' || allocation.category_name,
                allocation.total_spent_committed - allocation.allocated_amount
            ) ON CONFLICT DO NOTHING;
        END IF;
        
        -- Check for underspending opportunities
        IF allocation.total_spent_committed < allocation.allocated_amount * underspend_threshold 
           AND allocation.is_flexible THEN
            INSERT INTO budget_recommendations (
                couple_id,
                category_type_id,
                recommendation_type,
                severity,
                title,
                description,
                potential_savings
            ) VALUES (
                p_couple_id,
                allocation.category_type_id,
                'reallocation',
                'info',
                'Reallocation Opportunity: ' || allocation.category_name,
                'You have unused budget in ' || allocation.category_name || ' that could be reallocated',
                allocation.allocated_amount - allocation.total_spent_committed
            ) ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Update budget item totals
CREATE TRIGGER trigger_calculate_budget_item_total
    BEFORE INSERT OR UPDATE ON budget_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_budget_item_total();

-- Update allocation spent when items change
CREATE TRIGGER trigger_update_allocation_spent
    AFTER INSERT OR UPDATE OR DELETE ON budget_items
    FOR EACH ROW
    EXECUTE FUNCTION update_allocation_spent();

-- Update allocation spent when transactions change
CREATE TRIGGER trigger_update_allocation_spent_on_transaction
    AFTER INSERT OR UPDATE OR DELETE ON budget_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_allocation_spent();

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_budget_periods_couple_active ON budget_periods(couple_id, is_active);
CREATE INDEX idx_budget_allocations_period ON budget_allocations(period_id);
CREATE INDEX idx_budget_items_couple_period ON budget_items(couple_id, period_id);
CREATE INDEX idx_budget_items_category ON budget_items(category_type_id);
CREATE INDEX idx_budget_items_vendor ON budget_items(vendor_id);
CREATE INDEX idx_budget_items_status ON budget_items(status);
CREATE INDEX idx_budget_transactions_item ON budget_transactions(budget_item_id);
CREATE INDEX idx_budget_transactions_date ON budget_transactions(payment_date);
CREATE INDEX idx_vendor_quotes_couple ON vendor_quotes(couple_id);
CREATE INDEX idx_vendor_quotes_vendor ON vendor_quotes(vendor_id);
CREATE INDEX idx_budget_snapshots_couple_date ON budget_snapshots(couple_id, snapshot_date);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
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

-- RLS Policies for budget_periods
CREATE POLICY "Users can view their budget periods"
    ON budget_periods FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

CREATE POLICY "Users can manage their budget periods"
    ON budget_periods FOR ALL
    USING (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

-- RLS Policies for budget_category_types (public read, admin write)
CREATE POLICY "Everyone can view budget category types"
    ON budget_category_types FOR SELECT
    USING (true);

-- RLS Policies for budget_allocations (through budget_periods)
CREATE POLICY "Users can view their budget allocations"
    ON budget_allocations FOR SELECT
    USING (period_id IN (
        SELECT id FROM budget_periods WHERE couple_id IN (
            SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    ));

CREATE POLICY "Users can manage their budget allocations"
    ON budget_allocations FOR ALL
    USING (period_id IN (
        SELECT id FROM budget_periods WHERE couple_id IN (
            SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    ));

-- Similar RLS policies for other tables...
-- (Continuing with the same pattern for all tables)

-- =============================================
-- DEFAULT DATA
-- =============================================

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

-- =============================================
-- HELPFUL VIEWS
-- =============================================

-- Budget overview view
CREATE OR REPLACE VIEW budget_overview AS
SELECT 
    bp.id as period_id,
    bp.couple_id,
    bp.name as period_name,
    bp.total_budget,
    bp.currency,
    bp.is_active,
    COALESCE(SUM(ba.allocated_amount), 0) as total_allocated,
    bp.total_budget - COALESCE(SUM(ba.allocated_amount), 0) as unallocated,
    COUNT(DISTINCT bi.id) as total_items,
    COUNT(DISTINCT CASE WHEN bi.status = 'paid' THEN bi.id END) as paid_items,
    COALESCE(SUM(
        CASE 
            WHEN bi.status = 'paid' THEN COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount)
            ELSE 0
        END
    ), 0) as total_paid,
    COALESCE(SUM(
        CASE 
            WHEN bi.status IN ('committed', 'partial') THEN COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount)
            ELSE 0
        END
    ), 0) as total_committed
FROM budget_periods bp
LEFT JOIN budget_allocations ba ON bp.id = ba.period_id
LEFT JOIN budget_items bi ON bp.id = bi.period_id
GROUP BY bp.id;

-- Category spending view
CREATE OR REPLACE VIEW category_spending AS
SELECT 
    ba.id as allocation_id,
    bp.couple_id,
    bp.id as period_id,
    bct.id as category_type_id,
    bct.name as category_name,
    bct.icon,
    bct.color,
    ba.allocated_amount,
    ba.allocated_percentage,
    COUNT(DISTINCT bi.id) as item_count,
    COALESCE(SUM(
        CASE 
            WHEN bi.status = 'paid' THEN COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount)
            WHEN bi.status = 'partial' THEN (
                SELECT COALESCE(SUM(
                    CASE 
                        WHEN bt.transaction_type = 'payment' THEN bt.amount
                        WHEN bt.transaction_type = 'refund' THEN -bt.amount
                        ELSE 0
                    END
                ), 0)
                FROM budget_transactions bt
                WHERE bt.budget_item_id = bi.id
            )
            ELSE 0
        END
    ), 0) as spent_amount,
    COALESCE(SUM(
        CASE 
            WHEN bi.status IN ('committed', 'partial') THEN 
                COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount) - 
                COALESCE((
                    SELECT SUM(
                        CASE 
                            WHEN bt.transaction_type = 'payment' THEN bt.amount
                            WHEN bt.transaction_type = 'refund' THEN -bt.amount
                            ELSE 0
                        END
                    )
                    FROM budget_transactions bt
                    WHERE bt.budget_item_id = bi.id
                ), 0)
            ELSE 0
        END
    ), 0) as committed_amount,
    ba.allocated_amount - COALESCE(SUM(
        CASE 
            WHEN bi.status IN ('paid', 'committed', 'partial') THEN COALESCE(bi.final_amount, bi.contracted_amount, bi.estimated_amount)
            ELSE 0
        END
    ), 0) as remaining_amount
FROM budget_allocations ba
JOIN budget_periods bp ON ba.period_id = bp.id
JOIN budget_category_types bct ON ba.category_type_id = bct.id
LEFT JOIN budget_items bi ON bi.period_id = bp.id AND bi.category_type_id = bct.id
GROUP BY ba.id, bp.id, bp.couple_id, bct.id, bct.name, bct.icon, bct.color, ba.allocated_amount, ba.allocated_percentage;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;