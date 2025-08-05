const { Client } = require('pg')

async function testPostgresPooler() {
  // Test original postgres user with correct pooler hostname
  const client = new Client({
    connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔍 Testing postgres user with pooler hostname...')
    console.log('Host: aws-0-us-east-1.pooler.supabase.com')
    
    await client.connect()
    console.log('✅ SUCCESS! Postgres user with pooler works!')
    
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
    
    console.log('🎉 PERFECT! This connection works!')
    console.log('\nUpdate .env with:')
    console.log('DIRECT_URL="postgresql://postgres:vM2Pn1lCaKsQrnCh@aws-0-us-east-1.pooler.supabase.com:5432/postgres"')
    console.log('DATABASE_URL="postgresql://postgres:vM2Pn1lCaKsQrnCh@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"')
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.error('Code:', error.code)
  } finally {
    try {
      await client.end()
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

testPostgresPooler()