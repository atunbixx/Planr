// Setup Supabase database connection and create user
// Clear system environment variable
delete process.env.DATABASE_URL

// Load environment with override
require('dotenv').config({ path: '.env.local', override: true })

const { createClient } = require('@supabase/supabase-js')

async function setupSupabaseDatabase() {
  try {
    console.log('🚀 Setting up Supabase database connection...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase URL or key')
    }
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Using anon key:', supabaseKey.substring(0, 20) + '...')
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('\n🔍 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.log('📝 Users table does not exist yet, this is expected for a new setup')
      console.log('Error details:', error.message)
    } else {
      console.log('✅ Found users table with', data, 'records')
    }
    
    // Try to create a test user if users table exists
    console.log('\n🧪 Testing user creation...')
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          clerk_user_id: 'test_user_' + Date.now(),
          email: 'test@weddingplanner.com',
          first_name: 'Test',
          last_name: 'User',
          phone: '+1234567890'
        }
      ])
      .select()
    
    if (createError) {
      console.log('❌ Could not create user (table may not exist):', createError.message)
      console.log('\n🛠️  Next step: Run Prisma migrations to create database schema')
    } else {
      console.log('✅ Successfully created test user:', newUser)
    }
    
    console.log('\n🎉 Supabase connection test completed!')
    
  } catch (error) {
    console.error('❌ Supabase setup failed:')
    console.error('Error:', error.message)
  }
}

setupSupabaseDatabase()