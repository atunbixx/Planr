#!/usr/bin/env node

// Direct database schema inspection script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  console.log('🔍 SUPABASE DATABASE SCHEMA INSPECTION');
  console.log('=====================================\n');

  try {
    // 1. Test basic connection
    console.log('📡 Testing connection...');
    const { data: connectionTest, error: connError } = await supabase
      .from('couples')
      .select('count')
      .limit(1);
    
    if (connError) {
      console.error('❌ Connection failed:', connError.message);
      return;
    }
    console.log('✅ Connection successful!\n');

    // 2. Get actual couples table structure by introspecting with a failed query
    console.log('🔍 COUPLES TABLE STRUCTURE:');
    console.log('============================');
    
    // Try to select a non-existent column to get column info from error
    const { data: introspect, error: introError } = await supabase
      .from('couples')
      .select('*')
      .limit(1);

    if (introspect && introspect.length > 0) {
      console.log('✅ Sample couples record:');
      console.log(JSON.stringify(introspect[0], null, 2));
      
      console.log('\n📋 Available columns in couples table:');
      Object.keys(introspect[0]).forEach(col => {
        const value = introspect[0][col];
        const type = typeof value;
        console.log(`  - ${col}: ${type} (value: ${value})`);
      });
    } else {
      console.log('⚠️ No couples records found, checking table exists...');
    }

    // 3. Test specific fields that are causing issues
    console.log('\n🎯 TESTING SPECIFIC FIELD ACCESS:');
    console.log('=================================');
    
    const fieldsToTest = [
      'partner1_name', 'partner2_name',
      'partner1_email', 'partner2_email', 
      'partner1_user_id', 'partner2_user_id',
      'total_budget', 'estimated_guests',
      'wedding_date', 'venue',
      'onboarding_completed'
    ];

    for (const field of fieldsToTest) {
      try {
        const { data, error } = await supabase
          .from('couples')
          .select(field)
          .limit(1);
        
        if (error) {
          console.log(`❌ Field '${field}': ERROR - ${error.message}`);
        } else {
          console.log(`✅ Field '${field}': EXISTS`);
        }
      } catch (err) {
        console.log(`❌ Field '${field}': EXCEPTION - ${err.message}`);
      }
    }

    // 4. Check auth.users table structure
    console.log('\n👤 AUTH USERS TABLE CHECK:');
    console.log('==========================');
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        console.log('✅ Current user found:');
        console.log(`  - ID: ${user.user.id}`);
        console.log(`  - Email: ${user.user.email}`);
        console.log(`  - Created: ${user.user.created_at}`);
      } else {
        console.log('⚠️ No authenticated user');
      }
    } catch (err) {
      console.log(`❌ Auth check failed: ${err.message}`);
    }

    // 5. Test couple creation query format
    console.log('\n🧪 TEST COUPLE CREATION FORMAT:');
    console.log('===============================');
    
    const testCoupleData = {
      partner1_name: 'Test Partner 1',
      partner2_name: 'Test Partner 2',
      partner1_email: 'test1@example.com',
      partner2_email: 'test2@example.com',
      total_budget: 50000,
      estimated_guests: 100,
      wedding_date: '2024-12-31',
      venue: 'Test Venue'
    };

    console.log('🔬 Test data structure:');
    console.log(JSON.stringify(testCoupleData, null, 2));

    // Test insert (dry run - we'll catch the error to see what fails)
    try {
      const { data: insertTest, error: insertError } = await supabase
        .from('couples')
        .insert(testCoupleData)
        .select()
        .single();

      if (insertError) {
        console.log('\n❌ INSERT ERROR DETAILS:');
        console.log(`   Code: ${insertError.code}`);
        console.log(`   Message: ${insertError.message}`);
        console.log(`   Details: ${insertError.details}`);
        console.log(`   Hint: ${insertError.hint}`);
      } else {
        console.log('\n⚠️ INSERT SUCCEEDED (unexpected for test)');
        // Clean up test record
        await supabase.from('couples').delete().eq('id', insertTest.id);
      }
    } catch (err) {
      console.log(`\n❌ INSERT EXCEPTION: ${err.message}`);
    }

  } catch (error) {
    console.error('💥 CRITICAL ERROR:', error);
  }
}

// Run the inspection
inspectSchema().then(() => {
  console.log('\n✅ Schema inspection complete!');
  process.exit(0);
}).catch(err => {
  console.error('💥 INSPECTION FAILED:', err);
  process.exit(1);
});