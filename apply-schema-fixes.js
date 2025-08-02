#!/usr/bin/env node

// Schema Fix Application Script
// Database Schema Specialist Agent - Automated Schema Repair
// Generated: 2025-08-02

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Schema fixes as individual statements
const schemaFixes = [
  // Essential columns for AuthContext compatibility
  "ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_name TEXT;",
  "ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_location TEXT;", 
  "ALTER TABLE couples ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 100;",
  "ALTER TABLE couples ADD COLUMN IF NOT EXISTS wedding_style TEXT DEFAULT 'traditional';",
  
  // Additional columns referenced in frontend
  "ALTER TABLE couples ADD COLUMN IF NOT EXISTS partner1_email TEXT;",
  "ALTER TABLE couples ADD COLUMN IF NOT EXISTS partner2_email TEXT;",
  "ALTER TABLE couples ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;",
  
  // Useful computed and tracking columns
  "ALTER TABLE couples ADD COLUMN IF NOT EXISTS planning_progress NUMERIC DEFAULT 0 CHECK (planning_progress >= 0 AND planning_progress <= 100);",
  "ALTER TABLE couples ADD COLUMN IF NOT EXISTS venue_booked BOOLEAN DEFAULT FALSE;",
  "ALTER TABLE couples ADD COLUMN IF NOT EXISTS budget_spent NUMERIC DEFAULT 0;"
];

// Test data that should work after fixes
const testCoupleData = {
  partner1_name: 'Test Partner 1',
  partner2_name: 'Test Partner 2',
  partner1_email: 'test1@example.com',
  partner2_email: 'test2@example.com',
  wedding_date: '2024-12-31',
  venue_name: 'Test Venue',
  venue_location: 'Test Location',
  guest_count: 100,
  total_budget: 50000,
  wedding_style: 'traditional',
  onboarding_completed: true
};

