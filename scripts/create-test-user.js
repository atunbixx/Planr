const fetch = require('node-fetch');

async function createTestUser() {
  console.log('🚀 Creating Test User for Wedding Planner\n');
  
  // Generate a test user
  const testUser = {
    email: 'test@weddingplanner.local',
    password: 'TestPassword123!'
  };
  
  console.log('📝 Creating user with:');
  console.log('   Email:', testUser.email);
  console.log('   Password:', testUser.password);
  console.log();
  
  try {
    // Attempt to create the user
    console.log('1️⃣ Creating user account...');
    const signupResponse = await fetch('http://localhost:4000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const signupData = await signupResponse.json();
    console.log('   Status:', signupResponse.status);
    
    if (signupResponse.status === 200) {
      console.log('   ✅ User created successfully!');
      console.log('   User ID:', signupData.user?.id || 'N/A');
      console.log();
      
      // Test sign in
      console.log('2️⃣ Testing sign-in with new user...');
      const signinResponse = await fetch('http://localhost:4000/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser)
      });
      
      const signinData = await signinResponse.json();
      console.log('   Status:', signinResponse.status);
      
      if (signinResponse.status === 200) {
        console.log('   ✅ Sign-in successful!');
        console.log('   Redirect to:', signinData.redirectTo);
        console.log();
        
        console.log('🎉 SUCCESS! You can now sign in with:');
        console.log('   📧 Email:', testUser.email);
        console.log('   🔒 Password:', testUser.password);
        console.log();
        console.log('🌐 Go to: http://localhost:4000/sign-in');
        
      } else {
        console.log('   ❌ Sign-in failed:', signinData.error);
        console.log();
        console.log('💡 Try signing in manually at: http://localhost:4000/sign-in');
      }
      
    } else {
      console.log('   Response:', signupData);
      
      if (signupData.error && signupData.error.includes('already registered')) {
        console.log('   ℹ️  User already exists, trying to sign in...');
        
        const signinResponse = await fetch('http://localhost:4000/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testUser)
        });
        
        const signinData = await signinResponse.json();
        
        if (signinResponse.status === 200) {
          console.log('   ✅ Existing user can sign in!');
          console.log();
          console.log('🎉 You can sign in with:');
          console.log('   📧 Email:', testUser.email);
          console.log('   🔒 Password:', testUser.password);
          console.log();
          console.log('🌐 Go to: http://localhost:4000/sign-in');
        } else {
          console.log('   ❌ Sign-in also failed:', signinData.error);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    console.log();
    console.log('💡 Troubleshooting steps:');
    console.log('   1. Check if server is running on port 4000');
    console.log('   2. Verify Supabase configuration');
    console.log('   3. Check environment variables');
    console.log('   4. Try creating user via Supabase dashboard');
  }
  
  console.log();
  console.log('📚 Alternative Options:');
  console.log('   • Use Supabase dashboard to create users');
  console.log('   • Check existing users in your Supabase project');
  console.log('   • Verify email confirmation settings');
}

createTestUser().catch(console.error);