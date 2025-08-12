import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create admin client that bypasses RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

async function forceGrantSuperAdmin() {
  console.log('🛡️  Force Grant SuperAdmin (Bypassing RLS)')
  console.log('==========================================\n')
  
  const email = 'atunbi1@gmail.com'
  
  try {
    // First get the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (userError || !user) {
      console.error('❌ User not found:', userError)
      return
    }
    
    console.log('✅ Found user:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.first_name} ${user.last_name}`)
    
    // Try using RPC to bypass RLS
    console.log('\n🔐 Attempting to grant superAdmin role...')
    
    // First, let's disable RLS temporarily (if we have permissions)
    try {
      // Use raw SQL via RPC if available
      const { data, error } = await supabase.rpc('grant_superadmin_role', {
        target_user_id: user.id
      })
      
      if (error) {
        console.log('ℹ️  RPC function not available, trying direct insert...')
        
        // Try direct insert with service role key (should bypass RLS)
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role: 'superAdmin',
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,role',
            ignoreDuplicates: false
          })
          .select()
        
        if (roleError) {
          console.error('❌ Direct insert failed:', roleError)
          
          // Last resort - try without specifying conflict resolution
          const { error: simpleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'superAdmin'
            })
          
          if (simpleError) {
            console.error('❌ Simple insert also failed:', simpleError)
            
            console.log('\n💡 The issue appears to be at the database level.')
            console.log('Please run this SQL directly in the Supabase SQL editor:')
            console.log('\n-- Disable RLS temporarily')
            console.log('ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;')
            console.log('\n-- Insert the role')
            console.log(`INSERT INTO user_roles (user_id, role) VALUES ('${user.id}', 'superAdmin');`)
            console.log('\n-- Re-enable RLS')
            console.log('ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;')
            return
          }
        }
        
        console.log('✅ Role granted successfully!')
      } else {
        console.log('✅ Role granted via RPC!')
      }
    } catch (e) {
      console.error('❌ Operation failed:', e)
    }
    
    // Verify the role was granted
    const { data: checkRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (checkRole && checkRole.role === 'superAdmin') {
      console.log('\n🎉 Success! SuperAdmin role confirmed!')
      console.log(`You can now access: http://localhost:4000/superadmin`)
      console.log(`Sign in with: ${email}`)
    } else {
      console.log('\n⚠️  Role assignment may have failed. Please check manually.')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
forceGrantSuperAdmin()