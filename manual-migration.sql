-- Manual Database Migration for Wedding Planner Settings Features
-- Run this SQL in your Supabase SQL editor or database client

-- ============================================
-- 1. Add preferences field to users table
-- ============================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferences" JSONB;

-- ============================================
-- 2. Add new fields to guests table
-- ============================================

-- Add address field
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "address" TEXT;

-- Add plus one name field
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "plusOneName" TEXT;

-- Add attending count field
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "attendingCount" INTEGER DEFAULT 0;

-- Add invitation sent timestamp
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "invitationSentAt" TIMESTAMP(3);

-- Add RSVP deadline
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "rsvpDeadline" TIMESTAMP(3);

-- ============================================
-- 3. Handle column renames (run these carefully)
-- ============================================

-- First check if the old columns exist, then rename them
-- If plusOne column exists, rename it to plusOneAllowed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'guests' AND column_name = 'plusOne'
    ) THEN
        ALTER TABLE "guests" RENAME COLUMN "plusOne" TO "plusOneAllowed";
    ELSE
        -- If column doesn't exist, add the new one
        ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "plusOneAllowed" BOOLEAN DEFAULT false;
    END IF;
END $$;

-- If dietaryNotes column exists, rename it to dietaryRestrictions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'guests' AND column_name = 'dietaryNotes'
    ) THEN
        ALTER TABLE "guests" RENAME COLUMN "dietaryNotes" TO "dietaryRestrictions";
    ELSE
        -- If column doesn't exist, add the new one
        ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "dietaryRestrictions" TEXT;
    END IF;
END $$;

-- ============================================
-- 4. Update existing data with default values
-- ============================================

-- Set attendingCount to 0 for any existing records that don't have it set
UPDATE "guests" SET "attendingCount" = 0 WHERE "attendingCount" IS NULL;

-- Make attendingCount NOT NULL after setting defaults
ALTER TABLE "guests" ALTER COLUMN "attendingCount" SET NOT NULL;

-- ============================================
-- 5. Verification queries (optional - run to check results)
-- ============================================

-- Check users table has preferences column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'preferences';

-- Check guests table has all new columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'guests' 
AND column_name IN (
    'address', 
    'plusOneAllowed', 
    'plusOneName', 
    'attendingCount', 
    'invitationSentAt', 
    'rsvpDeadline', 
    'dietaryRestrictions'
)
ORDER BY column_name;

-- Count existing guests to verify data integrity
SELECT COUNT(*) as total_guests FROM "guests";