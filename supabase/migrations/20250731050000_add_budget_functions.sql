-- =============================================
-- BUDGET CALCULATION FUNCTIONS
-- =============================================
-- Functions to maintain accurate budget category spent amounts

-- Function to increment category spent amount
CREATE OR REPLACE FUNCTION increment_category_spent(
    category_id UUID,
    amount DECIMAL(10,2)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE budget_categories 
    SET 
        spent_amount = spent_amount + amount,
        updated_at = NOW()
    WHERE id = category_id;
END;
$$;

-- Function to decrement category spent amount
CREATE OR REPLACE FUNCTION decrement_category_spent(
    category_id UUID,
    amount DECIMAL(10,2)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE budget_categories 
    SET 
        spent_amount = GREATEST(0, spent_amount - amount),
        updated_at = NOW()
    WHERE id = category_id;
END;
$$;

-- Function to recalculate category spent amounts from expenses
CREATE OR REPLACE FUNCTION recalculate_category_spent(p_category_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_spent DECIMAL(10,2);
BEGIN
    -- Calculate total spent for this category
    SELECT COALESCE(SUM(amount), 0) 
    INTO total_spent
    FROM budget_expenses 
    WHERE category_id = p_category_id;
    
    -- Update the category
    UPDATE budget_categories 
    SET 
        spent_amount = total_spent,
        updated_at = NOW()
    WHERE id = p_category_id;
END;
$$;

-- Trigger function to automatically update category spent amounts
CREATE OR REPLACE FUNCTION update_category_spent_on_expense_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.category_id IS NOT NULL THEN
            PERFORM recalculate_category_spent(NEW.category_id);
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Recalculate old category if it changed
        IF OLD.category_id IS NOT NULL AND (NEW.category_id IS NULL OR OLD.category_id != NEW.category_id) THEN
            PERFORM recalculate_category_spent(OLD.category_id);
        END IF;
        
        -- Recalculate new category
        IF NEW.category_id IS NOT NULL THEN
            PERFORM recalculate_category_spent(NEW.category_id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.category_id IS NOT NULL THEN
            PERFORM recalculate_category_spent(OLD.category_id);
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Create trigger on budget_expenses table
DROP TRIGGER IF EXISTS trigger_update_category_spent ON budget_expenses;
CREATE TRIGGER trigger_update_category_spent
    AFTER INSERT OR UPDATE OR DELETE ON budget_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_category_spent_on_expense_change();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budget_expenses_category_id ON budget_expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_couple_id ON budget_expenses(couple_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_date ON budget_expenses(date_incurred);
CREATE INDEX IF NOT EXISTS idx_budget_categories_couple_id ON budget_categories(couple_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_priority ON budget_categories(priority);