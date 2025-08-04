// Check current database schema
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gpfxxbhowailwllpgphe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODMyMTIsImV4cCI6MjA2ODQ1OTIxMn0.FMY9ABxdunqpLk-smoVRYycqdRoTIF8I9dDgJ0bZl-c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('Current Database Schema:\n')
  
  // Get all tables using direct SQL query
  const { data: tables, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
  })
  
  if (error) {
    console.error('Error fetching tables:', error)
    return
  }
  
  console.log('Available Tables:')
  tables.forEach(table => {
    console.log(`- ${table.table_name}`)
  })
  
  // Check specific tables we're interested in
  const targetTables = ['users', 'couples', 'budget_items', 'budget_categories', 'vendors', 'guests']
  
  for (const tableName of targetTables) {
    console.log(`\n=== ${tableName.toUpperCase()} TABLE ===`)
    
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .order('ordinal_position')
    
    if (columnError) {
      console.log(`Table ${tableName} does not exist or error: ${columnError.message}`)
    } else if (columns.length === 0) {
      console.log(`Table ${tableName} does not exist`)
    } else {
      console.log('Columns:')
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`)
      })
    }
  }
}

checkSchema()