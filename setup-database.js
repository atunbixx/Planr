const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://gpfxxbhowailwllpgphe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODMyMTIsImV4cCI6MjA2ODQ1OTIxMn0.FMY9ABxdunqpLk-smoVRYycqdRoTIF8I9dDgJ0bZl-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🔧 Setting up database schema...');
  
  try {
    // First, let's check if we can create the couples table directly
    console.log('📋 Creating couples table...');
    
    const createCouplesTable = `
      CREATE TABLE IF NOT EXISTS couples (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          partner1_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          partner2_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          partner1_name VARCHAR(100) NOT NULL,
          partner2_name VARCHAR(100),
          wedding_date DATE,
          venue_name VARCHAR(200),
          venue_location VARCHAR(200),
          guest_count_estimate INTEGER DEFAULT 100,
          total_budget DECIMAL(10,2) DEFAULT 50000.00,
          currency VARCHAR(3) DEFAULT 'USD',
          wedding_style VARCHAR(50) DEFAULT 'traditional',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createCouplesTable 
    });
    
    if (createError) {
      console.log('❌ Cannot create table with RPC, trying direct approach...');
      console.log('Error:', createError.message);
      
      // Try a simpler approach - just create a basic couples table
      console.log('📋 Trying to create couples table with basic SQL...');
      
      // Since we can't execute DDL with the anon key, let's create a couple record
      // for the existing user using a workaround
      console.log('🔐 Signing in to get user ID...');
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'hello@atunbi.net',
        password: 'Teniola=1'
      });
      
      if (authError) {
        console.log('❌ Auth failed:', authError.message);
        return;
      }
      
      console.log('✅ Signed in successfully');
      console.log('User ID:', authData.user.id);
      
      // Since we can't create the table, let's check if there's another way
      console.log('💡 The database schema needs to be applied through Supabase Dashboard');
      console.log('');
      console.log('📋 MANUAL SETUP REQUIRED:');
      console.log('1. Go to https://supabase.com/dashboard/project/gpfxxbhowailwllpgphe');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the following SQL:');
      console.log('');
      console.log('-- Create couples table');
      console.log(createCouplesTable);
      console.log('');
      console.log('-- Enable RLS');
      console.log('ALTER TABLE couples ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('-- Create RLS policy');
      console.log(`CREATE POLICY couples_access ON couples
          FOR ALL USING (
              partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
          );`);
      console.log('');
      console.log('-- Grant permissions');
      console.log('GRANT ALL ON couples TO authenticated;');
      console.log('');
      console.log('4. After running the SQL, create a couple record:');
      console.log(`INSERT INTO couples (partner1_user_id, partner1_name, partner2_name, wedding_date, venue_name, venue_location, guest_count_estimate, total_budget, wedding_style)
VALUES (
    '${authData.user.id}',
    'Sarah Johnson',
    'Michael Chen',
    '2025-06-15',
    'The Grand Ballroom',
    'New York, NY',
    150,
    50000.00,
    'romantic'
);`);
      
    } else {
      console.log('✅ Couples table created successfully!');
      
      // Now create a couple record for the user
      console.log('👫 Creating couple record...');
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'hello@atunbi.net',
        password: 'Teniola=1'
      });
      
      if (authError) {
        console.log('❌ Auth failed:', authError.message);
        return;
      }
      
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .insert({
          partner1_user_id: authData.user.id,
          partner1_name: 'Sarah Johnson',
          partner2_name: 'Michael Chen',
          wedding_date: '2025-06-15',
          venue_name: 'The Grand Ballroom',
          venue_location: 'New York, NY',
          guest_count_estimate: 150,
          total_budget: 50000.00,
          wedding_style: 'romantic'
        })
        .select()
        .single();
      
      if (coupleError) {
        console.log('❌ Failed to create couple record:', coupleError.message);
      } else {
        console.log('✅ Couple record created successfully!');
        console.log('Couple ID:', coupleData.id);
      }
    }
    
  } catch (err) {
    console.log('❌ Setup failed:', err.message);
  }
}

setupDatabase();