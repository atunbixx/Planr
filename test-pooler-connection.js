const { Client } = require('pg')

async function testPoolerConnection() {
  // Test the pooler hostname from your environment
  const client = new Client({
    connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
  })

  try {
    console.log('🔍 Testing pooler connection...')
    console.log('Host: aws-0-us-east-1.pooler.supabase.com')
    
    await client.connect()
    console.log('✅ Pooler connection successful!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
    
    // Test existing tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
      LIMIT 10
    `)
    console.log('✅ Found tables:', tables.rows.map(r => r.table_name))
    
    console.log('🎉 The pooler hostname works perfectly!')
    console.log('\nCorrect connection strings:')
    console.log('DIRECT_URL="postgresql://postgres:vM2Pn1lCaKsQrnCh@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"')
    console.log('DATABASE_URL="postgresql://postgres:vM2Pn1lCaKsQrnCh@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"')
    
  } catch (error) {
    console.error('❌ Pooler connection failed:', error.message)
    console.error('Code:', error.code)
  } finally {
    try {
      await client.end()
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

testPoolerConnection()