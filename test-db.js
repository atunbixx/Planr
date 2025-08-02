// Simple database connection test
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gpfxxbhowailwllpgphe.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODMyMTIsImV4cCI6MjA2ODQ1OTIxMn0.FMY9ABxdunqpLk-smoVRYycqdRoTIF8I9dDgJ0bZl-c'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    // Test basic connection
    console.log('Testing Supabase connection...')
    
    // Check if couples table exists and get its structure
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_info', { table_name: 'couples' })
      .catch(() => null)
    
    if (tablesError) {
      console.log('RPC not available, trying direct query...')
    }
    
    // Try to query the couples table structure
    const { data, error } = await supabase
      .from('couples')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Couples table error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('Couples table accessible, sample data:', data)
    }
    
    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Current auth user:', user ? user.id : 'Not authenticated')
    if (authError) {
      console.log('Auth error:', authError.message)
    }
    
  } catch (err) {
    console.error('Connection test error:', err)
  }
}

testConnection()