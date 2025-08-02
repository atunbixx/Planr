-- Fix schema mismatches between frontend expectations and database structure
-- This migration adds the missing columns that the frontend code expects

-- Add missing columns that frontend expects but don't exist in database
ALTER TABLE couples ADD COLUMN IF NOT EXISTS guest_count_estimate INTEGER;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_name TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_location TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS budget_total NUMERIC;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS wedding_style TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Copy data from existing columns to new expected columns where applicable
UPDATE couples SET 
  guest_count_estimate = COALESCE(guest_count_estimate, estimated_guests, 100),
  venue_name = COALESCE(venue_name, venue),
  budget_total = COALESCE(budget_total, total_budget, 30000),
  wedding_style = COALESCE(wedding_style, planning_style, 'traditional')
WHERE guest_count_estimate IS NULL OR venue_name IS NULL OR budget_total IS NULL OR wedding_style IS NULL;

-- Ensure all records have reasonable defaults
UPDATE couples SET 
  guest_count_estimate = 100 WHERE guest_count_estimate IS NULL,
  budget_total = 30000 WHERE budget_total IS NULL,
  wedding_style = 'traditional' WHERE wedding_style IS NULL,
  onboarding_completed = true WHERE onboarding_completed IS NULL;

-- Add indexes for performance on new columns
CREATE INDEX IF NOT EXISTS idx_couples_guest_count_estimate ON couples(guest_count_estimate);
CREATE INDEX IF NOT EXISTS idx_couples_venue_name ON couples(venue_name);
CREATE INDEX IF NOT EXISTS idx_couples_budget_total ON couples(budget_total);
CREATE INDEX IF NOT EXISTS idx_couples_onboarding_completed ON couples(onboarding_completed);

-- Add helpful comments for the new columns
COMMENT ON COLUMN couples.guest_count_estimate IS 'Estimated number of wedding guests (frontend expected field)';
COMMENT ON COLUMN couples.venue_name IS 'Name of the wedding venue (frontend expected field)';
COMMENT ON COLUMN couples.venue_location IS 'Location/address of the wedding venue (frontend expected field)';
COMMENT ON COLUMN couples.budget_total IS 'Total wedding budget amount (frontend expected field)';
COMMENT ON COLUMN couples.wedding_style IS 'Style/theme of the wedding (frontend expected field)';
COMMENT ON COLUMN couples.onboarding_completed IS 'Whether the couple has completed the onboarding process';