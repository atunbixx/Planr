const { Client } = require('pg')

async function testServiceRole() {
  // Test with service role token from your environment
  const serviceRoleToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg4MzIxMiwiZXhwIjoyMDY4NDU5MjEyfQ.JpJUU-ZsuWQjAlTzNysTEGHNoIFnC_5x0CKhzk7H2Xk"
  
  const client = new Client({
    connectionString: `postgresql://postgres.gpfxxbhowailwllpgphe:${serviceRoleToken}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔍 Testing service role token as password...')
    
    await client.connect()
    console.log('✅ SUCCESS! Service role token works!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
    
    console.log('🎉 PERFECT! This is the correct pooler authentication!')
    
  } catch (error) {
    console.error('❌ Service role connection failed:', error.message)
    console.error('Code:', error.code)
    
    console.log('\n💡 Need to check Supabase dashboard for correct pooler credentials')
  } finally {
    try {
      await client.end()
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

testServiceRole()