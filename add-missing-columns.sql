-- Add missing columns to couples table if they don't exist
-- Run this in Supabase SQL Editor

-- First, drop the old partner_name column if it exists
ALTER TABLE couples 
DROP COLUMN IF EXISTS partner_name;

-- Add the new columns
ALTER TABLE couples 
ADD COLUMN IF NOT EXISTS partner1_name VARCHAR,
ADD COLUMN IF NOT EXISTS partner2_name VARCHAR,
ADD COLUMN IF NOT EXISTS wedding_style VARCHAR,
ADD COLUMN IF NOT EXISTS guest_count_estimate INTEGER,
ADD COLUMN IF NOT EXISTS budget_total DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'couples' AND table_schema = 'public'
ORDER BY ordinal_position;