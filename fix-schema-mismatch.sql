-- CRITICAL SCHEMA FIXES FOR WEDDING PLANNER
-- Run this in Supabase SQL Editor to fix all authentication issues

-- Add missing columns that frontend expects
ALTER TABLE couples ADD COLUMN IF NOT EXISTS guest_count_estimate INTEGER;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_name TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_location TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS budget_total NUMERIC;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS wedding_style TEXT;

-- Copy data from existing columns to new expected columns
UPDATE couples SET 
  guest_count_estimate = estimated_guests,
  venue_name = venue,
  budget_total = total_budget,
  wedding_style = planning_style
WHERE guest_count_estimate IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_couples_guest_count_estimate ON couples(guest_count_estimate);
CREATE INDEX IF NOT EXISTS idx_couples_venue_name ON couples(venue_name);
CREATE INDEX IF NOT EXISTS idx_couples_budget_total ON couples(budget_total);

-- Set reasonable defaults
UPDATE couples SET 
  guest_count_estimate = 100 WHERE guest_count_estimate IS NULL,
  budget_total = 30000 WHERE budget_total IS NULL,
  wedding_style = 'traditional' WHERE wedding_style IS NULL;

-- Ensure onboarding can complete
ALTER TABLE couples ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
UPDATE couples SET onboarding_completed = true WHERE onboarding_completed IS NULL;