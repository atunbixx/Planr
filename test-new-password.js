const { Client } = require('pg')

async function testNewPassword() {
  const client = new Client({
    connectionString: "postgresql://postgres:gpfxxbhowailwllpgphe@db.gpfxxbhowailwllpgphe.supabase.co:5432/postgres"
  })

  try {
    console.log('🔍 Testing connection with new password...')
    await client.connect()
    console.log('✅ Connected successfully!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
    
    console.log('🎉 Connection works with new password!')
    
  } catch (error) {
    console.error('❌ Connection failed:')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
  } finally {
    await client.end()
  }
}

testNewPassword()