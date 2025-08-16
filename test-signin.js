const fetch = require('node-fetch');

async function testSignIn() {
  console.log('🧪 Testing Sign-In API...\n');
  
  // First, let's check what happens with empty credentials
  console.log('1️⃣ Testing empty credentials...');
  try {
    const response = await fetch('http://localhost:4000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: '', password: '' })
    });
    
    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Response:', data);
    console.log();
  } catch (error) {
    console.log('   Error:', error.message);
    console.log();
  }

  // Test with test credentials (these likely don't exist)
  console.log('2️⃣ Testing with test credentials...');
  try {
    const response = await fetch('http://localhost:4000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'testpassword123' 
      })
    });
    
    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Response:', data);
    console.log();
  } catch (error) {
    console.log('   Error:', error.message);
    console.log();
  }

  console.log('💡 To fix sign-in issues:');
  console.log('   1. Create a user in Supabase dashboard');
  console.log('   2. Or use existing credentials if you have them');
  console.log('   3. Check Supabase project settings');
  console.log('   4. Verify environment variables');
}

testSignIn().catch(console.error);