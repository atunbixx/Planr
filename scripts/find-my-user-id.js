const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function findUsers() {
  console.log('🔍 Finding users in your database...\n')

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('❌ Error fetching users:', error)
      return
    }

    if (!users || users.length === 0) {
      console.log('No users found in the database.')
      return
    }

    console.log('Recent users:\n')
    console.log('ID                                   | Email                          | Name')
    console.log('-'.repeat(100))
    
    users.forEach(user => {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'
      console.log(`${user.id} | ${(user.email || 'N/A').padEnd(30)} | ${name}`)
    })

    console.log('\n📝 To grant superAdmin access:')
    console.log('1. Copy the ID of your user from above')
    console.log('2. Run this SQL in Supabase SQL Editor:')
    console.log(`   INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'superAdmin');`)
    console.log('\nOr update scripts/seed-superadmin.ts with your user ID and run it.')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

findUsers()