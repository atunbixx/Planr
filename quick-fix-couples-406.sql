-- =============================================
-- QUICK FIX FOR COUPLES TABLE 406 ERROR
-- Run this in Supabase SQL Editor to immediately fix the issue
-- =============================================

-- Step 1: Create the couples view that maps to wedding_couples
DROP VIEW IF EXISTS couples CASCADE;

CREATE VIEW couples AS 
SELECT * FROM wedding_couples;

-- Step 2: Grant permissions
GRANT ALL ON couples TO authenticated;
GRANT SELECT ON couples TO anon;

-- Step 3: Make the view updatable with triggers
CREATE OR REPLACE FUNCTION handle_couples_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wedding_couples (
    id,
    partner1_user_id,
    partner2_user_id,
    partner1_name,
    partner2_name,
    wedding_date,
    venue_name,
    venue_location,
    guest_count_estimate,
    budget_total,
    currency,
    wedding_style,
    created_at,
    updated_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.partner1_user_id,
    NEW.partner2_user_id,
    NEW.partner1_name,
    NEW.partner2_name,
    NEW.wedding_date,
    NEW.venue_name,
    NEW.venue_location,
    NEW.guest_count_estimate,
    COALESCE(NEW.budget_total, NEW.total_budget, 50000),
    COALESCE(NEW.currency, 'USD'),
    COALESCE(NEW.wedding_style, 'traditional'),
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  ) RETURNING * INTO NEW;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inserts
DROP TRIGGER IF EXISTS couples_insert_trigger ON couples;
CREATE TRIGGER couples_insert_trigger
  INSTEAD OF INSERT ON couples
  FOR EACH ROW
  EXECUTE FUNCTION handle_couples_insert();

-- Step 4: Test the fix
DO $$ 
BEGIN
    RAISE NOTICE 'Couples view created successfully!';
    RAISE NOTICE 'The 406 error should now be resolved.';
    RAISE NOTICE 'You can now insert into "couples" and it will automatically save to "wedding_couples".';
END $$;

-- Verify the setup
SELECT 
    'wedding_couples table exists' as check_item,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wedding_couples') as status
UNION ALL
SELECT 
    'couples view exists' as check_item,
    EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'couples') as status
UNION ALL
SELECT 
    'insert trigger exists' as check_item,
    EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'couples_insert_trigger') as status;