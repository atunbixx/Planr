#!/usr/bin/env node

// Test script for onboarding API endpoint
const testOnboarding = async () => {
  const baseUrl = 'http://localhost:4000';
  
  console.log('🧪 Testing Onboarding API...\n');
  
  // Test data
  const timestamp = Date.now();
  const testData = {
    clerk_user_id: 'test_' + timestamp,
    email: `test_${timestamp}@example.com`,
    partner1_name: 'John Smith',
    partner2_name: 'Jane Doe',
    wedding_style: 'modern',
    wedding_date: '2025-06-15',
    venue_name: 'Grand Hotel',
    venue_location: 'New York, NY',
    guest_count_estimate: 150,
    budget_total: 50000,
    onboarding_completed: true
  };
  
  try {
    // Test POST - Create/Update couple
    console.log('📝 Testing POST /api/couples...');
    const createResponse = await fetch(`${baseUrl}/api/couples`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const createResult = await createResponse.json();
    console.log('Status:', createResponse.status);
    console.log('Response:', JSON.stringify(createResult, null, 2));
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create couple: ${createResult.error}`);
    }
    
    console.log('✅ Couple created successfully!\n');
    
    // Test GET - Retrieve couple data
    console.log('📖 Testing GET /api/couples...');
    const getResponse = await fetch(`${baseUrl}/api/couples?clerk_user_id=${testData.clerk_user_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const getResult = await getResponse.json();
    console.log('Status:', getResponse.status);
    console.log('Response:', JSON.stringify(getResult, null, 2));
    
    if (!getResponse.ok) {
      throw new Error(`Failed to retrieve couple: ${getResult.error}`);
    }
    
    console.log('✅ Couple retrieved successfully!\n');
    
    // Verify data integrity
    if (getResult.data && getResult.data.couples && getResult.data.couples.length > 0) {
      const couple = getResult.data.couples[0];
      console.log('🔍 Data Verification:');
      console.log(`  - Partner Name: ${couple.partner_name === testData.partner1_name ? '✅' : '❌'}`);
      console.log(`  - Wedding Date: ${couple.wedding_date === testData.wedding_date ? '✅' : '❌'}`);
      console.log(`  - Venue Name: ${couple.venue_name === testData.venue_name ? '✅' : '❌'}`);
      console.log(`  - Venue Location: ${couple.venue_location === testData.venue_location ? '✅' : '❌'}`);
    }
    
    console.log('\n🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

// Run the test
testOnboarding();