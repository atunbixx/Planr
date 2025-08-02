// Debug script to test dashboard authentication state
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gpfxxbhowailwllpgphe.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODMyMTIsImV4cCI6MjA2ODQ1OTIxMn0.FMY9ABxdunqpLk-smoVRYycqdRoTIF8I9dDgJ0bZl-c'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDashboardAuth() {
  console.log('🔍 Testing dashboard authentication state...')
  
  try {
    // Test 1: Check current session
    console.log('\n1. Checking current session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
      return
    }
    
    if (!session) {
      console.log('❌ No active session found')
      
      // Try to sign in first
      console.log('\n2. Attempting to sign in...')
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'hello@atunbi.net',
        password: 'Teniola=1'
      })
      
      if (authError) {
        console.error('❌ Sign-in failed:', authError.message)
        return
      }
      
      console.log('✅ Sign-in successful!')
      console.log('👤 User ID:', authData.user.id)
      
      // Check session again
      const { data: { session: newSession } } = await supabase.auth.getSession()
      if (newSession) {
        console.log('✅ Session established after sign-in')
      }
    } else {
      console.log('✅ Active session found')
      console.log('👤 User ID:', session.user.id)
      console.log('📧 Email:', session.user.email)
    }
    
    // Test 2: Check couple data
    console.log('\n3. Checking couple data...')
    const currentSession = session || (await supabase.auth.getSession()).data.session
    
    if (currentSession) {
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .eq('partner1_user_id', currentSession.user.id)
        .single()
      
      if (coupleError) {
        if (coupleError.code === 'PGRST116') {
          console.log('❌ No couple data found - user should be redirected to onboarding')
        } else {
          console.error('❌ Error fetching couple data:', coupleError.message)
        }
      } else {
        console.log('✅ Couple data found!')
        console.log('👫 Partners:', coupleData.partner1_name, coupleData.partner2_name)
        console.log('📅 Wedding date:', coupleData.wedding_date)
        console.log('🏛️ Venue:', coupleData.venue_name)
        console.log('💰 Budget:', coupleData.budget_total)
      }
    }
    
    // Test 3: Simulate auth context behavior
    console.log('\n4. Simulating AuthContext behavior...')
    
    // This simulates what happens when the dashboard loads
    let authLoading = true
    let authUser = null
    let authCouple = null
    
    console.log('Initial state: loading =', authLoading, ', user =', !!authUser, ', couple =', !!authCouple)
    
    // Simulate auth initialization
    setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      authUser = session?.user || null
      
      if (authUser) {
        const { data: coupleData } = await supabase
          .from('couples')
          .select('*')
          .eq('partner1_user_id', authUser.id)
          .single()
        authCouple = coupleData || null
      }
      
      authLoading = false
      
      console.log('After initialization: loading =', authLoading, ', user =', !!authUser, ', couple =', !!authCouple)
      
      // This is what the dashboard layout checks
      if (!authLoading && !authUser) {
        console.log('🔄 Dashboard would redirect to sign-in')
      } else if (!authLoading && authUser && !authCouple) {
        console.log('🔄 Dashboard would redirect to onboarding')
      } else if (!authLoading && authUser && authCouple) {
        console.log('✅ Dashboard would load successfully')
      } else {
        console.log('⏳ Dashboard would show loading state')
      }
    }, 100)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testDashboardAuth()