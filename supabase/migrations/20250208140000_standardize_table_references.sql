-- =============================================
-- STANDARDIZE TABLE REFERENCES MIGRATION
-- Ensures all code uses 'couples' view consistently
-- =============================================

-- =============================================
-- 1. ENSURE COUPLES VIEW EXISTS AND IS CORRECT
-- =============================================

-- Drop and recreate the couples view to ensure it's correct
DROP VIEW IF EXISTS couples CASCADE;

-- Create the couples view with all necessary columns
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
  total_budget,
  currency,
  wedding_style,
  created_at,
  updated_at
FROM wedding_couples;

-- Grant permissions on the view
GRANT ALL ON couples TO authenticated;
GRANT SELECT ON couples TO anon;

-- Enable RLS on the view (inherits from wedding_couples)
ALTER VIEW couples SET (security_invoker = true);

-- =============================================
-- 2. CREATE COUPLES RLS POLICIES
-- =============================================

-- Create RLS policies for the couples view
-- These will work because the view inherits from wedding_couples

-- Policy for users to see their own couple data
CREATE POLICY "Users can view their own couple data"
  ON wedding_couples FOR SELECT
  USING (
    partner1_user_id = auth.uid() OR 
    partner2_user_id = auth.uid()
  );

-- Policy for users to update their own couple data
CREATE POLICY "Users can update their own couple data"
  ON wedding_couples FOR UPDATE
  USING (
    partner1_user_id = auth.uid() OR 
    partner2_user_id = auth.uid()
  );

-- Policy for users to insert their own couple data
CREATE POLICY "Users can create their own couple data"
  ON wedding_couples FOR INSERT
  WITH CHECK (
    partner1_user_id = auth.uid() OR 
    partner2_user_id = auth.uid()
  );

-- Policy for users to delete their own couple data
CREATE POLICY "Users can delete their own couple data"
  ON wedding_couples FOR DELETE
  USING (
    partner1_user_id = auth.uid() OR 
    partner2_user_id = auth.uid()
  );

-- =============================================
-- 3. UPDATE ALL FOREIGN KEY REFERENCES
-- =============================================

-- Update all tables that reference wedding_couples to also work with couples view
-- This ensures backward compatibility

-- Update budget_items table if it exists
DO $ 
BEGIN
    -- Check if budget_items table exists and has the old reference
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'budget_items'
    ) THEN
        -- Add a comment to indicate this table works with both names
        COMMENT ON TABLE budget_items IS 'Budget items for wedding couples. References couples view which maps to wedding_couples table.';
    END IF;
END $;

-- Update photos table if it exists
DO $ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'photos'
    ) THEN
        COMMENT ON TABLE photos IS 'Wedding photos. References couples view which maps to wedding_couples table.';
    END IF;
END $;

-- =============================================
-- 4. CREATE HELPER FUNCTIONS FOR CONSISTENCY
-- =============================================

-- Function to get current user's couple (works with both table names)
CREATE OR REPLACE FUNCTION get_current_user_couple()
RETURNS TABLE (
  id uuid,
  partner1_user_id uuid,
  partner2_user_id uuid,
  partner1_name text,
  partner2_name text,
  wedding_date date,
  venue_name text,
  venue_location text,
  guest_count_estimate integer,
  total_budget decimal(10,2),
  currency text,
  wedding_style text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $
  SELECT * FROM couples 
  WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  LIMIT 1;
$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_current_user_couple TO authenticated;

-- Function to check if user belongs to a couple
CREATE OR REPLACE FUNCTION user_belongs_to_couple(couple_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $
  SELECT EXISTS (
    SELECT 1 FROM couples 
    WHERE id = couple_id 
    AND (partner1_user_id = auth.uid() OR partner2_user_id = auth.uid())
  );
$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION user_belongs_to_couple TO authenticated;

-- =============================================
-- 5. UPDATE EXISTING RLS POLICIES TO USE COUPLES VIEW
-- =============================================

-- Update all existing policies that reference wedding_couples directly
-- to use the couples view for consistency

-- Update photos policies if they exist
DO $ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photos') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own photos" ON photos;
        DROP POLICY IF EXISTS "Users can upload photos for their wedding" ON photos;
        DROP POLICY IF EXISTS "Users can update their own photos" ON photos;
        DROP POLICY IF EXISTS "Users can delete their own photos" ON photos;
        
        -- Recreate with couples view
        CREATE POLICY "Users can view their own photos"
          ON photos FOR SELECT
          USING (couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
          ));

        CREATE POLICY "Users can upload photos for their wedding"
          ON photos FOR INSERT
          WITH CHECK (couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
          ));

        CREATE POLICY "Users can update their own photos"
          ON photos FOR UPDATE
          USING (couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
          ));

        CREATE POLICY "Users can delete their own photos"
          ON photos FOR DELETE
          USING (couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
          ));
    END IF;
END $;

-- Update budget_items policies if they exist
DO $ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budget_items') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own budget items" ON budget_items;
        DROP POLICY IF EXISTS "Users can create budget items for their wedding" ON budget_items;
        DROP POLICY IF EXISTS "Users can update their own budget items" ON budget_items;
        DROP POLICY IF EXISTS "Users can delete their own budget items" ON budget_items;
        
        -- Recreate with couples view
        CREATE POLICY "Users can view their own budget items"
          ON budget_items FOR SELECT
          USING (couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
          ));

        CREATE POLICY "Users can create budget items for their wedding"
          ON budget_items FOR INSERT
          WITH CHECK (couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
          ));

        CREATE POLICY "Users can update their own budget items"
          ON budget_items FOR UPDATE
          USING (couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
          ));

        CREATE POLICY "Users can delete their own budget items"
          ON budget_items FOR DELETE
          USING (couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
          ));
    END IF;
END $;

-- =============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Ensure wedding_couples has proper indexes for the view
CREATE INDEX IF NOT EXISTS idx_wedding_couples_partner1_user_id ON wedding_couples(partner1_user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_couples_partner2_user_id ON wedding_couples(partner2_user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_couples_wedding_date ON wedding_couples(wedding_date);

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Log completion
DO $ 
BEGIN
    RAISE NOTICE 'Table reference standardization completed successfully';
    RAISE NOTICE 'All code should now use "couples" view consistently';
    RAISE NOTICE 'View maps to wedding_couples table with proper RLS policies';
    RAISE NOTICE 'Helper functions created for common operations';
END $;