const { Client } = require('pg')

async function testIPv6Connection() {
  // Test with IPv6 address found by host command
  const client = new Client({
    connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@[2a05:d016:571:a40b:9965:5131:dcf6:1881]:5432/postgres",
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔍 Testing IPv6 connection...')
    await client.connect()
    console.log('✅ IPv6 connection successful!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
    
    console.log('🎉 IPv6 connection works!')
    console.log('\nUpdate your .env to use IPv6:')
    console.log('DATABASE_URL="postgresql://postgres:vM2Pn1lCaKsQrnCh@[2a05:d016:571:a40b:9965:5131:dcf6:1881]:6543/postgres?pgbouncer=true"')
    console.log('DIRECT_URL="postgresql://postgres:vM2Pn1lCaKsQrnCh@[2a05:d016:571:a40b:9965:5131:dcf6:1881]:5432/postgres"')
    
  } catch (error) {
    console.error('❌ IPv6 connection failed:', error.message)
    console.error('Code:', error.code)
    
    // Also test if hostname resolves differently now
    console.log('\n🔍 Testing hostname again...')
    const client2 = new Client({
      connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@db.gpfxxbhowailwllpgphe.supabase.co:5432/postgres"
    })
    
    try {
      await client2.connect()
      console.log('✅ Hostname connection now works!')
    } catch (error2) {
      console.error('❌ Hostname still fails:', error2.message)
    } finally {
      try {
        await client2.end()
      } catch (e) {}
    }
  } finally {
    try {
      await client.end()
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

testIPv6Connection()