import { test, expect } from '@playwright/test';

test.describe('Test Couples API', () => {
  test('test couples API with mock authentication', async ({ request }) => {
    console.log('Testing couples API...\n');
    
    // Test 1: Without authentication
    console.log('Test 1: Without authentication');
    const response1 = await request.post('http://localhost:3000/api/couples', {
      data: {
        partner1_name: 'Test User',
        partner2_name: 'Test Partner'
      }
    });
    console.log(`Response status: ${response1.status()}`);
    expect(response1.status()).toBe(401);
    console.log('✅ Correctly returns 401 without auth\n');
    
    // Test 2: With mock Bearer token
    console.log('Test 2: With mock Bearer token');
    const response2 = await request.post('http://localhost:3000/api/couples', {
      headers: {
        'Authorization': 'Bearer mock-test-token-12345',
        'Content-Type': 'application/json'
      },
      data: {
        partner1_name: 'Test User',
        partner2_name: 'Test Partner',
        wedding_date: '2024-12-25',
        venue_name: 'Test Venue',
        venue_location: 'Test City, ST',
        guest_count_estimate: 150,
        total_budget: 75000,
        wedding_style: 'modern'
      }
    });
    
    console.log(`Response status: ${response2.status()}`);
    const body = await response2.json();
    console.log('Response body:', JSON.stringify(body, null, 2));
    
    if (response2.status() === 201 || response2.status() === 200) {
      console.log('✅ Successfully created/returned couple profile');
      expect(body).toHaveProperty('id');
      expect(body.partner1_name).toBe('Test User');
      
      // Test 3: Try to fetch the created couple
      console.log('\nTest 3: Fetching created couple');
      const response3 = await request.get('http://localhost:3000/api/couples', {
        headers: {
          'Authorization': 'Bearer mock-test-token-12345'
        }
      });
      
      console.log(`GET Response status: ${response3.status()}`);
      if (response3.status() === 200) {
        const getBody = await response3.json();
        console.log('GET Response body:', JSON.stringify(getBody, null, 2));
        console.log('✅ Successfully fetched couple profile');
      }
    }
    
    console.log('\n✅ API test completed');
  });
});