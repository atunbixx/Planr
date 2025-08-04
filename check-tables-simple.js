// Simple check of existing tables
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gpfxxbhowailwllpgphe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODMyMTIsImV4cCI6MjA2ODQ1OTIxMn0.FMY9ABxdunqpLk-smoVRYycqdRoTIF8I9dDgJ0bZl-c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('Checking existing tables...\n')
  
  const tablesToCheck = ['users', 'couples', 'budget_items', 'budget_categories', 'vendors', 'guests', 'expenses']
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: exists (${data ? data.length : 0} sample rows)`)
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`)
    }
  }
}

checkTables()