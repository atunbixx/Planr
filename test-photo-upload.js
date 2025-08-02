const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create a simple test image (1x1 transparent PNG)
function createTestImage() {
  // This is a base64 encoded 1x1 transparent PNG
  const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return Buffer.from(base64Image, 'base64');
}

async function testPhotoUpload() {
  console.log('🔍 Testing Photo Upload System...\n');

  try {
    // 1. Create test image
    console.log('1. Creating test image...');
    const imageBuffer = createTestImage();
    const fileName = `test-upload-${Date.now()}.png`;
    console.log('✅ Test image created');

    // 2. Upload to storage
    console.log('\n2. Uploading to storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wedding-photos')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      return;
    }

    console.log('✅ Upload successful');
    console.log('   Path:', uploadData.path);

    // 3. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('wedding-photos')
      .getPublicUrl(uploadData.path);

    console.log('   Public URL:', publicUrl);

    // 4. Test database insert
    console.log('\n3. Testing database insert...');
    
    // First, check if we have a test couple
    const { data: couples, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .limit(1);

    if (coupleError || !couples || couples.length === 0) {
      console.log('⚠️  No test couple found, skipping database test');
    } else {
      const coupleId = couples[0].id;
      console.log('   Using couple ID:', coupleId);

      const { data: photoData, error: photoError } = await supabase
        .from('photos')
        .insert({
          couple_id: coupleId,
          image_url: publicUrl,
          caption: 'Test photo upload',
          tags: ['test', 'automated'],
          photo_date: new Date().toISOString(),
          photographer: 'Test Script',
          location: 'Test Location'
        })
        .select()
        .single();

      if (photoError) {
        console.error('❌ Database insert failed:', photoError);
        
        // Check if it's a column error
        if (photoError.message.includes('column')) {
          console.log('\n⚠️  Database schema mismatch detected!');
          console.log('   Run this migration in Supabase SQL Editor:');
          console.log('   supabase/migrations/20250802200000_fix_photos_table_schema.sql');
        }
      } else {
        console.log('✅ Database insert successful');
        console.log('   Photo ID:', photoData.id);

        // Clean up - delete from database
        const { error: deleteDbError } = await supabase
          .from('photos')
          .delete()
          .eq('id', photoData.id);

        if (!deleteDbError) {
          console.log('✅ Database record cleaned up');
        }
      }
    }

    // 5. Clean up storage
    console.log('\n4. Cleaning up...');
    const { error: deleteError } = await supabase.storage
      .from('wedding-photos')
      .remove([uploadData.path]);

    if (deleteError) {
      console.error('⚠️  Could not delete test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }

    console.log('\n✅ Photo upload test complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testPhotoUpload();