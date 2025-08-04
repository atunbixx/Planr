// Check what data is actually in the database
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gpfxxbhowailwllpgphe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODMyMTIsImV4cCI6MjA2ODQ1OTIxMn0.FMY9ABxdunqpLk-smoVRYycqdRoTIF8I9dDgJ0bZl-c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('Checking database data...\n')
  
  // Get all users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (usersError) {
    console.error('Error fetching users:', usersError)
  } else {
    console.log('Recent Users:')
    users.forEach(user => {
      console.log(`- ${user.clerk_user_id}: ${user.first_name} ${user.last_name || ''} (${user.email})`)
    })
  }
  
  // Get all couples
  const { data: couples, error: couplesError } = await supabase
    .from('couples')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
    
  if (couplesError) {
    console.error('\nError fetching couples:', couplesError)
  } else {
    console.log('\nRecent Couples:')
    couples.forEach(couple => {
      console.log(`- ${couple.partner1_name} & ${couple.partner2_name || 'N/A'}`)
      console.log(`  Wedding: ${couple.wedding_date || 'Not set'} at ${couple.venue_name || 'Not set'}`)
      console.log(`  Guests: ${couple.guest_count_estimate || 'Not set'}, Budget: $${couple.budget_total || 'Not set'}`)
      console.log(`  Onboarding: ${couple.onboarding_completed ? 'Completed' : 'Not completed'}`)
      console.log('')
    })
  }
}

checkData()