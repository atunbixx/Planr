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

async function seedSuperAdmin() {
  console.log('🌱 Seeding SuperAdmin user...')
  
  // Replace this with your actual user ID
  // You can find it in Supabase Auth dashboard or by querying the users table
  const USER_ID = 'YOUR_USER_ID_HERE'
  
  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', USER_ID)
      .single()
    
    if (userError || !user) {
      console.error('❌ User not found. Please update USER_ID in the script.')
      console.log('To find your user ID:')
      console.log('1. Go to Supabase dashboard → Authentication → Users')
      console.log('2. Find your email and copy the User UID')
      console.log('3. Update USER_ID in this script')
      return
    }
    
    console.log(`Found user: ${user.email}`)
    
    // Grant superAdmin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: USER_ID,
        role: 'superAdmin'
      }, {
        onConflict: 'user_id,role'
      })
    
    if (roleError) {
      console.error('❌ Error granting superAdmin role:', roleError)
      return
    }
    
    console.log('✅ SuperAdmin role granted successfully!')
    
    // Create some sample data for testing
    console.log('\n🌱 Creating sample data...')
    
    // Add some test plans if they don't exist
    const plans = [
      { id: 'free', name: 'Free', price_cents: 0, interval: 'month', features: { guests: 50, photos: 100, vendors: 5 } },
      { id: 'basic', name: 'Basic', price_cents: 999, interval: 'month', features: { guests: 200, photos: 500, vendors: 20 } },
      { id: 'premium', name: 'Premium', price_cents: 2999, interval: 'month', features: { guests: 500, photos: 2000, vendors: -1 } },
      { id: 'enterprise', name: 'Enterprise', price_cents: 9999, interval: 'month', features: { guests: -1, photos: -1, vendors: -1 } }
    ]
    
    for (const plan of plans) {
      await supabase
        .from('plans')
        .upsert(plan, { onConflict: 'id' })
    }
    
    console.log('✅ Sample plans created')
    
    // Add some usage data for today
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('usage_daily')
      .upsert({
        day: today,
        user_id: USER_ID,
        files_uploaded: 5,
        storage_bytes: 1024 * 1024 * 50, // 50MB
        api_calls: 100,
        active_minutes: 30,
        guests_added: 10,
        invites_sent: 5,
        rsvps_received: 3
      }, {
        onConflict: 'day,user_id'
      })
    
    console.log('✅ Sample usage data created')
    
    console.log('\n🎉 Setup complete!')
    console.log(`You can now access the SuperAdmin dashboard at: http://localhost:4000/superadmin`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
seedSuperAdmin()