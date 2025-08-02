const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('🔐 Testing authentication...\n')
  
  try {
    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'hello@atunbi.net',
      password: 'Teniola=1'
    })
    
    if (error) {
      console.error('❌ Sign in failed:', error.message)
      return
    }
    
    console.log('✅ Successfully signed in!')
    console.log('📧 Email:', data.user.email)
    console.log('🆔 User ID:', data.user.id)
    console.log('📅 Created:', new Date(data.user.created_at).toLocaleString())
    
    // Check for couple profile
    const { data: couple, error: coupleError } = await supabase
      .from('wedding_couples')
      .select('*')
      .or(`partner1_user_id.eq.${data.user.id},partner2_user_id.eq.${data.user.id}`)
      .single()
    
    if (couple) {
      console.log('\n👫 Couple Profile Found:')
      console.log('  Partner 1:', couple.partner1_name)
      console.log('  Partner 2:', couple.partner2_name)
      console.log('  Wedding Date:', couple.wedding_date)
      console.log('  Venue:', couple.venue_name)
    } else if (coupleError && coupleError.code === 'PGRST116') {
      console.log('\n⚠️  No couple profile found')
      console.log('The user will be redirected to onboarding')
    } else if (coupleError) {
      console.error('\n❌ Error checking couple profile:', coupleError.message)
    }
    
    // Sign out
    await supabase.auth.signOut()
    console.log('\n✅ Signed out successfully')
    
  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message)
  }
}

// Run the test
testAuth()