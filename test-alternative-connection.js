const { Client } = require('pg')

async function testAlternativeConnections() {
  // Try different hostname formats that Supabase might use
  const connectionOptions = [
    {
      name: 'Connection pooler (transaction mode)',
      connectionString: "postgresql://postgres.gpfxxbhowailwllpgphe:vM2Pn1lCaKsQrnCh@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
    },
    {
      name: 'Connection pooler (session mode)', 
      connectionString: "postgresql://postgres.gpfxxbhowailwllpgphe:vM2Pn1lCaKsQrnCh@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
    },
    {
      name: 'Alternative db format',
      connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@gpfxxbhowailwllpgphe.supabase.co:5432/postgres"
    },
    {
      name: 'IPv4 direct (from REST API)',
      connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@104.18.38.10:5432/postgres"
    }
  ]

  for (const option of connectionOptions) {
    console.log(`\n🔍 Testing: ${option.name}`)
    console.log(`Connection: ${option.connectionString.replace(/:[^:@]*@/, ':****@')}`)
    
    const client = new Client({
      connectionString: option.connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    })

    try {
      await client.connect()
      console.log('✅ Connected successfully!')
      
      const result = await client.query('SELECT version()')
      console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
      
      console.log('🎉 This connection works!')
      return option
      
    } catch (error) {
      console.error('❌ Failed:', error.message)
      if (error.code) {
        console.error('   Code:', error.code)
      }
    } finally {
      try {
        await client.end()
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
  
  console.log('\n❌ All connection attempts failed')
  return null
}

testAlternativeConnections()
  .then(result => {
    if (result) {
      console.log('\n🎉 SUCCESS! Use this connection string:')
      console.log(result.connectionString)
    }
  })
  .catch(console.error)