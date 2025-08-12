import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as readline from 'readline'

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function promptForEmail(): Promise<string> {
  return new Promise((resolve) => {
    rl.question('Enter your email address: ', (email) => {
      resolve(email.trim())
    })
  })
}

async function enableSuperAdmin() {
  console.log('🛡️  SuperAdmin Setup Tool')
  console.log('========================\n')
  
  const email = await promptForEmail()
  
  try {
    // Find user by email
    console.log(`\n🔍 Looking for user with email: ${email}...`)
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .single()
    
    if (userError || !user) {
      console.error('❌ User not found with that email.')
      console.log('\nPossible reasons:')
      console.log('1. The email address is incorrect')
      console.log('2. You haven\'t signed up yet')
      console.log('3. The user record wasn\'t created properly')
      
      // Try to list all users
      console.log('\n📋 Listing all users in database:')
      const { data: allUsers, error: listError } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .limit(10)
      
      if (allUsers && allUsers.length > 0) {
        allUsers.forEach((u, i) => {
          console.log(`${i + 1}. ${u.email} (${u.first_name} ${u.last_name})`)
        })
      } else {
        console.log('No users found in database.')
      }
      
      rl.close()
      return
    }
    
    console.log(`✅ Found user: ${user.first_name} ${user.last_name} (${user.email})`)
    console.log(`User ID: ${user.id}`)
    
    // Check current role
    const { data: currentRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (currentRole?.role === 'superAdmin') {
      console.log('\n✅ User already has superAdmin role!')
      console.log(`You can access the SuperAdmin dashboard at: http://localhost:4000/superadmin`)
      rl.close()
      return
    }
    
    // Grant superAdmin role
    console.log('\n🔐 Granting superAdmin role...')
    
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'superAdmin'
      }, {
        onConflict: 'user_id,role'
      })
    
    if (roleError) {
      console.error('❌ Error granting superAdmin role:', roleError)
      rl.close()
      return
    }
    
    console.log('✅ SuperAdmin role granted successfully!')
    
    // Log the action
    await supabase
      .from('audit_events')
      .insert({
        actor_user_id: user.id,
        event_type: 'admin.role.grant',
        event_payload: {
          role: 'superAdmin',
          granted_via: 'setup_script'
        }
      })
    
    console.log('\n🎉 Setup complete!')
    console.log(`You can now access the SuperAdmin dashboard at: http://localhost:4000/superadmin`)
    console.log('\nMake sure you are signed in with the email: ' + email)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  } finally {
    rl.close()
  }
}

// Run the script
enableSuperAdmin()