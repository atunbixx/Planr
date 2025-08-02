const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gpfxxbhowailwllpgphe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODMyMTIsImV4cCI6MjA2ODQ1OTIxMn0.FMY9ABxdunqpLk-smoVRYycqdRoTIF8I9dDgJ0bZl-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🔍 Testing authentication with provided credentials...');
  console.log('Email: hello@atunbi.net');
  console.log('Password: Teniola=1');
  console.log('');
  
  try {
    // Test 1: Try to sign in with the provided credentials
    console.log('Test 1: Attempting sign-in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'hello@atunbi.net',
      password: 'Teniola=1'
    });
    
    if (error) {
      console.log('❌ Authentication failed:', error.message);
      console.log('Error code:', error.status || 'No status code');
      
      // Check specific error types
      if (error.message.includes('Invalid login credentials')) {
        console.log('💡 This means the user doesn\'t exist or password is wrong');
      } else if (error.message.includes('Email not confirmed')) {
        console.log('💡 User exists but email needs to be confirmed');
      } else if (error.message.includes('Too many requests')) {
        console.log('💡 Rate limited - wait a moment and try again');
      }
      
    } else {
      console.log('✅ Authentication successful!');
      console.log('User ID:', data.user?.id);
      console.log('User email:', data.user?.email);
      console.log('User confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
      return;
    }
    
    console.log('');
    
    // Test 2: Try with demo credentials from the sign-in page
    console.log('Test 2: Trying demo credentials...');
    const { data: demoData, error: demoError } = await supabase.auth.signInWithPassword({
      email: 'sarah.johnson@email.com',
      password: 'password123'
    });
    
    if (demoError) {
      console.log('❌ Demo authentication failed:', demoError.message);
    } else {
      console.log('✅ Demo authentication successful!');
      console.log('Demo User ID:', demoData.user?.id);
      console.log('Demo User email:', demoData.user?.email);
      return;
    }
    
    console.log('');
    
    // Test 3: Try to create the user
    console.log('Test 3: Attempting to create user account...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'hello@atunbi.net',
      password: 'Teniola=1',
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });
    
    if (signupError) {
      console.log('❌ Sign-up failed:', signupError.message);
      
      if (signupError.message.includes('already registered')) {
        console.log('💡 User already exists but may need email confirmation');
      }
    } else {
      console.log('✅ Sign-up successful!');
      console.log('New User ID:', signupData.user?.id);
      console.log('Confirmation required:', !signupData.user?.email_confirmed_at);
      
      if (!signupData.user?.email_confirmed_at) {
        console.log('📧 Check your email for confirmation link, or enable auto-confirm in Supabase');
      }
    }
    
  } catch (err) {
    console.log('❌ Connection error:', err.message);
    console.log('💡 Check your internet connection and Supabase URL');
  }
}

testAuth();