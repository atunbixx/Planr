-- Add payment fields to budget_expenses table if they don't exist
DO $$ 
BEGIN
    -- Add payment_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budget_expenses' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE budget_expenses 
        ADD COLUMN payment_status TEXT DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled'));
    END IF;

    -- Add payment_due_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budget_expenses' 
        AND column_name = 'payment_due_date'
    ) THEN
        ALTER TABLE budget_expenses 
        ADD COLUMN payment_due_date DATE;
    END IF;

    -- Add paid_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budget_expenses' 
        AND column_name = 'paid_amount'
    ) THEN
        ALTER TABLE budget_expenses 
        ADD COLUMN paid_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;

    -- Add payment_method column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budget_expenses' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE budget_expenses 
        ADD COLUMN payment_method TEXT;
    END IF;

    -- Add last_payment_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budget_expenses' 
        AND column_name = 'last_payment_date'
    ) THEN
        ALTER TABLE budget_expenses 
        ADD COLUMN last_payment_date DATE;
    END IF;
END $$;

-- Create payment_history table for tracking partial payments
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES budget_expenses(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_expenses_payment_status ON budget_expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_payment_due_date ON budget_expenses(payment_due_date);
CREATE INDEX IF NOT EXISTS idx_payment_history_expense_id ON payment_history(expense_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_date ON payment_history(payment_date);

-- Enable RLS on payment_history
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_history
CREATE POLICY "Couples can view their own payment history" ON payment_history
    FOR SELECT
    USING (
        expense_id IN (
            SELECT id FROM budget_expenses 
            WHERE couple_id IN (
                SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
            )
        )
    );

CREATE POLICY "Couples can insert their own payment history" ON payment_history
    FOR INSERT
    WITH CHECK (
        expense_id IN (
            SELECT id FROM budget_expenses 
            WHERE couple_id IN (
                SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
            )
        )
    );

CREATE POLICY "Couples can update their own payment history" ON payment_history
    FOR UPDATE
    USING (
        expense_id IN (
            SELECT id FROM budget_expenses 
            WHERE couple_id IN (
                SELECT id FROM couples WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
            )
        )
    );

-- Function to update expense paid amount when payment history changes
CREATE OR REPLACE FUNCTION update_expense_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE budget_expenses
    SET paid_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM payment_history
        WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
    ),
    last_payment_date = (
        SELECT MAX(payment_date)
        FROM payment_history
        WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
    ),
    payment_status = CASE
        WHEN (
            SELECT COALESCE(SUM(amount), 0)
            FROM payment_history
            WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
        ) >= amount THEN 'paid'
        WHEN (
            SELECT COALESCE(SUM(amount), 0)
            FROM payment_history
            WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
        ) > 0 THEN 'partial'
        ELSE 'pending'
    END
    WHERE id = COALESCE(NEW.expense_id, OLD.expense_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for payment history
DROP TRIGGER IF EXISTS update_expense_after_payment ON payment_history;
CREATE TRIGGER update_expense_after_payment
    AFTER INSERT OR UPDATE OR DELETE ON payment_history
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_paid_amount();

-- Add some sample payment data for testing (optional)
-- UPDATE budget_expenses 
-- SET payment_due_date = CURRENT_DATE + (random() * 60)::int
-- WHERE payment_due_date IS NULL;