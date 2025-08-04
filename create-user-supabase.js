// Create user directly in Supabase using SQL
// Clear system environment variable
delete process.env.DATABASE_URL

// Load environment with override
require('dotenv').config({ path: '.env.local', override: true })

const { createClient } = require('@supabase/supabase-js')

async function createUserInSupabase() {
  try {
    console.log('🚀 Creating user in Supabase database...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase URL or key')
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('🔍 First, let me check if the user already exists...')
    
    // Check for existing test user
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@weddingplanner.com')
    
    if (checkError) {
      console.log('Error checking users:', checkError.message)
    } else if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Test user already exists:', existingUsers[0])
      return existingUsers[0]
    }
    
    console.log('👤 Creating new test user...')
    
    // Create a test user with proper UUID
    const testUser = {
      clerk_user_id: 'user_test_' + Date.now(),
      email: 'test@weddingplanner.com',
      first_name: 'Test',
      last_name: 'User',
      phone: '+1234567890'
    }
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Failed to create user:', createError.message)
      console.error('Full error:', createError)
      
      // Try alternative approach using RPC if available
      console.log('\n🔄 Trying alternative approach...')
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc('get_user_count')
      if (rpcError) {
        console.log('RPC not available:', rpcError.message)
      } else {
        console.log('RPC result:', rpcResult)
      }
      
    } else {
      console.log('✅ Successfully created test user!')
      console.log('User details:', newUser)
      
      // Update todo status
      console.log('\n🎉 Database user creation completed successfully!')
      return newUser
    }
    
  } catch (error) {
    console.error('❌ User creation failed:')
    console.error('Error:', error.message)
  }
}

createUserInSupabase()