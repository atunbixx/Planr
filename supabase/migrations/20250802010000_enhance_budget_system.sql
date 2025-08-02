-- =============================================
-- BUDGET SYSTEM ENHANCEMENTS
-- =============================================
-- Add missing columns and tables for complete budget tracking

-- Add payment tracking columns to budget_expenses
ALTER TABLE budget_expenses
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);

-- Create payment history table for tracking partial payments
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES budget_expenses(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create budget templates table
CREATE TABLE IF NOT EXISTS budget_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    budget_range VARCHAR(50), -- e.g., '10k-25k', '25k-50k', '50k-100k', '100k+'
    categories JSONB NOT NULL, -- Array of category templates with names and percentages
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budget alerts table
CREATE TABLE IF NOT EXISTS budget_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    category_id UUID REFERENCES budget_categories(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'category_overspend', 'total_overspend', 'payment_due', 'milestone_reached'
    threshold_percentage INTEGER, -- e.g., 80, 90, 100
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_history_expense_id ON payment_history(expense_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_couple_id ON payment_history(couple_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_couple_id ON budget_alerts(couple_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_created_at ON budget_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_payment_status ON budget_expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_is_paid ON budget_expenses(is_paid);

-- Function to update expense payment status based on payment history
CREATE OR REPLACE FUNCTION update_expense_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    total_paid DECIMAL(10,2);
    expense_amount DECIMAL(10,2);
BEGIN
    -- Get the expense amount
    SELECT amount INTO expense_amount
    FROM budget_expenses
    WHERE id = NEW.expense_id;
    
    -- Calculate total paid for this expense
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payment_history
    WHERE expense_id = NEW.expense_id;
    
    -- Update expense payment status
    UPDATE budget_expenses
    SET 
        payment_status = CASE
            WHEN total_paid >= expense_amount THEN 'paid'
            WHEN total_paid > 0 AND total_paid < expense_amount THEN 'partial'
            ELSE 'pending'
        END,
        is_paid = (total_paid >= expense_amount),
        payment_date = CASE
            WHEN total_paid >= expense_amount THEN NEW.payment_date
            ELSE payment_date
        END,
        updated_at = NOW()
    WHERE id = NEW.expense_id;
    
    RETURN NEW;
END;
$$;

-- Create trigger for payment history
DROP TRIGGER IF EXISTS trigger_update_payment_status ON payment_history;
CREATE TRIGGER trigger_update_payment_status
    AFTER INSERT OR UPDATE OR DELETE ON payment_history
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_payment_status();

-- Function to check budget alerts
CREATE OR REPLACE FUNCTION check_budget_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    category_percentage DECIMAL(5,2);
    total_percentage DECIMAL(5,2);
    budget_total DECIMAL(10,2);
    total_spent DECIMAL(10,2);
BEGIN
    -- Check category overspend
    IF NEW.category_id IS NOT NULL THEN
        SELECT 
            CASE WHEN allocated_amount > 0 
                THEN (spent_amount / allocated_amount) * 100 
                ELSE 0 
            END INTO category_percentage
        FROM budget_categories
        WHERE id = NEW.category_id;
        
        -- Create alerts at 80%, 90%, and 100% thresholds
        IF category_percentage >= 80 AND category_percentage < 90 THEN
            INSERT INTO budget_alerts (couple_id, category_id, alert_type, threshold_percentage, message)
            VALUES (NEW.couple_id, NEW.category_id, 'category_overspend', 80, 
                    'You have used 80% of your budget for this category')
            ON CONFLICT DO NOTHING;
        ELSIF category_percentage >= 90 AND category_percentage < 100 THEN
            INSERT INTO budget_alerts (couple_id, category_id, alert_type, threshold_percentage, message)
            VALUES (NEW.couple_id, NEW.category_id, 'category_overspend', 90, 
                    'Warning: You have used 90% of your budget for this category')
            ON CONFLICT DO NOTHING;
        ELSIF category_percentage >= 100 THEN
            INSERT INTO budget_alerts (couple_id, category_id, alert_type, threshold_percentage, message)
            VALUES (NEW.couple_id, NEW.category_id, 'category_overspend', 100, 
                    'Alert: You have exceeded your budget for this category')
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    -- Check total budget overspend
    SELECT COALESCE(budget_total, 50000) INTO budget_total
    FROM couples
    WHERE id = NEW.couple_id;
    
    SELECT COALESCE(SUM(amount), 0) INTO total_spent
    FROM budget_expenses
    WHERE couple_id = NEW.couple_id;
    
    IF budget_total > 0 THEN
        total_percentage := (total_spent / budget_total) * 100;
        
        IF total_percentage >= 80 AND total_percentage < 90 THEN
            INSERT INTO budget_alerts (couple_id, alert_type, threshold_percentage, message)
            VALUES (NEW.couple_id, 'total_overspend', 80, 
                    'You have used 80% of your total wedding budget')
            ON CONFLICT DO NOTHING;
        ELSIF total_percentage >= 90 AND total_percentage < 100 THEN
            INSERT INTO budget_alerts (couple_id, alert_type, threshold_percentage, message)
            VALUES (NEW.couple_id, 'total_overspend', 90, 
                    'Warning: You have used 90% of your total wedding budget')
            ON CONFLICT DO NOTHING;
        ELSIF total_percentage >= 100 THEN
            INSERT INTO budget_alerts (couple_id, alert_type, threshold_percentage, message)
            VALUES (NEW.couple_id, 'total_overspend', 100, 
                    'Alert: You have exceeded your total wedding budget')
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for budget alerts
DROP TRIGGER IF EXISTS trigger_check_budget_alerts ON budget_expenses;
CREATE TRIGGER trigger_check_budget_alerts
    AFTER INSERT OR UPDATE ON budget_expenses
    FOR EACH ROW
    EXECUTE FUNCTION check_budget_alerts();

-- Insert default budget templates
INSERT INTO budget_templates (name, description, budget_range, categories) VALUES
('Intimate Wedding', 'Perfect for small, intimate celebrations with close family and friends', '10k-25k', 
 '[
   {"name": "Venue & Reception", "percentage": 30},
   {"name": "Catering & Bar", "percentage": 25},
   {"name": "Photography & Videography", "percentage": 10},
   {"name": "Wedding Attire", "percentage": 8},
   {"name": "Flowers & Decorations", "percentage": 8},
   {"name": "Music & Entertainment", "percentage": 7},
   {"name": "Invitations & Stationery", "percentage": 3},
   {"name": "Transportation", "percentage": 2},
   {"name": "Wedding Cake", "percentage": 2},
   {"name": "Miscellaneous", "percentage": 5}
 ]'::jsonb),

('Classic Wedding', 'Traditional wedding with all the essentials', '25k-50k', 
 '[
   {"name": "Venue & Reception", "percentage": 28},
   {"name": "Catering & Bar", "percentage": 22},
   {"name": "Photography & Videography", "percentage": 12},
   {"name": "Wedding Attire", "percentage": 7},
   {"name": "Flowers & Decorations", "percentage": 8},
   {"name": "Music & Entertainment", "percentage": 8},
   {"name": "Rings", "percentage": 5},
   {"name": "Transportation", "percentage": 2},
   {"name": "Wedding Cake", "percentage": 2},
   {"name": "Invitations & Stationery", "percentage": 2},
   {"name": "Beauty & Wellness", "percentage": 2},
   {"name": "Miscellaneous", "percentage": 2}
 ]'::jsonb),

('Luxury Wedding', 'Upscale celebration with premium vendors and experiences', '50k-100k', 
 '[
   {"name": "Venue & Reception", "percentage": 25},
   {"name": "Catering & Bar", "percentage": 20},
   {"name": "Photography & Videography", "percentage": 15},
   {"name": "Wedding Attire", "percentage": 8},
   {"name": "Flowers & Decorations", "percentage": 10},
   {"name": "Music & Entertainment", "percentage": 8},
   {"name": "Rings", "percentage": 4},
   {"name": "Transportation", "percentage": 3},
   {"name": "Wedding Cake", "percentage": 2},
   {"name": "Invitations & Stationery", "percentage": 2},
   {"name": "Beauty & Wellness", "percentage": 2},
   {"name": "Miscellaneous", "percentage": 1}
 ]'::jsonb),

('Grand Wedding', 'Extravagant celebration with no expense spared', '100k+', 
 '[
   {"name": "Venue & Reception", "percentage": 22},
   {"name": "Catering & Bar", "percentage": 18},
   {"name": "Photography & Videography", "percentage": 12},
   {"name": "Wedding Attire", "percentage": 10},
   {"name": "Flowers & Decorations", "percentage": 12},
   {"name": "Music & Entertainment", "percentage": 10},
   {"name": "Rings", "percentage": 5},
   {"name": "Transportation", "percentage": 3},
   {"name": "Wedding Cake", "percentage": 2},
   {"name": "Invitations & Stationery", "percentage": 2},
   {"name": "Beauty & Wellness", "percentage": 3},
   {"name": "Miscellaneous", "percentage": 1}
 ]'::jsonb);

-- Enable RLS for new tables
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_history
CREATE POLICY "Users can view payment history for their couple"
    ON payment_history FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

CREATE POLICY "Users can insert payment history for their couple"
    ON payment_history FOR INSERT
    WITH CHECK (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

CREATE POLICY "Users can update payment history for their couple"
    ON payment_history FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

-- RLS Policies for budget_templates (read-only for all authenticated users)
CREATE POLICY "All users can view budget templates"
    ON budget_templates FOR SELECT
    USING (is_active = true);

-- RLS Policies for budget_alerts
CREATE POLICY "Users can view alerts for their couple"
    ON budget_alerts FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));

CREATE POLICY "Users can update alerts for their couple"
    ON budget_alerts FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    ));