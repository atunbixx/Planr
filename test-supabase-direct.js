// Test direct Supabase connection to verify credentials
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gpfxxbhowailwllpgphe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODMyMTIsImV4cCI6MjA2ODQ1OTIxMn0.FMY9ABxdunqpLk-smoVRYycqdRoTIF8I9dDgJ0bZl-c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('Testing Supabase connection...\n')
  
  // Test users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1)
  
  if (usersError) {
    console.error('Error fetching users:', usersError)
  } else {
    console.log('✅ Users table accessible')
    console.log('Sample user:', users[0])
  }
  
  // Test couples table  
  const { data: couples, error: couplesError } = await supabase
    .from('couples')
    .select('*')
    .limit(1)
    
  if (couplesError) {
    console.error('Error fetching couples:', couplesError)
  } else {
    console.log('\n✅ Couples table accessible')
    console.log('Sample couple:', couples[0])
  }
  
  console.log('\n✅ Supabase connection working!')
}

test()