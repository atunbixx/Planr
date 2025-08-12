import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env.local file')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function listUsers() {
  console.log('📋 Listing all users in database')
  console.log('================================\n')
  
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching users:', error)
      return
    }
    
    if (!users || users.length === 0) {
      console.log('No users found in the database.')
      console.log('\nMake sure you have:')
      console.log('1. Created an account through the sign-up page')
      console.log('2. The database migrations have been run')
      return
    }
    
    console.log(`Found ${users.length} user(s):\n`)
    
    for (const user of users) {
      console.log(`ID: ${user.id}`)
      console.log(`Email: ${user.email}`)
      console.log(`Name: ${user.first_name} ${user.last_name}`)
      console.log(`Created: ${new Date(user.created_at).toLocaleString()}`)
      
      // Check if user has any role
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      if (role) {
        console.log(`Role: ${role.role} ✅`)
      } else {
        console.log(`Role: none`)
      }
      
      console.log('---')
    }
    
    console.log('\nTo grant superAdmin access to a user, run:')
    console.log('npm run seed:superadmin')
    console.log('Or use the enable-superadmin script with the user\'s email')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
listUsers()