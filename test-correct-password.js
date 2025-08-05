const { Client } = require('pg')

async function testCorrectPassword() {
  const client = new Client({
    connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@db.gpfxxbhowailwllpgphe.supabase.co:5432/postgres"
  })

  try {
    console.log('🔍 Testing connection with CORRECT password...')
    await client.connect()
    console.log('✅ Connected successfully!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `)
    console.log('✅ Found tables:', tables.rows.map(r => r.table_name))
    
    console.log('🎉 Database connection is working perfectly!')
    
  } catch (error) {
    console.error('❌ Connection failed:')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
  } finally {
    await client.end()
  }
}

testCorrectPassword()