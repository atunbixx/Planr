-- =============================================
-- FIX COUPLES TABLE REFERENCE ISSUE
-- Resolves 406 errors by ensuring 'couples' view exists
-- =============================================

-- Drop existing view if it exists (to recreate fresh)
DROP VIEW IF EXISTS couples CASCADE;

-- Create or replace the couples view that maps to wedding_couples
CREATE VIEW couples AS 
SELECT 
  id,
  partner1_user_id,
  partner2_user_id,
  partner1_name,
  partner2_name,
  wedding_date,
  venue_name,
  venue_location,
  guest_count_estimate,
  -- Map budget_total to total_budget for consistency
  budget_total as total_budget,
  currency,
  wedding_style,
  created_at,
  updated_at,
  -- Add any missing columns that the app expects
  COALESCE(guest_count_estimate, 100) as guest_count,
  NULL::text as partner1_email,
  NULL::text as partner2_email,
  FALSE as onboarding_completed,
  0::numeric as planning_progress,
  FALSE as venue_booked,
  0::numeric as budget_spent
FROM wedding_couples;

-- Grant permissions on the view
GRANT ALL ON couples TO authenticated;
GRANT SELECT ON couples TO anon;

-- Enable RLS on the view (inherits security from wedding_couples)
ALTER VIEW couples SET (security_invoker = true);

-- Ensure wedding_couples table has RLS enabled
ALTER TABLE wedding_couples ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies on wedding_couples to recreate them
DROP POLICY IF EXISTS "Users can view their own couple profile" ON wedding_couples;
DROP POLICY IF EXISTS "Users can update their own couple profile" ON wedding_couples;
DROP POLICY IF EXISTS "Users can insert couple profile" ON wedding_couples;
DROP POLICY IF EXISTS "Users can view their own couple data" ON wedding_couples;
DROP POLICY IF EXISTS "Users can update their own couple data" ON wedding_couples;
DROP POLICY IF EXISTS "Users can create their own couple data" ON wedding_couples;
DROP POLICY IF EXISTS "Users can delete their own couple data" ON wedding_couples;

-- Create comprehensive RLS policies on wedding_couples
CREATE POLICY "couples_select_policy" ON wedding_couples
    FOR SELECT USING (
        partner1_user_id = auth.uid() OR 
        partner2_user_id = auth.uid()
    );

CREATE POLICY "couples_insert_policy" ON wedding_couples
    FOR INSERT WITH CHECK (
        partner1_user_id = auth.uid() OR 
        partner2_user_id = auth.uid()
    );

CREATE POLICY "couples_update_policy" ON wedding_couples
    FOR UPDATE USING (
        partner1_user_id = auth.uid() OR 
        partner2_user_id = auth.uid()
    );

CREATE POLICY "couples_delete_policy" ON wedding_couples
    FOR DELETE USING (
        partner1_user_id = auth.uid() OR 
        partner2_user_id = auth.uid()
    );

-- Create helper function to get current user's couple
CREATE OR REPLACE FUNCTION get_user_couple_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM wedding_couples 
  WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_couple_id TO authenticated;

-- Update all tables that reference couples to use wedding_couples
-- This ensures foreign key constraints work properly

-- Fix any tables that have foreign keys to 'couples' instead of 'wedding_couples'
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Find all foreign key constraints that reference 'couples'
    FOR r IN 
        SELECT 
            tc.table_name,
            tc.constraint_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_name = 'couples'
    LOOP
        -- Drop the incorrect constraint
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                      r.table_name, r.constraint_name);
        
        -- Add the correct constraint to wedding_couples
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES wedding_couples(id) ON DELETE CASCADE', 
                      r.table_name, r.constraint_name, r.column_name);
    END LOOP;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wedding_couples_partner1_user_id ON wedding_couples(partner1_user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_couples_partner2_user_id ON wedding_couples(partner2_user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_couples_wedding_date ON wedding_couples(wedding_date);

-- Add missing columns to wedding_couples if they don't exist
ALTER TABLE wedding_couples ADD COLUMN IF NOT EXISTS guest_count INTEGER;
ALTER TABLE wedding_couples ADD COLUMN IF NOT EXISTS partner1_email TEXT;
ALTER TABLE wedding_couples ADD COLUMN IF NOT EXISTS partner2_email TEXT;
ALTER TABLE wedding_couples ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE wedding_couples ADD COLUMN IF NOT EXISTS planning_progress NUMERIC DEFAULT 0 CHECK (planning_progress >= 0 AND planning_progress <= 100);
ALTER TABLE wedding_couples ADD COLUMN IF NOT EXISTS venue_booked BOOLEAN DEFAULT FALSE;
ALTER TABLE wedding_couples ADD COLUMN IF NOT EXISTS budget_spent NUMERIC DEFAULT 0;

-- Update guest_count from guest_count_estimate if needed
UPDATE wedding_couples 
SET guest_count = guest_count_estimate 
WHERE guest_count IS NULL AND guest_count_estimate IS NOT NULL;

-- Log completion
DO $$ 
BEGIN
    RAISE NOTICE 'Couples table reference fix completed successfully';
    RAISE NOTICE 'View "couples" now properly maps to "wedding_couples" table';
    RAISE NOTICE 'All RLS policies have been recreated';
    RAISE NOTICE 'Missing columns have been added to wedding_couples';
END $$;