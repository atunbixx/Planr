const { Client } = require('pg')

async function testSSLConnection() {
  const connectionOptions = [
    {
      name: 'SSL with sslmode=require',
      connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@db.gpfxxbhowailwllpgphe.supabase.co:5432/postgres?sslmode=require"
    },
    {
      name: 'SSL with ssl=true',
      connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@db.gpfxxbhowailwllpgphe.supabase.co:5432/postgres?ssl=true"
    },
    {
      name: 'Manual SSL config',
      config: {
        connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@db.gpfxxbhowailwllpgphe.supabase.co:5432/postgres",
        ssl: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'Manual SSL config - require',
      config: {
        connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@db.gpfxxbhowailwllpgphe.supabase.co:5432/postgres",
        ssl: {
          rejectUnauthorized: true
        }
      }
    }
  ]

  for (const option of connectionOptions) {
    console.log(`\n🔍 Testing: ${option.name}`)
    
    const client = new Client(option.config || {
      connectionString: option.connectionString
    })

    try {
      console.log('Attempting connection...')
      await client.connect()
      console.log('✅ Connected successfully!')
      
      const result = await client.query('SELECT version()')
      console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
      
      console.log('🎉 This SSL configuration works!')
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
  
  console.log('\n❌ All SSL connection attempts failed')
  return null
}

testSSLConnection()
  .then(result => {
    if (result) {
      console.log('\n🎉 SUCCESS! Use this SSL configuration')
      if (result.connectionString) {
        console.log('Connection String:', result.connectionString)
      } else {
        console.log('Config:', JSON.stringify(result.config, null, 2))
      }
    } else {
      console.log('\n💡 The issue is still DNS resolution, not SSL')
      console.log('Need to get correct hostname from Supabase dashboard')
    }
  })
  .catch(console.error)