-- SQL functions for budget management
-- Run this in Supabase SQL Editor

-- Function to increment spent amount in budget categories
CREATE OR REPLACE FUNCTION increment_spent_amount(category_id UUID, amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE budget_categories 
  SET spent_amount = spent_amount + amount,
      updated_at = NOW()
  WHERE id = category_id;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate spent amounts for all categories
CREATE OR REPLACE FUNCTION recalculate_spent_amounts()
RETURNS void AS $$
BEGIN
  UPDATE budget_categories 
  SET spent_amount = (
    SELECT COALESCE(SUM(expenses.amount), 0)
    FROM expenses 
    WHERE expenses.category_id = budget_categories.id
  ),
  updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get budget summary for a couple
CREATE OR REPLACE FUNCTION get_budget_summary(p_couple_id UUID)
RETURNS TABLE(
  total_budget DECIMAL,
  total_spent DECIMAL,
  total_allocated DECIMAL,
  remaining_budget DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.budget_total,
    COALESCE(SUM(bc.spent_amount), 0) as total_spent,
    COALESCE(SUM(bc.allocated_amount), 0) as total_allocated,
    c.budget_total - COALESCE(SUM(bc.spent_amount), 0) as remaining_budget
  FROM couples c
  LEFT JOIN budget_categories bc ON bc.couple_id = c.id
  WHERE c.id = p_couple_id
  GROUP BY c.id, c.budget_total;
END;
$$ LANGUAGE plpgsql;