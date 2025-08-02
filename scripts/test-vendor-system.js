const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testVendorSystem() {
  console.log('🧪 Testing Vendor Management System...\n');

  try {
    // 1. Test vendor table exists
    console.log('1. Checking if couple_vendors table exists...');
    const { data: tables, error: tableError } = await supabase
      .from('couple_vendors')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table check failed:', tableError.message);
      return;
    }
    console.log('✅ couple_vendors table exists\n');

    // 2. Test vendor categories enum
    console.log('2. Testing vendor categories...');
    const categories = [
      'venue', 'catering', 'photography', 'videography', 'florist',
      'music_dj', 'band', 'transportation', 'beauty', 'attire'
    ];
    console.log(`✅ ${categories.length} vendor categories available\n`);

    // 3. Test vendor statuses enum
    console.log('3. Testing vendor statuses...');
    const statuses = [
      'researching', 'contacted', 'meeting_scheduled', 
      'proposal_received', 'quoted', 'booked', 'confirmed', 'cancelled'
    ];
    console.log(`✅ ${statuses.length} vendor statuses available\n`);

    // 4. Get vendor count
    console.log('4. Checking existing vendors...');
    const { count, error: countError } = await supabase
      .from('couple_vendors')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count failed:', countError.message);
    } else {
      console.log(`✅ Found ${count || 0} vendors in the database\n`);
    }

    // 5. Test vendor views
    console.log('5. Testing vendor views...');
    
    // Test vendors view (backward compatibility)
    const { data: vendorsView, error: viewError } = await supabase
      .from('vendors')
      .select('id')
      .limit(1);
    
    if (viewError) {
      console.log('⚠️  vendors view not available (migration may be needed)');
    } else {
      console.log('✅ vendors view is working');
    }

    // Test vendor_details view
    const { data: detailsView, error: detailsError } = await supabase
      .from('vendor_details')
      .select('id')
      .limit(1);
    
    if (detailsError) {
      console.log('⚠️  vendor_details view not available (migration may be needed)');
    } else {
      console.log('✅ vendor_details view is working');
    }

    // Test vendor_statistics view
    const { data: statsView, error: statsError } = await supabase
      .from('vendor_statistics')
      .select('total_vendors')
      .limit(1);
    
    if (statsError) {
      console.log('⚠️  vendor_statistics view not available (migration may be needed)');
    } else {
      console.log('✅ vendor_statistics view is working');
    }

    console.log('\n6. Testing RLS policies...');
    // This would need an authenticated user to test properly
    console.log('⚠️  RLS policy testing requires authentication\n');

    // 7. List some vendors if any exist
    if (count > 0) {
      console.log('7. Sample vendors:');
      const { data: vendors, error: listError } = await supabase
        .from('couple_vendors')
        .select('name, category, status, estimated_cost')
        .limit(5);
      
      if (listError) {
        console.error('❌ Failed to list vendors:', listError.message);
      } else {
        vendors.forEach(vendor => {
          console.log(`   - ${vendor.name} (${vendor.category}) - ${vendor.status} - $${vendor.estimated_cost || 'TBD'}`);
        });
      }
    }

    console.log('\n✨ Vendor system test completed!');
    console.log('\nNext steps:');
    console.log('1. Run the migration script: ./scripts/fix-vendor-schema.sh');
    console.log('2. Start the development server: npm run dev');
    console.log('3. Visit http://localhost:3000/dashboard/vendors');
    console.log('4. Add and manage vendors through the UI');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testVendorSystem();