async function applySchemaFixes() {
  console.log('🔧 APPLYING SCHEMA FIXES TO SUPABASE DATABASE');
  console.log('==============================================\n');

  try {
    // Test connection first
    console.log('📡 Testing database connection...');
    const { data: connectionTest, error: connError } = await supabase
      .from('couples')
      .select('count')
      .limit(1);
    
    if (connError) {
      console.error('❌ Connection failed:', connError.message);
      return false;
    }
    console.log('✅ Database connection successful!\n');

    // Check current schema before fixes
    console.log('🔍 Checking current schema before fixes...');
    const fieldsToCheck = [
      'venue_name', 'venue_location', 'guest_count', 'wedding_style',
      'partner1_email', 'partner2_email', 'onboarding_completed'
    ];

    const schemaBeforeIssues = [];
    for (const field of fieldsToCheck) {
      try {
        const { error } = await supabase
          .from('couples')
          .select(field)
          .limit(1);
        
        if (error) {
          schemaBeforeIssues.push(`❌ ${field}: ${error.message}`);
        } else {
          console.log(`✅ ${field}: EXISTS`);
        }
      } catch (err) {
        schemaBeforeIssues.push(`❌ ${field}: ${err.message}`);
      }
    }

    if (schemaBeforeIssues.length > 0) {
      console.log('\n⚠️ Schema issues found:');
      schemaBeforeIssues.forEach(issue => console.log(`   ${issue}`));
      console.log('');
    }

    // Apply schema fixes using RPC (if available) or direct execution
    console.log('🛠️ Applying schema fixes...');
    
    // Try to apply fixes using a single RPC call (more efficient)
    const schemaFixSQL = schemaFixes.join('\n');
    console.log('📝 Executing schema fixes via RPC...');

    try {
      // Try using RPC to execute the schema changes
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('exec_sql', { sql: schemaFixSQL });

      if (rpcError) {
        console.log('⚠️ RPC method not available, applying fixes individually...');
        
        // Fallback: we can't directly execute DDL through the JavaScript client
        // This would need to be run in the Supabase SQL Editor
        console.log('\n📋 MANUAL STEPS REQUIRED:');
        console.log('=============================');
        console.log('The schema fixes need to be applied manually in the Supabase SQL Editor.');
        console.log('Please copy and paste the following SQL commands:\n');
        
        schemaFixes.forEach((fix, index) => {
          console.log(`${index + 1}. ${fix}`);
        });

        console.log('\n🔗 To apply these fixes:');
        console.log('1. Go to https://supabase.com/dashboard/project');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Create a new query');
        console.log('4. Copy and paste the schema fixes above');
        console.log('5. Run the query');
        console.log('6. Run this script again to verify the fixes\n');

        return false;
      } else {
        console.log('✅ Schema fixes applied successfully via RPC!');
      }
    } catch (err) {
      console.log('⚠️ Direct execution not possible from client. Manual intervention required.');
      console.log('\nPlease run the schema-fix-corrected.sql file in Supabase SQL Editor.\n');
      return false;
    }

    // Verify schema fixes
    console.log('🔍 Verifying schema fixes...');
    let allFixesSuccessful = true;
    
    for (const field of fieldsToCheck) {
      try {
        const { error } = await supabase
          .from('couples')
          .select(field)
          .limit(1);
        
        if (error) {
          console.log(`❌ ${field}: Still missing - ${error.message}`);
          allFixesSuccessful = false;
        } else {
          console.log(`✅ ${field}: Fixed successfully`);
        }
      } catch (err) {
        console.log(`❌ ${field}: Error - ${err.message}`);
        allFixesSuccessful = false;
      }
    }

    if (!allFixesSuccessful) {
      console.log('\n⚠️ Some schema fixes were not applied successfully.');
      console.log('Please run the SQL fixes manually in Supabase SQL Editor.');
      return false;
    }

    // Test couple creation with new schema
    console.log('\n🧪 Testing couple creation with corrected schema...');
    try {
      const { data: insertTest, error: insertError } = await supabase
        .from('couples')
        .insert(testCoupleData)
        .select()
        .single();

      if (insertError) {
        console.log('❌ Test insert still failing:');
        console.log(`   Code: ${insertError.code}`);
        console.log(`   Message: ${insertError.message}`);
        console.log(`   Details: ${insertError.details}`);
        console.log(`   Hint: ${insertError.hint}`);
        return false;
      } else {
        console.log('✅ Test couple creation successful!');
        console.log(`   Created couple ID: ${insertTest.id}`);
        
        // Clean up test record
        await supabase.from('couples').delete().eq('id', insertTest.id);
        console.log('✅ Test record cleaned up');
      }
    } catch (err) {
      console.log(`❌ Test insert exception: ${err.message}`);
      return false;
    }

    // Display final schema
    console.log('\n📋 FINAL SCHEMA VERIFICATION:');
    console.log('=============================');
    
    // Get sample record to show available fields
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('couples')
      .select('*')
      .limit(1);

    if (sampleRecord && sampleRecord.length > 0) {
      console.log('Available columns:');
      Object.keys(sampleRecord[0]).forEach(col => {
        console.log(`  - ${col}`);
      });
    } else {
      console.log('No existing records to verify schema with, but DDL operations completed.');
    }

    console.log('\n✅ ALL SCHEMA FIXES APPLIED SUCCESSFULLY!');
    console.log('🎉 Authentication and CRUD operations should now work correctly.');
    
    return true;

  } catch (error) {
    console.error('💥 CRITICAL ERROR during schema fix application:', error);
    return false;
  }
}

// Run the schema fixes
applySchemaFixes().then(success => {
  if (success) {
    console.log('\n🎊 Schema fixes completed successfully!');
    console.log('You can now test user registration and authentication.');
  } else {
    console.log('\n⚠️ Schema fixes need manual intervention.');
    console.log('Please apply the SQL fixes in Supabase SQL Editor.');
  }
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('💥 SCHEMA FIX SCRIPT FAILED:', err);
  process.exit(1);
});