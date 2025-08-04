// Test the complete onboarding flow end-to-end
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

const API_BASE = 'http://localhost:4001/api'

async function testOnboardingFlow() {
  console.log('🧪 Testing Onboarding Flow End-to-End\n')
  
  // Test data for onboarding
  const testData = {
    clerk_user_id: 'test_onboarding_user_' + Date.now(),
    email: 'test.onboarding@weddingplanner.com',
    partner1_name: 'John Smith',
    partner2_name: 'Jane Doe',
    wedding_style: 'Modern',
    wedding_date: '2025-06-15',
    venue_name: 'Garden Vista',
    venue_location: 'San Francisco, CA',
    guest_count_estimate: 120,
    budget_total: 25000.00,
    onboarding_completed: true
  }
  
  try {
    // Step 1: Create couple profile (POST)
    console.log('📝 Step 1: Creating couple profile...')
    const createResponse = await fetch(`${API_BASE}/couples`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    const createResult = await createResponse.json()
    console.log('Status:', createResponse.status)
    console.log('Result:', JSON.stringify(createResult, null, 2))
    
    if (!createResponse.ok) {
      console.error('❌ Failed to create couple profile')
      return
    }
    
    console.log('✅ Couple profile created successfully\n')
    
    // Step 2: Fetch couple data (GET)
    console.log('📋 Step 2: Fetching couple data...')
    const fetchResponse = await fetch(`${API_BASE}/couples?clerk_user_id=${testData.clerk_user_id}`)
    
    const fetchResult = await fetchResponse.json()
    console.log('Status:', fetchResponse.status)
    console.log('Result:', JSON.stringify(fetchResult, null, 2))
    
    if (!fetchResponse.ok) {
      console.error('❌ Failed to fetch couple data')
      return
    }
    
    console.log('✅ Couple data fetched successfully\n')
    
    // Step 3: Update couple profile (POST again with same clerk_user_id)
    console.log('🔄 Step 3: Updating couple profile...')
    const updatedData = {
      ...testData,
      budget_total: 30000.00,
      guest_count_estimate: 150,
      venue_name: 'Mountain View Resort'
    }
    
    const updateResponse = await fetch(`${API_BASE}/couples`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData)
    })
    
    const updateResult = await updateResponse.json()
    console.log('Status:', updateResponse.status)
    console.log('Result:', JSON.stringify(updateResult, null, 2))
    
    if (!updateResponse.ok) {
      console.error('❌ Failed to update couple profile')
      return
    }
    
    console.log('✅ Couple profile updated successfully\n')
    
    console.log('🎉 All tests passed! Onboarding flow is working correctly.')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

// Run the test
testOnboardingFlow()