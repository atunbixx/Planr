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

// Development user credentials
const DEV_USER = {
  email: 'dev@wedding-planner.com',
  password: 'DevPassword123!',
  fullName: 'Dev User',
  partnerName: 'Test Partner'
}

async function createDevUser() {
  console.log('🚀 Creating development user...')
  
  try {
    // First, try to sign in with existing user
    console.log('📝 Attempting to sign in with existing user...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: DEV_USER.email,
      password: DEV_USER.password,
    })
    
    if (!signInError && signInData.user) {
      console.log('✅ Successfully signed in existing user')
      return { user: signInData.user, isNew: false }
    }
    
    // If sign in failed, try to create new user
    console.log('📝 Creating new auth user...')
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: DEV_USER.email,
      password: DEV_USER.password,
      options: {
        data: {
          full_name: DEV_USER.fullName,
          partner_name: DEV_USER.partnerName,
        },
        emailRedirectTo: undefined, // Disable email confirmation for development
      },
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('⚠️  User already exists but cannot sign in')
        console.log('🔧 This might be due to email confirmation requirements')
        console.log('\n💡 To fix this:')
        console.log('1. Go to your Supabase dashboard')
        console.log('2. Navigate to Authentication > Users')
        console.log('3. Find the user: ' + DEV_USER.email)
        console.log('4. Click "Confirm Email" if needed')
        console.log('\nAlternatively, disable email confirmations in Supabase:')
        console.log('1. Go to Authentication > Settings')
        console.log('2. Under "Email Auth", disable "Confirm email"')
        process.exit(1)
      }
      throw signUpError
    }

    console.log('✅ Auth user created:', authData.user?.email)
    
    // For development, we'll use the user from signup directly
    if (authData.user) {
      console.log('⚠️  Note: Email confirmation may be required.')
      console.log('    If you cannot sign in, check Supabase dashboard.')
      return { user: authData.user, isNew: true }
    }
    
    throw new Error('User creation succeeded but no user returned')
    
  } catch (error) {
    console.error('❌ Error creating dev user:', error.message)
    throw error
  }
}

async function createCoupleProfile(userId) {
  console.log('👫 Creating couple profile...')
  
  try {
    // Check if couple already exists
    const { data: existingCouple, error: checkError } = await supabase
      .from('couples')
      .select('*')
      .or(`partner1_user_id.eq.${userId},partner2_user_id.eq.${userId}`)
      .single()
    
    if (existingCouple) {
      console.log('✅ Couple profile already exists')
      return existingCouple
    }
    
    // Create new couple profile with correct column names
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert({
        partner1_user_id: userId,
        partner1_name: DEV_USER.fullName,
        partner2_name: DEV_USER.partnerName,
        wedding_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        guest_count_estimate: 150,
        venue_name: 'The Grand Ballroom',
        venue_location: 'New York, NY',
        budget_total: 50000,
        wedding_style: 'romantic',
        onboarding_completed: true,
      })
      .select()
      .single()
    
    if (coupleError) {
      throw coupleError
    }
    
    console.log('✅ Couple profile created')
    return couple
    
  } catch (error) {
    console.error('❌ Error creating couple profile:', error.message)
    throw error
  }
}

async function main() {
  console.log('🔧 Setting up development environment...\n')
  
  try {
    // Create user
    const { user, isNew } = await createDevUser()
    
    if (!user) {
      throw new Error('Failed to create or sign in user')
    }
    
    // Create couple profile
    await createCoupleProfile(user.id)
    
    console.log('\n✨ Development user setup complete!\n')
    console.log('📧 Email:', DEV_USER.email)
    console.log('🔑 Password:', DEV_USER.password)
    console.log('\n👉 You can now sign in at http://localhost:3000/auth/signin')
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Run the script
main()