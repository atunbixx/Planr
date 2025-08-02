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

async function resetDevPassword() {
  console.log('🔧 Resetting development user password...\n')
  
  try {
    // First, try to create a new user
    console.log('📝 Attempting to create new user...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: DEV_USER.email,
      password: DEV_USER.password,
      options: {
        data: {
          full_name: DEV_USER.fullName,
          partner_name: DEV_USER.partnerName,
        },
      },
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('⚠️  User already exists')
        console.log('\n📌 To reset the password for an existing user:')
        console.log('1. Go to your Supabase dashboard:')
        console.log('   https://supabase.com/dashboard/project/gpfxxbhowailwllpgphe/auth/users')
        console.log('2. Find the user: ' + DEV_USER.email)
        console.log('3. Click on the user row')
        console.log('4. Click "Send password reset" or "Update password"')
        console.log('5. Set the new password to: ' + DEV_USER.password)
        console.log('\n🔐 Alternatively, delete the user and run this script again to recreate')
      } else {
        throw signUpError
      }
    } else {
      console.log('✅ New user created successfully!')
      console.log('📧 Email:', DEV_USER.email)
      console.log('🔑 Password:', DEV_USER.password)
      
      // Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: DEV_USER.email,
        password: DEV_USER.password,
      })
      
      if (signInError) {
        console.log('\n⚠️  User created but cannot sign in yet')
        console.log('This might be due to email confirmation requirements')
        console.log('Check your Supabase dashboard to confirm the email')
      } else {
        console.log('✅ Successfully signed in!')
        
        // Create couple profile if needed
        const { data: existingCouple } = await supabase
          .from('wedding_couples')
          .select('*')
          .or(`partner1_user_id.eq.${signInData.user.id},partner2_user_id.eq.${signInData.user.id}`)
          .single()
        
        if (!existingCouple && signInData.user) {
          const { error: coupleError } = await supabase
            .from('wedding_couples')
            .insert({
              partner1_user_id: signInData.user.id,
              partner1_name: DEV_USER.fullName,
              partner2_name: DEV_USER.partnerName,
              wedding_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
              wedding_style: 'romantic',
              guest_count_estimate: 150,
              budget_total: 50000,
              venue_name: 'The Grand Ballroom',
              venue_location: 'New York, NY',
            })
          
          if (coupleError) {
            console.error('Error creating couple profile:', coupleError)
          } else {
            console.log('✅ Couple profile created!')
          }
        }
      }
    }
    
    console.log('\n👉 Try signing in at: http://localhost:3000/dev-login')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
resetDevPassword()