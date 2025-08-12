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

async function grantSuperAdmin() {
  console.log('🛡️  Direct SuperAdmin Grant')
  console.log('==========================\n')
  
  const email = 'atunbi1@gmail.com'
  const userId = 'a0a857fb-3291-4860-855b-f61e1f0c0cd7'
  
  try {
    console.log(`Granting superAdmin role to ${email}...`)
    console.log(`User ID: ${userId}\n`)
    
    // First, let's check if the user_roles table has the correct foreign key
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (existingRole) {
      console.log('ℹ️  User already has a role:', existingRole.role)
      
      if (existingRole.role === 'superAdmin') {
        console.log('✅ User already has superAdmin role!')
        return
      }
      
      // Update existing role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: 'superAdmin' })
        .eq('user_id', userId)
      
      if (updateError) {
        console.error('❌ Error updating role:', updateError)
        return
      }
      
      console.log('✅ Updated role to superAdmin!')
    } else {
      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'superAdmin'
        })
      
      if (insertError) {
        console.error('❌ Error inserting role:', insertError)
        
        // If foreign key error, let's try to understand why
        if (insertError.code === '23503') {
          console.log('\n🔍 Checking foreign key constraint...')
          
          // Verify user exists
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single()
          
          if (userError || !user) {
            console.log('❌ User not found in users table with that ID')
            console.log('This might be a database schema issue.')
          } else {
            console.log('✅ User exists in users table')
            console.log('❌ But foreign key constraint still fails')
            console.log('\nPossible issues:')
            console.log('1. The user_roles table might reference a different schema')
            console.log('2. There might be RLS policies blocking the insertion')
          }
        }
        return
      }
      
      console.log('✅ SuperAdmin role granted successfully!')
    }
    
    // Log the action
    await supabase
      .from('audit_events')
      .insert({
        actor_user_id: userId,
        event_type: 'admin.role.grant',
        event_payload: {
          role: 'superAdmin',
          granted_via: 'direct_script'
        }
      })
    
    console.log('\n🎉 Setup complete!')
    console.log(`You can now access the SuperAdmin dashboard at: http://localhost:4000/superadmin`)
    console.log(`Make sure you are signed in with: ${email}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
grantSuperAdmin()