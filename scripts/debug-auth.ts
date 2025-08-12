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

async function debugAuth() {
  console.log('🔍 Debugging Authentication Flow')
  console.log('================================\n')
  
  const email = 'atunbi1@gmail.com'
  
  try {
    // Step 1: Check in public.users
    console.log('1. Checking public.users table...')
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('id, supabase_user_id, email')
      .eq('email', email)
      .single()
    
    if (publicError) {
      console.log('❌ Error in public.users:', publicError)
      return
    }
    
    console.log('✅ Found in public.users:')
    console.log(`   ID: ${publicUser.id}`)
    console.log(`   Supabase User ID: ${publicUser.supabase_user_id}`)
    console.log(`   Email: ${publicUser.email}`)
    
    // Step 2: Check user_roles with public.users.id
    console.log('\n2. Checking user_roles with public.users.id...')
    const { data: roleByPublicId, error: roleError1 } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', publicUser.id)
      .single()
    
    if (roleError1) {
      console.log('❌ No role found with public.users.id')
    } else {
      console.log('✅ Role found with public.users.id:', roleByPublicId.role)
    }
    
    // Step 3: Check user_roles with supabase_user_id
    console.log('\n3. Checking user_roles with supabase_user_id...')
    const { data: roleByAuthId, error: roleError2 } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', publicUser.supabase_user_id)
      .single()
    
    if (roleError2) {
      console.log('❌ No role found with supabase_user_id')
    } else {
      console.log('✅ Role found with supabase_user_id:', roleByAuthId.role)
    }
    
    // Step 4: Test the getUserRole logic manually
    console.log('\n4. Testing getUserRole logic...')
    const authUserId = publicUser.supabase_user_id
    
    // Simulate what getUserRole does
    const { data: mappedUser, error: mappingError } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_user_id', authUserId)
      .single()
    
    if (mappingError) {
      console.log('❌ Mapping failed:', mappingError)
    } else {
      console.log('✅ Mapping successful:')
      console.log(`   Auth ID: ${authUserId}`)
      console.log(`   Maps to public.users.id: ${mappedUser.id}`)
      
      // Now check for role
      const { data: finalRole, error: finalError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', mappedUser.id)
        .single()
      
      if (finalError) {
        console.log('❌ Final role check failed:', finalError)
      } else {
        console.log('✅ Final role:', finalRole.role)
      }
    }
    
    console.log('\n💡 Summary:')
    if (roleByPublicId) {
      console.log(`✅ Role assignment is correct: ${publicUser.id} -> ${roleByPublicId.role}`)
      console.log('✅ getUserRole mapping should work')
      console.log('\nThe issue might be:')
      console.log('1. Session/cookie issues')
      console.log('2. Middleware not working correctly')
      console.log('3. Cache issues')
    } else {
      console.log('❌ No role assignment found')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
debugAuth()