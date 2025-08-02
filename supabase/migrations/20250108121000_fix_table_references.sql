-- =============================================
-- FIX TABLE REFERENCE INCONSISTENCIES
-- Ensures all code references use correct table names
-- =============================================

-- =============================================
-- 1. CREATE COUPLES VIEW FOR BACKWARD COMPATIBILITY
-- =============================================

-- Create a view called 'couples' that points to 'wedding_couples'
-- This allows existing code to work without changes
CREATE OR REPLACE VIEW couples AS 
SELECT * FROM wedding_couples;

-- Grant permissions on the view
GRANT ALL ON couples TO authenticated;

-- Enable RLS on the view (inherits from wedding_couples)
ALTER VIEW couples SET (security_invoker = true);

-- =============================================
-- 2. CREATE GUESTS VIEW FOR BACKWARD COMPATIBILITY  
-- =============================================

-- Create a view called 'guests' that points to 'wedding_guests'
-- This allows any code using 'guests' to work
CREATE OR REPLACE VIEW guests AS 
SELECT * FROM wedding_guests;

-- Grant permissions on the view
GRANT ALL ON guests TO authenticated;

-- Enable RLS on the view (inherits from wedding_guests)
ALTER VIEW guests SET (security_invoker = true);

-- =============================================
-- 3. ADD MISSING FOREIGN KEY CONSTRAINTS
-- =============================================

-- Add foreign key from vendor_availability to vendors table
-- (This was missing and causing issues)
DO $$ 
BEGIN
    -- Check if the constraint doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vendor_availability_vendor_id_fkey' 
        AND table_name = 'vendor_availability'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE vendor_availability 
        ADD CONSTRAINT vendor_availability_vendor_id_fkey 
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key from vendor_date_overrides to vendors table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vendor_date_overrides_vendor_id_fkey' 
        AND table_name = 'vendor_date_overrides'
    ) THEN
        ALTER TABLE vendor_date_overrides 
        ADD CONSTRAINT vendor_date_overrides_vendor_id_fkey 
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key from vendor_appointments to vendors table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vendor_appointments_vendor_id_fkey' 
        AND table_name = 'vendor_appointments'
    ) THEN
        ALTER TABLE vendor_appointments 
        ADD CONSTRAINT vendor_appointments_vendor_id_fkey 
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================
-- 4. UPDATE RLS POLICIES FOR VENDOR TABLES
-- =============================================

-- Update vendor_availability policies to work with new vendors table
DROP POLICY IF EXISTS "Vendors can manage their own availability" ON vendor_availability;
CREATE POLICY "Vendors can manage their own availability"
  ON vendor_availability FOR ALL
  USING (vendor_id IN (
    SELECT id FROM vendors WHERE contact_email = auth.jwt() ->> 'email'
  ));

-- Update vendor_date_overrides policies
DROP POLICY IF EXISTS "Vendors can manage their own date overrides" ON vendor_date_overrides;
CREATE POLICY "Vendors can manage their own date overrides"
  ON vendor_date_overrides FOR ALL
  USING (vendor_id IN (
    SELECT id FROM vendors WHERE contact_email = auth.jwt() ->> 'email'
  ));

-- Update vendor_appointments policies
DROP POLICY IF EXISTS "Users can view their own appointments" ON vendor_appointments;
CREATE POLICY "Users can view their own appointments"
  ON vendor_appointments FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM wedding_couples 
      WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    )
    OR
    vendor_id IN (
      SELECT id FROM vendors WHERE contact_email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS "Users can update their own appointments" ON vendor_appointments;
CREATE POLICY "Users can update their own appointments"
  ON vendor_appointments FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM wedding_couples 
      WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    )
    OR
    vendor_id IN (
      SELECT id FROM vendors WHERE contact_email = auth.jwt() ->> 'email'
    )
  );

-- =============================================
-- 5. CREATE HELPFUL FUNCTIONS
-- =============================================

-- Function to get couple by user ID (works with both table names)
CREATE OR REPLACE FUNCTION get_couple_by_user_id(user_id uuid)
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
  budget_total decimal(10,2),
  currency text,
  wedding_style text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM wedding_couples 
  WHERE partner1_user_id = user_id OR partner2_user_id = user_id
  LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_couple_by_user_id TO authenticated;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Log completion
DO $$ 
BEGIN
    RAISE NOTICE 'Table reference fixes completed successfully';
    RAISE NOTICE 'Created views: couples -> wedding_couples, guests -> wedding_guests';
    RAISE NOTICE 'Added missing foreign key constraints for vendor tables';
    RAISE NOTICE 'Updated RLS policies for vendor system';
END $$;