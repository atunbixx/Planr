-- Update couples table to include all onboarding fields
-- Run this in Supabase SQL Editor

-- Add missing columns to couples table
ALTER TABLE couples 
ADD COLUMN IF NOT EXISTS partner1_name VARCHAR,
ADD COLUMN IF NOT EXISTS partner2_name VARCHAR,
ADD COLUMN IF NOT EXISTS wedding_style VARCHAR,
ADD COLUMN IF NOT EXISTS guest_count_estimate INTEGER,
ADD COLUMN IF NOT EXISTS budget_total DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create unique constraint on user_id to prevent duplicate couples
CREATE UNIQUE INDEX IF NOT EXISTS couples_user_id_unique 
ON couples (user_id);

-- Add helpful comments
COMMENT ON COLUMN couples.partner1_name IS 'Primary user name from onboarding';
COMMENT ON COLUMN couples.partner2_name IS 'Partner name from onboarding (optional)';
COMMENT ON COLUMN couples.wedding_style IS 'Wedding style preference (modern, traditional, etc.)';
COMMENT ON COLUMN couples.guest_count_estimate IS 'Estimated number of wedding guests';
COMMENT ON COLUMN couples.budget_total IS 'Total wedding budget in dollars';
COMMENT ON COLUMN couples.onboarding_completed IS 'Whether user has completed onboarding flow';

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'couples' AND table_schema = 'public'
ORDER BY ordinal_position;