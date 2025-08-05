const { Client } = require('pg')

async function testIPv6Force() {
  // Force IPv6 connection using the resolved address
  const client = new Client({
    connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@[2a05:d016:571:a40b:9965:5131:dcf6:1881]:5432/postgres?sslmode=require"
  })

  try {
    console.log('🔍 Testing forced IPv6 connection...')
    console.log('Address: 2a05:d016:571:a40b:9965:5131:dcf6:1881')
    
    await client.connect()
    console.log('✅ IPv6 connection successful!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
    
    console.log('🎉 IPv6 connection works! Now let\'s update your .env...')
    
    return true
    
  } catch (error) {
    console.error('❌ IPv6 connection failed:', error.message)
    console.error('Code:', error.code)
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 IPv6 is not properly configured on this system')
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - PostgreSQL might not be listening on IPv6')
    }
    
    return false
  } finally {
    try {
      await client.end()
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function checkIPv6Support() {
  console.log('🔍 Checking IPv6 support on this system...')
  
  try {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    // Check if IPv6 is enabled
    const { stdout } = await execAsync('sysctl net.inet6.ip6.forwarding 2>/dev/null || echo "IPv6 check failed"')
    console.log('IPv6 system check:', stdout.trim())
    
  } catch (error) {
    console.log('IPv6 system check failed:', error.message)
  }
}

async function main() {
  await checkIPv6Support()
  const ipv6Works = await testIPv6Force()
  
  if (!ipv6Works) {
    console.log('\n💡 Possible solutions:')
    console.log('1. Enable IPv6 on your system/network')
    console.log('2. Contact Supabase support about IPv4 access')
    console.log('3. Use a VPN that supports IPv6')
    console.log('4. Check if your ISP blocks IPv6')
  }
}

main()