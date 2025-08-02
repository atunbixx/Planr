const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCouplesTableIssue() {
  console.log('🔧 Starting to fix couples table reference issue...\n');

  try {
    // First, check if wedding_couples table exists
    console.log('📋 Checking if wedding_couples table exists...');
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['wedding_couples', 'couples']);

    console.log('Found tables:', tables?.map(t => t.table_name).join(', '));

    // Check if couples view already exists
    const couplesViewExists = tables?.some(t => t.table_name === 'couples');
    const weddingCouplesExists = tables?.some(t => t.table_name === 'wedding_couples');

    if (!weddingCouplesExists) {
      console.error('❌ wedding_couples table does not exist! This is the base table we need.');
      console.log('💡 You may need to run the initial migration first.');
      return;
    }

    // Create the couples view
    console.log('\n📋 Creating couples view to map to wedding_couples...');
    
    const createViewQuery = `
      -- Drop existing view if it exists
      DROP VIEW IF EXISTS couples CASCADE;

      -- Create couples view that maps to wedding_couples
      CREATE VIEW couples AS 
      SELECT 
        id,
        partner1_user_id,
        partner2_user_id,
        partner1_name,
        partner2_name,
        wedding_date,
        venue_name,
        venue_location,
        guest_count_estimate,
        -- Map columns for consistency
        COALESCE(budget_total, 50000.00) as total_budget,
        COALESCE(currency, 'USD') as currency,
        COALESCE(wedding_style, 'traditional') as wedding_style,
        created_at,
        updated_at,
        -- Add computed/default columns that the app expects
        COALESCE(guest_count_estimate, 100) as guest_count,
        NULL::text as partner1_email,
        NULL::text as partner2_email,
        FALSE as onboarding_completed,
        0::numeric as planning_progress,
        FALSE as venue_booked,
        0::numeric as budget_spent
      FROM wedding_couples;
    `;

    const { error: viewError } = await supabase.rpc('exec_sql', { 
      sql: createViewQuery 
    }).single();

    if (viewError) {
      console.log('⚠️  Could not create view using RPC, trying direct approach...');
      
      // If RPC doesn't work, we'll need to inform the user to run the migration manually
      console.log('\n📝 Please run the following SQL in your Supabase SQL editor:');
      console.log('----------------------------------------');
      console.log(createViewQuery);
      console.log('----------------------------------------');
    } else {
      console.log('✅ Couples view created successfully!');
    }

    // Grant permissions
    console.log('\n📋 Setting up permissions...');
    const grantQuery = `
      GRANT ALL ON couples TO authenticated;
      GRANT SELECT ON couples TO anon;
    `;

    const { error: grantError } = await supabase.rpc('exec_sql', { 
      sql: grantQuery 
    }).single();

    if (grantError) {
      console.log('⚠️  Could not grant permissions via RPC');
    }

    // Test the view
    console.log('\n🧪 Testing the couples view...');
    const { data: testData, error: testError } = await supabase
      .from('couples')
      .select('id, partner1_name, partner2_name')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing couples view:', testError);
      console.log('\n💡 You may need to run the migration SQL manually in Supabase dashboard.');
    } else {
      console.log('✅ Couples view is working! Found', testData?.length || 0, 'records');
    }

    // Check if we can insert into the view
    console.log('\n🧪 Testing insert capability...');
    const testUserId = 'test-user-' + Date.now();
    const { error: insertError } = await supabase
      .from('couples')
      .insert({
        partner1_user_id: testUserId,
        partner1_name: 'Test Partner',
        wedding_date: '2025-12-31'
      })
      .select();

    if (insertError) {
      if (insertError.code === '42501') {
        console.log('⚠️  Insert test failed due to RLS policies (expected)');
      } else if (insertError.message.includes('cannot insert into view')) {
        console.log('⚠️  View is read-only. Inserts should go directly to wedding_couples table.');
        console.log('💡 The app may need to be updated to insert into wedding_couples instead of couples.');
      } else {
        console.log('⚠️  Insert test failed:', insertError.message);
      }
    }

    console.log('\n✅ Fix process completed!');
    console.log('\n📋 Summary:');
    console.log('- wedding_couples table exists: ✅');
    console.log('- couples view created: ' + (viewError ? '⚠️  Manual action needed' : '✅'));
    console.log('- View is queryable: ' + (testError ? '❌' : '✅'));
    
    if (viewError) {
      console.log('\n⚠️  IMPORTANT: Please run the migration SQL manually in your Supabase dashboard:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and run the migration from: supabase/migrations/20250802205000_fix_couples_table_reference.sql');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixCouplesTableIssue();