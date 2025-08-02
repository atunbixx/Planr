// Debug script to trace the complete login flow
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gpfxxbhowailwllpgphe.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODMyMTIsImV4cCI6MjA2ODQ1OTIxMn0.FMY9ABxdunqpLk-smoVRYycqdRoTIF8I9dDgJ0bZl-c'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugLoginFlow() {
  console.log('🔍 Debugging complete login flow...')
  
  try {
    // Step 1: Clear any existing session
    console.log('\n1. Clearing existing session...')
    await supabase.auth.signOut()
    
    // Step 2: Check initial state
    console.log('\n2. Checking initial state...')
    const { data: { session: initialSession } } = await supabase.auth.getSession()
    console.log('Initial session:', initialSession ? 'EXISTS' : 'NONE')
    
    // Step 3: Simulate login
    console.log('\n3. Simulating login...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'hello@atunbi.net',
      password: 'Teniola=1'
    })
    
    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }
    
    console.log('✅ Login successful!')
    console.log('👤 User ID:', authData.user.id)
    
    // Step 4: Check session immediately after login
    console.log('\n4. Checking session immediately after login...')
    const { data: { session: postLoginSession } } = await supabase.auth.getSession()
    console.log('Post-login session:', postLoginSession ? 'EXISTS' : 'NONE')
    
    if (postLoginSession) {
      console.log('Session user ID:', postLoginSession.user.id)
      console.log('Session expires at:', new Date(postLoginSession.expires_at * 1000))
    }
    
    // Step 5: Check couple data
    console.log('\n5. Checking couple data...')
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('*')
      .eq('partner1_user_id', authData.user.id)
      .single()
    
    if (coupleError) {
      if (coupleError.code === 'PGRST116') {
        console.log('❌ No couple data found')
      } else {
        console.error('❌ Error fetching couple:', coupleError.message)
      }
    } else {
      console.log('✅ Couple data found!')
      console.log('Couple ID:', coupleData.id)
      console.log('Partners:', coupleData.partner1_name, coupleData.partner2_name)
    }
    
    // Step 6: Simulate what happens when dashboard loads
    console.log('\n6. Simulating dashboard load sequence...')
    
    // This is what the AuthContext does on initialization
    console.log('AuthContext initialization...')
    
    // Small delay like in the updated code
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const { data: { session: dashboardSession } } = await supabase.auth.getSession()
    console.log('Dashboard session check:', dashboardSession ? 'EXISTS' : 'NONE')
    
    if (dashboardSession) {
      console.log('Dashboard user ID:', dashboardSession.user.id)
      
      // Try to get couple data like AuthContext does
      const { data: dashboardCouple, error: dashboardCoupleError } = await supabase
        .from('couples')
        .select('*')
        .eq('partner1_user_id', dashboardSession.user.id)
        .single()
      
      if (dashboardCoupleError) {
        console.log('❌ Dashboard couple fetch failed:', dashboardCoupleError.message)
      } else {
        console.log('✅ Dashboard couple data loaded')
      }
      
      // Simulate the dashboard layout logic
      const loading = false
      const user = dashboardSession.user
      const couple = dashboardCouple
      
      console.log('\nDashboard state simulation:')
      console.log('- loading:', loading)
      console.log('- user:', !!user)
      console.log('- couple:', !!couple)
      
      if (loading) {
        console.log('🔄 Dashboard would show loading')
      } else if (!user) {
        console.log('🔄 Dashboard would redirect to sign-in')
      } else if (!couple) {
        console.log('🔄 Dashboard would redirect to onboarding')
      } else {
        console.log('✅ Dashboard would load successfully')
      }
    }
    
    // Step 7: Test auth state change listener behavior
    console.log('\n7. Testing auth state change behavior...')
    
    let authStateChanges = 0
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      authStateChanges++
      console.log(`Auth state change #${authStateChanges}:`, event, session ? 'HAS_SESSION' : 'NO_SESSION')
    })
    
    // Wait a bit to see if there are any auth state changes
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('Total auth state changes detected:', authStateChanges)
    
    subscription.unsubscribe()
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

debugLoginFlow()