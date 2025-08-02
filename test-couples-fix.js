const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCouplesFix() {
  console.log('🧪 Testing couples table fix...\n');

  try {
    // Test 1: Check if we can query the couples view
    console.log('📋 Test 1: Query couples view');
    const { data: queryData, error: queryError } = await supabase
      .from('couples')
      .select('*')
      .limit(5);

    if (queryError) {
      console.error('❌ Failed to query couples view:', queryError);
      console.log('   Error code:', queryError.code);
      console.log('   Error message:', queryError.message);
      if (queryError.code === 'PGRST204') {
        console.log('   ℹ️  This error suggests the view doesn\'t exist');
      }
    } else {
      console.log('✅ Successfully queried couples view');
      console.log('   Found', queryData?.length || 0, 'records');
    }

    // Test 2: Check if we can query wedding_couples directly
    console.log('\n📋 Test 2: Query wedding_couples table directly');
    const { data: wcData, error: wcError } = await supabase
      .from('wedding_couples')
      .select('*')
      .limit(5);

    if (wcError) {
      console.error('❌ Failed to query wedding_couples:', wcError);
    } else {
      console.log('✅ Successfully queried wedding_couples table');
      console.log('   Found', wcData?.length || 0, 'records');
    }

    // Test 3: Test insert operation (without auth - will fail due to RLS)
    console.log('\n📋 Test 3: Test insert operation (expected to fail due to RLS)');
    const testData = {
      partner1_user_id: 'test-' + Date.now(),
      partner1_name: 'Test Partner 1',
      partner2_name: 'Test Partner 2',
      wedding_date: '2025-12-31',
      venue_name: 'Test Venue',
      venue_location: 'Test City, Test State',
      guest_count: 150,
      total_budget: 75000,
      wedding_style: 'modern'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('couples')
      .insert(testData)
      .select();

    if (insertError) {
      if (insertError.code === '42501' || insertError.message.includes('row-level security')) {
        console.log('✅ Insert correctly blocked by RLS (expected behavior)');
      } else if (insertError.code === 'PGRST406') {
        console.error('❌ Got 406 error - the view may not be properly configured for inserts');
        console.log('   Error details:', insertError);
      } else {
        console.error('❌ Unexpected insert error:', insertError);
      }
    } else {
      console.log('⚠️  Insert succeeded without auth (unexpected - check RLS policies)');
    }

    // Test 4: Check table structure
    console.log('\n📋 Test 4: Check table structure');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { 
        table_name: 'wedding_couples',
        table_schema: 'public'
      });

    if (columnsError) {
      // Try alternative approach
      console.log('   Trying alternative approach to get columns...');
      const { data: sampleData } = await supabase
        .from('wedding_couples')
        .select('*')
        .limit(1);
      
      if (sampleData && sampleData.length > 0) {
        console.log('✅ wedding_couples columns:', Object.keys(sampleData[0]));
      }
    } else if (columns) {
      console.log('✅ wedding_couples columns:', columns.map(c => c.column_name).join(', '));
    }

    // Summary
    console.log('\n📊 Test Summary:');
    console.log('----------------------------------------');
    if (!queryError) {
      console.log('✅ couples view is accessible');
      console.log('✅ The 406 error should be resolved');
      console.log('ℹ️  Make sure to run the migrations in Supabase dashboard');
    } else {
      console.log('❌ couples view is not accessible');
      console.log('⚠️  You need to run the migration files in Supabase dashboard:');
      console.log('   1. supabase/migrations/20250802205000_fix_couples_table_reference.sql');
      console.log('   2. supabase/migrations/20250802210000_fix_couples_view_insert.sql');
    }

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Function to show how to manually fix in Supabase dashboard
function showManualInstructions() {
  console.log('\n📝 Manual Fix Instructions:');
  console.log('========================================');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Run these migrations in order:');
  console.log('   - supabase/migrations/20250802205000_fix_couples_table_reference.sql');
  console.log('   - supabase/migrations/20250802210000_fix_couples_view_insert.sql');
  console.log('4. After running, test your authentication flow again');
  console.log('========================================\n');
}

// Run tests
async function main() {
  await testCouplesFix();
  showManualInstructions();
}

main();