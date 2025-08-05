const { Client } = require('pg')

async function testPoolerSSLFixed() {
  // Test with proper SSL configuration for Supabase
  const client = new Client({
    connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    ssl: {
      rejectUnauthorized: false  // Accept self-signed certs for Supabase
    }
  })

  try {
    console.log('🔍 Testing pooler with SSL fix...')
    
    await client.connect()
    console.log('✅ Connection successful!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
    
    // Test existing tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    console.log('✅ Found tables:', tables.rows.map(r => r.table_name))
    
    console.log('🎉 Perfect! This works!')
    
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

testPoolerSSLFixed()