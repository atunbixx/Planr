const { Client } = require('pg')

async function testCorrectUsername() {
  // Test different username formats
  const connectionOptions = [
    {
      name: 'Simple postgres username',
      connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
      ssl: { rejectUnauthorized: false }
    },
    {
      name: 'Project-specific username',
      connectionString: "postgresql://postgres.gpfxxbhowailwllpgphe:vM2Pn1lCaKsQrnCh@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
      ssl: { rejectUnauthorized: false }
    },
    {
      name: 'Service role token from env',
      connectionString: "postgresql://postgres.gpfxxbhowailwllpgphe:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg4MzIxMiwiZXhwIjoyMDY4NDU5MjEyfQ.JpJUU-ZsuWQjAlTzNysTEGHNoIFnC_5x0CKhzk7H2Xk@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
      ssl: { rejectUnauthorized: false }
    }
  ]

  for (const option of connectionOptions) {
    console.log(`\n🔍 Testing: ${option.name}`)
    
    const client = new Client({
      connectionString: option.connectionString,
      ssl: option.ssl
    })

    try {
      await client.connect()
      console.log('✅ Connection successful!')
      
      const result = await client.query('SELECT version()')
      console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
      
      console.log('🎉 This username format works!')
      console.log('Connection:', option.connectionString.replace(/:([^:@]+)@/, ':****@'))
      
      return option
      
    } catch (error) {
      console.error('❌ Failed:', error.message.substring(0, 100) + '...')
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
  
  return null
}

testCorrectUsername()
  .then(result => {
    if (result) {
      console.log('\n🎉 SUCCESS! Use this connection format')
    } else {
      console.log('\n❌ All username formats failed')
      console.log('💡 Check your Supabase project settings for the correct credentials')
    }
  })