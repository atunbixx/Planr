-- Fix couples table to have all required columns
-- Run this in Supabase SQL Editor

-- First check if couples table exists
DO $$
BEGIN
    -- Add missing columns to couples table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'couples' AND column_name = 'partner1_name') THEN
        ALTER TABLE couples ADD COLUMN partner1_name VARCHAR;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'couples' AND column_name = 'partner2_name') THEN
        ALTER TABLE couples ADD COLUMN partner2_name VARCHAR;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'couples' AND column_name = 'wedding_style') THEN
        ALTER TABLE couples ADD COLUMN wedding_style VARCHAR;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'couples' AND column_name = 'guest_count_estimate') THEN
        ALTER TABLE couples ADD COLUMN guest_count_estimate INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'couples' AND column_name = 'budget_total') THEN
        ALTER TABLE couples ADD COLUMN budget_total DECIMAL(12,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'couples' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE couples ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;
END
$$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'couples' AND table_schema = 'public'
ORDER BY ordinal_position;