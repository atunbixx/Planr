import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkUserConsistency() {
  console.log('🔍 Checking user data consistency...\n')
  
  const email = 'atunbi1@gmail.com'
  
  try {
    // Check in users table
    console.log('1. Checking users table...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (userError) {
      console.log('❌ Error in users table:', userError)
    } else if (user) {
      console.log('✅ Found in users table:')
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Supabase User ID: ${user.supabase_user_id}`)
    }
    
    // Check in auth.users (Supabase Auth)
    console.log('\n2. Checking Supabase Auth...')
    const { data: authUsers, error: authError } = await supabase
      .rpc('get_auth_users', { email_filter: email })
      .single()
    
    if (authError) {
      console.log('ℹ️  Cannot access auth.users directly (this is normal)')
      
      // Try alternative approach - check if we can find by supabase_user_id
      if (user && user.supabase_user_id) {
        console.log(`   User has supabase_user_id: ${user.supabase_user_id}`)
      }
    } else if (authUsers) {
      console.log('✅ Found in Supabase Auth:')
      console.log(`   Auth ID: ${authUsers.id}`)
    }
    
    // Check for any existing roles
    console.log('\n3. Checking existing roles...')
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
    
    if (roles && roles.length > 0) {
      console.log(`✅ Found ${roles.length} total role assignments`)
      const userRole = roles.find(r => r.user_id === user?.id)
      if (userRole) {
        console.log(`   User has role: ${userRole.role}`)
      } else {
        console.log('   User has no role assigned')
      }
    } else {
      console.log('ℹ️  No roles assigned to any users yet')
    }
    
    // Suggest fix
    console.log('\n💡 Suggested fix:')
    if (user && user.supabase_user_id) {
      console.log('The user exists in the users table. The issue might be:')
      console.log('1. The user_roles table expects the users.id (UUID)')
      console.log(`2. Your user ID is: ${user.id}`)
      console.log('\nTry running this SQL directly in Supabase:')
      console.log(`INSERT INTO user_roles (user_id, role) VALUES ('${user.id}', 'superAdmin') ON CONFLICT (user_id, role) DO UPDATE SET role = 'superAdmin';`)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
checkUserConsistency()