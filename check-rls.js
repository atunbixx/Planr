const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gpfxxbhowailwllpgphe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODMyMTIsImV4cCI6MjA2ODQ1OTIxMn0.FMY9ABxdunqpLk-smoVRYycqdRoTIF8I9dDgJ0bZl-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSAndAuth() {
  console.log('🔍 Checking authentication and RLS policies...\n');

  try {
    // Test 1: Anonymous access to couples table
    console.log('1️⃣ Testing anonymous access to couples table...');
    const { data: anonCouples, error: anonError } = await supabase
      .from('couples')
      .select('id')
      .limit(1);

    if (anonError) {
      console.log('❌ Anonymous access failed:', anonError.message);
    } else {
      console.log('✅ Anonymous access successful:', anonCouples?.length || 0, 'records');
    }

    // Test 2: Sign in and test authenticated access
    console.log('\n2️⃣ Testing authenticated access...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'hello@atunbi.net',
      password: 'Teniola=1'
    });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful for:', authData.user.email);

    // Test 3: Authenticated access to couples table
    const { data: authCouples, error: authCouplesError } = await supabase
      .from('couples')
      .select('*')
      .or(`partner1_user_id.eq.${authData.user.id},partner2_user_id.eq.${authData.user.id}`)
      .single();

    if (authCouplesError && authCouplesError.code !== 'PGRST116') {
      console.log('❌ Authenticated couples access failed:', authCouplesError.message);
    } else if (authCouples) {
      console.log('✅ Authenticated couples access successful:', authCouples.id);
    } else {
      console.log('⚠️ No couple record found for user');
    }

    // Test 4: Test other tables
    console.log('\n3️⃣ Testing other table access...');
    const tables = ['vendors', 'guests', 'tasks', 'timeline_items'];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}:`, error.message);
      } else {
        console.log(`✅ ${table}:`, data?.length || 0, 'records accessible');
      }
    }

    // Test 5: Check session info
    console.log('\n4️⃣ Session information:');
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('✅ Session active:', {
        user_id: session.user.id,
        email: session.user.email,
        expires_at: new Date(session.expires_at * 1000).toLocaleString()
      });
    } else {
      console.log('❌ No active session');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

checkRLSAndAuth();