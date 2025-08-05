const { Client } = require('pg')

async function testDirectSupabase() {
  const client = new Client({
    connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@db.gpfxxbhowailwllpgphe.supabase.co:5432/postgres"
  })

  try {
    console.log('🔍 Testing direct Supabase connection...')
    await client.connect()
    console.log('✅ Connected successfully!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
    
    // Test if we can query tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `)
    console.log('✅ Found tables:', tables.rows.map(r => r.table_name))
    
    console.log('🎉 Direct connection works perfectly!')
    
  } catch (error) {
    console.error('❌ Direct connection failed:')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    if (error.code === '28P01') {
      console.error('💡 This is an authentication failure - password might be wrong')
    }
  } finally {
    await client.end()
  }
}

testDirectSupabase()