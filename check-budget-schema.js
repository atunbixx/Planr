// Check budget table schemas
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gpfxxbhowailwllpgphe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODMyMTIsImV4cCI6MjA2ODQ1OTIxMn0.FMY9ABxdunqpLk-smoVRYycqdRoTIF8I9dDgJ0bZl-c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBudgetTables() {
  console.log('Budget-related table structures:\n')
  
  // Check budget_categories
  console.log('=== BUDGET_CATEGORIES ===')
  const { data: categories } = await supabase
    .from('budget_categories')
    .select('*')
    .limit(5)
  
  console.log('Sample data:', categories)
  
  // Check budget_items
  console.log('\n=== BUDGET_ITEMS ===')
  const { data: items, error: itemsError } = await supabase
    .from('budget_items')
    .select('*')
    .limit(5)
  
  if (itemsError) {
    console.log('Error:', itemsError.message)
  } else {
    console.log('Sample data:', items)
  }
  
  // Check vendors
  console.log('\n=== VENDORS ===')
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select('*')
    .limit(5)
  
  if (vendorsError) {
    console.log('Error:', vendorsError.message)
  } else {
    console.log('Sample data:', vendors)
  }
  
  // Check expenses
  console.log('\n=== EXPENSES ===')
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .limit(5)
  
  if (expensesError) {
    console.log('Error:', expensesError.message)
  } else {
    console.log('Sample data:', expenses)
  }
}

checkBudgetTables()