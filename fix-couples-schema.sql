-- Fix couples table schema - add missing partner_id column
-- Run this in Supabase SQL Editor BEFORE running guest-schema.sql

-- Add partner_id column to couples table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'couples' AND column_name = 'partner_id'
    ) THEN
        ALTER TABLE couples ADD COLUMN partner_id UUID REFERENCES users(id);
        
        -- Update the column comment
        COMMENT ON COLUMN couples.partner_id IS 'Reference to the partner user (optional)';
        
        PRINT 'Added partner_id column to couples table';
    ELSE
        PRINT 'partner_id column already exists in couples table';
    END IF;
END $$;

-- Verify the couples table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'couples' 
ORDER BY ordinal_position;