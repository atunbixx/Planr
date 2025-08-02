-- Payment tracking enhancement for budget management
-- Adds payment status tracking to expenses

-- Add payment tracking columns to budget_expenses
ALTER TABLE budget_expenses 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled'));

-- Create payment history table for tracking partial payments
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES budget_expenses(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(100),
    payment_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_history_expense ON payment_history(expense_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_couple ON payment_history(couple_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_date ON payment_history(payment_date);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_payment_status ON budget_expenses(payment_status);

-- Enable RLS for payment_history
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_history
CREATE POLICY "Users can view their own payment history"
    ON payment_history FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can create payment history for their expenses"
    ON payment_history FOR INSERT
    WITH CHECK (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own payment history"
    ON payment_history FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own payment history"
    ON payment_history FOR DELETE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- Function to update expense payment status based on payment history
CREATE OR REPLACE FUNCTION update_expense_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(10, 2);
    expense_amount DECIMAL(10, 2);
    new_status VARCHAR(50);
BEGIN
    -- Calculate total paid for this expense
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payment_history
    WHERE expense_id = NEW.expense_id;

    -- Get the expense amount
    SELECT amount INTO expense_amount
    FROM budget_expenses
    WHERE id = NEW.expense_id;

    -- Determine payment status
    IF total_paid >= expense_amount THEN
        new_status := 'paid';
    ELSIF total_paid > 0 THEN
        new_status := 'partial';
    ELSE
        new_status := 'pending';
    END IF;

    -- Update expense payment status
    UPDATE budget_expenses
    SET 
        payment_status = new_status,
        is_paid = (new_status = 'paid'),
        payment_date = CASE 
            WHEN new_status = 'paid' AND payment_date IS NULL 
            THEN NEW.payment_date 
            ELSE payment_date 
        END
    WHERE id = NEW.expense_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment history
CREATE TRIGGER trigger_update_expense_payment_status
AFTER INSERT OR UPDATE ON payment_history
FOR EACH ROW
EXECUTE FUNCTION update_expense_payment_status();

-- Function to get payment summary for an expense
CREATE OR REPLACE FUNCTION get_expense_payment_summary(p_expense_id UUID)
RETURNS TABLE (
    total_amount DECIMAL(10, 2),
    total_paid DECIMAL(10, 2),
    remaining_amount DECIMAL(10, 2),
    payment_percentage DECIMAL(5, 2),
    payment_count INTEGER,
    last_payment_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.amount as total_amount,
        COALESCE(SUM(ph.amount), 0) as total_paid,
        e.amount - COALESCE(SUM(ph.amount), 0) as remaining_amount,
        CASE 
            WHEN e.amount > 0 THEN (COALESCE(SUM(ph.amount), 0) / e.amount * 100)::DECIMAL(5, 2)
            ELSE 0
        END as payment_percentage,
        COUNT(ph.id)::INTEGER as payment_count,
        MAX(ph.payment_date) as last_payment_date
    FROM budget_expenses e
    LEFT JOIN payment_history ph ON ph.expense_id = e.id
    WHERE e.id = p_expense_id
    GROUP BY e.id, e.amount;
END;
$$ LANGUAGE plpgsql;