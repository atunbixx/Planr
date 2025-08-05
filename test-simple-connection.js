const { Client } = require('pg')

async function testSimpleConnection() {
  // Test with minimal connection string
  const client = new Client({
    host: 'aws-0-eu-north-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.gpfxxbhowailwllpgphe',
    password: 'vM2Pn1lCaKsQrnCh',
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('🔍 Testing simple connection...')
    await client.connect()
    console.log('✅ Connected successfully!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version)
    
    // Test creating a simple table
    console.log('🔍 Testing table creation...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Table creation successful!')
    
    await client.query('DROP TABLE test_connection')
    console.log('✅ Table cleanup successful!')
    
    console.log('🎉 Database is fully functional!')
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.error('Error code:', error.code)
  } finally {
    await client.end()
  }
}

testSimpleConnection()