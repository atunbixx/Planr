#!/usr/bin/env node

/**
 * Simple Schema Fix Script
 * Uses direct database queries to add missing columns
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAndFixSchema() {
  console.log('🔍 Checking current couples table structure...\n')
  
  try {
    // Test if the missing columns exist by trying to query them
    const { data, error } = await supabase
      .from('couples')
      .select('guest_count_estimate, venue_name, venue_location, budget_total, wedding_style, onboarding_completed')
      .limit(1)
    
    if (error) {
      console.log('❌ Missing columns detected:', error.message)
      console.log('\n🚨 SCHEMA FIX REQUIRED')
      console.log('\nPlease run this SQL in your Supabase Dashboard → SQL Editor:')
      console.log('\n' + '='.repeat(60))
      console.log(`
-- Add missing columns for frontend compatibility
ALTER TABLE couples ADD COLUMN IF NOT EXISTS guest_count_estimate INTEGER;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_name TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_location TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS budget_total NUMERIC;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS wedding_style TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Copy data from existing columns where possible
UPDATE couples SET 
  guest_count_estimate = COALESCE(guest_count_estimate, estimated_guests, 100),
  venue_name = COALESCE(venue_name, venue),
  budget_total = COALESCE(budget_total, total_budget, 30000),
  wedding_style = COALESCE(wedding_style, planning_style, 'traditional'),
  onboarding_completed = COALESCE(onboarding_completed, true)
WHERE guest_count_estimate IS NULL OR venue_name IS NULL OR budget_total IS NULL OR wedding_style IS NULL OR onboarding_completed IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_couples_guest_count_estimate ON couples(guest_count_estimate);
CREATE INDEX IF NOT EXISTS idx_couples_venue_name ON couples(venue_name);
CREATE INDEX IF NOT EXISTS idx_couples_budget_total ON couples(budget_total);
`)
      console.log('='.repeat(60))
      console.log('\n📍 Go to: https://supabase.com/dashboard/project/gpfxxbhowailwllpgphe/sql')
      console.log('\n⚡ After running the SQL, your authentication will work properly!')
      
    } else {
      console.log('✅ All required columns exist! Schema is compatible.')
      console.log('\n🎉 You can now test authentication:')
      console.log('   → Run: npm run setup:dev-user')
      console.log('   → Then sign in at: http://localhost:4002/auth/signin')
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message)
  }
}

checkAndFixSchema()