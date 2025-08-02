-- CRITICAL SCHEMA FIXES FOR WEDDING PLANNER v2 (CORRECTED VERSION)
-- Database Schema Specialist Agent - Complete Schema Mismatch Resolution
-- Generated: 2025-08-02 - Based on AuthContext.tsx analysis

-- ========================================
-- EXACT FIELD MAPPING FROM AUTHCONTEXT
-- ========================================
-- The AuthContext expects these exact field names in the insertData:

-- Current AuthContext insertData object uses:
-- - partner1_user_id: user.id,
-- - partner1_name: coupleData.partner1Name,
-- - partner2_name: coupleData.partner2Name || null,
-- - wedding_date: formattedWeddingDate,
-- - venue_name: coupleData.venueName || null,         <-- Uses venue_name, not venue
-- - venue_location: coupleData.venueLocation || null,
-- - guest_count: coupleData.guestCountEstimate || 100, <-- Uses guest_count, not estimated_guests
-- - total_budget: coupleData.budgetTotal || 50000,
-- - wedding_style: coupleData.weddingStyle || 'traditional',

-- ========================================
-- SCHEMA MISMATCHES IDENTIFIED
-- ========================================

-- MISSING COLUMNS (found in database inspection):
-- ❌ Field 'partner1_email': ERROR - column couples.partner1_email does not exist
-- ❌ Field 'partner2_email': ERROR - column couples.partner2_email does not exist  
-- ❌ Field 'estimated_guests': ERROR - column couples.estimated_guests does not exist (but AuthContext uses 'guest_count')
-- ❌ Field 'venue': ERROR - column couples.venue does not exist (but AuthContext uses 'venue_name')
-- ❌ Field 'onboarding_completed': ERROR - column couples.onboarding_completed does not exist

-- EXISTING COLUMNS (verified in database):
-- ✅ Field 'partner1_name': EXISTS
-- ✅ Field 'partner2_name': EXISTS  
-- ✅ Field 'partner1_user_id': EXISTS
-- ✅ Field 'partner2_user_id': EXISTS
-- ✅ Field 'total_budget': EXISTS
-- ✅ Field 'wedding_date': EXISTS

-- ========================================
-- CORRECTED SCHEMA ADDITIONS
-- ========================================

-- 1. Add venue_name (not venue) - matches AuthContext
ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_name TEXT;

-- 2. Add venue_location - matches AuthContext
ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_location TEXT;

-- 3. Add guest_count (not estimated_guests) - matches AuthContext  
ALTER TABLE couples ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 100;

-- 4. Add wedding_style - matches AuthContext
ALTER TABLE couples ADD COLUMN IF NOT EXISTS wedding_style TEXT DEFAULT 'traditional';

-- 5. Add partner email fields - referenced in onboarding
ALTER TABLE couples ADD COLUMN IF NOT EXISTS partner1_email TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS partner2_email TEXT;

-- 6. Add onboarding completion tracking
ALTER TABLE couples ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- ========================================
-- ADDITIONAL USEFUL COLUMNS
-- ========================================
-- Add some additional columns that would be useful based on the generated types

-- Planning progress tracking
ALTER TABLE couples ADD COLUMN IF NOT EXISTS planning_progress NUMERIC DEFAULT 0 CHECK (planning_progress >= 0 AND planning_progress <= 100);

-- Venue booking status
ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_booked BOOLEAN DEFAULT FALSE;

-- Guest count tracking (estimated vs confirmed)
ALTER TABLE couples ADD COLUMN IF NOT EXISTS estimated_guests INTEGER 
  GENERATED ALWAYS AS (COALESCE(guest_count, 100)) STORED;

-- Budget tracking
ALTER TABLE couples ADD COLUMN IF NOT EXISTS budget_spent NUMERIC DEFAULT 0;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS budget_remaining NUMERIC 
  GENERATED ALWAYS AS (COALESCE(total_budget, 0) - COALESCE(budget_spent, 0)) STORED;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- User lookup indexes
CREATE INDEX IF NOT EXISTS idx_couples_partner1_user_id ON couples(partner1_user_id);
CREATE INDEX IF NOT EXISTS idx_couples_partner2_user_id ON couples(partner2_user_id);

-- Common query indexes
CREATE INDEX IF NOT EXISTS idx_couples_wedding_date ON couples(wedding_date);
CREATE INDEX IF NOT EXISTS idx_couples_onboarding_completed ON couples(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_couples_venue_name ON couples(venue_name);

-- ========================================
-- UPDATE EXISTING DATA WITH DEFAULTS
-- ========================================

-- Set onboarding as completed for existing couples (they must have completed it to exist)
UPDATE couples 
SET onboarding_completed = TRUE 
WHERE onboarding_completed IS NULL;

-- Set default wedding style for existing couples
UPDATE couples 
SET wedding_style = 'traditional' 
WHERE wedding_style IS NULL;

-- Set default guest count if not set
UPDATE couples 
SET guest_count = 100 
WHERE guest_count IS NULL;

-- ========================================
-- VERIFY SCHEMA CHANGES
-- ========================================

-- Query to show all columns in couples table after changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'couples' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- TEST COUPLE CREATION QUERY
-- ========================================
-- This query should now work without errors:

/*
INSERT INTO couples (
  partner1_user_id,
  partner1_name, 
  partner2_name,
  partner1_email,
  partner2_email,
  wedding_date,
  venue_name,
  venue_location,
  guest_count,
  total_budget,
  wedding_style,
  onboarding_completed
) VALUES (
  auth.uid(),  -- Will be replaced with actual user ID
  'Test Partner 1',
  'Test Partner 2', 
  'test1@example.com',
  'test2@example.com',
  '2024-12-31',
  'Test Venue',
  'Test Location',
  100,
  50000,
  'traditional',
  true
) RETURNING *;
*/

-- ========================================
-- NOTES FOR IMPLEMENTATION
-- ========================================
-- 1. This script addresses the exact schema mismatches found
-- 2. Field names now match exactly what AuthContext expects
-- 3. All INSERT operations from the frontend should now work
-- 4. Backwards compatible - existing data is preserved
-- 5. Run this in Supabase SQL Editor to fix the schema issues