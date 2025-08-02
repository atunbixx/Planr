// Test RSVP APIs
const BASE_URL = 'http://localhost:4000'

async function testRSVPAPIs() {
  console.log('Testing RSVP APIs...\n')

  // Test 1: Validate invite code (should fail with invalid code)
  console.log('1. Testing invalid invite code:')
  try {
    const response = await fetch(`${BASE_URL}/api/rsvp/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: 'INVALID123' })
    })
    const data = await response.json()
    console.log('Response:', response.status, data)
  } catch (error) {
    console.error('Error:', error.message)
  }

  // Test 2: Track access
  console.log('\n2. Testing track access:')
  try {
    const response = await fetch(`${BASE_URL}/api/rsvp/track-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        inviteCode: 'TEST123',
        referrer: 'https://example.com'
      })
    })
    const data = await response.json()
    console.log('Response:', response.status, data)
  } catch (error) {
    console.error('Error:', error.message)
  }

  // Test 3: Get guest info by code
  console.log('\n3. Testing get guest info:')
  try {
    const response = await fetch(`${BASE_URL}/api/rsvp/TEST123`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await response.json()
    console.log('Response:', response.status, data)
  } catch (error) {
    console.error('Error:', error.message)
  }

  // Test 4: Session verification
  console.log('\n4. Testing session verification:')
  try {
    const response = await fetch(`${BASE_URL}/api/rsvp/session/test-session-id`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await response.json()
    console.log('Response:', response.status, data)
  } catch (error) {
    console.error('Error:', error.message)
  }

  console.log('\nRSVP API tests completed!')
}

// Run tests
testRSVPAPIs()