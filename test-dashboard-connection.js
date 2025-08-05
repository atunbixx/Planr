const { Client } = require('pg')

async function testDashboardConnection() {
  // Exact connection string from Supabase dashboard
  const client = new Client({
    connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@db.gpfxxbhowailwllpgphe.supabase.co:5432/postgres?sslmode=require"
  })

  try {
    console.log('🔍 Testing exact connection string from Supabase dashboard...')
    console.log('Connection: postgresql://postgres:****@db.gpfxxbhowailwllpgphe.supabase.co:5432/postgres?sslmode=require')
    
    await client.connect()
    console.log('✅ Connected successfully!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
    
    // Test if we can see existing tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    console.log('✅ Found tables:', tables.rows.map(r => r.table_name))
    
    console.log('🎉 Dashboard connection string works perfectly!')
    
  } catch (error) {
    console.error('❌ Dashboard connection failed:')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 DNS resolution still failing.')
      console.log('This might be a temporary DNS issue or regional routing problem.')
      console.log('Let\'s try some workarounds...')
      
      // Try forcing IPv4
      console.log('\n🔍 Trying to force IPv4 resolution...')
      const dns = require('dns')
      dns.lookup('db.gpfxxbhowailwllpgphe.supabase.co', { family: 4 }, (err, address) => {
        if (err) {
          console.error('❌ IPv4 lookup failed:', err.message)
        } else {
          console.log('✅ IPv4 address:', address)
        }
      })
    }
  } finally {
    try {
      await client.end()
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

testDashboardConnection()