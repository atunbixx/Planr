const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStorageConfiguration() {
  console.log('🔍 Testing Supabase Storage Configuration...\n');

  try {
    // 1. Check if the bucket exists
    console.log('1. Checking if wedding-photos bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    const weddingPhotosBucket = buckets?.find(b => b.id === 'wedding-photos');
    
    if (weddingPhotosBucket) {
      console.log('✅ wedding-photos bucket exists');
      console.log('   Public:', weddingPhotosBucket.public);
      console.log('   Created:', new Date(weddingPhotosBucket.created_at).toLocaleString());
    } else {
      console.log('❌ wedding-photos bucket not found');
      console.log('   Available buckets:', buckets?.map(b => b.id).join(', ') || 'none');
      
      // Try to create the bucket
      console.log('\n2. Attempting to create wedding-photos bucket...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('wedding-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError);
      } else {
        console.log('✅ Successfully created wedding-photos bucket');
      }
    }

    // 2. Check RLS policies on storage.objects
    console.log('\n2. Checking storage RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage');

    if (policiesError) {
      console.log('⚠️  Could not check policies (might need admin access)');
    } else {
      console.log(`   Found ${policies?.length || 0} policies for storage.objects`);
      policies?.forEach(policy => {
        console.log(`   - ${policy.policyname}`);
      });
    }

    // 3. Test upload permissions
    console.log('\n3. Testing upload capability...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file for photo storage';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wedding-photos')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
    } else {
      console.log('✅ Upload test successful');
      
      // Test public URL generation
      const { data: { publicUrl } } = supabase.storage
        .from('wedding-photos')
        .getPublicUrl(testFileName);
      
      console.log('   Public URL:', publicUrl);

      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('wedding-photos')
        .remove([testFileName]);
      
      if (deleteError) {
        console.error('⚠️  Could not delete test file:', deleteError.message);
      } else {
        console.log('✅ Test file cleaned up');
      }
    }

    // 4. Check photos table
    console.log('\n4. Checking photos table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'photos');

    if (columnsError) {
      console.log('⚠️  Could not check table structure');
    } else if (!columns || columns.length === 0) {
      console.log('❌ Photos table not found');
    } else {
      console.log('✅ Photos table exists with columns:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });

      // Check for specific required columns
      const requiredColumns = ['image_url', 'photo_date', 'photographer', 'location'];
      const existingColumns = columns.map(c => c.column_name);
      const missingColumns = requiredColumns.filter(rc => !existingColumns.includes(rc));
      
      if (missingColumns.length > 0) {
        console.log('\n⚠️  Missing columns:', missingColumns.join(', '));
        console.log('   Run the migration: 20250802200000_fix_photos_table_schema.sql');
      }
    }

    console.log('\n✅ Storage configuration test complete');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testStorageConfiguration();