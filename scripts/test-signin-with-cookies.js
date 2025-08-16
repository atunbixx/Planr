const fetch = require('node-fetch');

async function testSigninWithCookies() {
  console.log('🍪 Testing Sign-in with Cookie Persistence\n');
  
  const testUser = {
    email: 'test@weddingplanner.local',
    password: 'TestPassword123!'
  };
  
  console.log('1️⃣ Making sign-in request with cookie capture...');
  
  try {
    const signinResponse = await fetch('http://localhost:4000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const signinData = await signinResponse.json();
    const setCookieHeader = signinResponse.headers.raw()['set-cookie'] || [];
    
    console.log('   Status:', signinResponse.status);
    console.log('   Success:', signinData.success);
    console.log('   User ID:', signinData.user?.id);
    console.log('   Set-Cookie headers:', setCookieHeader.length);
    
    if (setCookieHeader.length > 0) {
      console.log('   Cookies set:');
      setCookieHeader.forEach((cookie, index) => {
        const cookieName = cookie.split('=')[0];
        const isSupabaseCookie = cookieName.startsWith('sb-') || cookieName.includes('auth');
        console.log(`     ${index + 1}. ${cookieName} ${isSupabaseCookie ? '(Supabase)' : '(Custom)'}`);
      });
    }
    
    console.log();
    
    // Extract cookies for next request
    const cookieString = setCookieHeader
      .map(cookie => cookie.split(';')[0])
      .join('; ');
    
    if (cookieString && signinData.success) {
      console.log('2️⃣ Testing authenticated request with cookies...');
      
      const authTestResponse = await fetch('http://localhost:4000/api/debug-auth-detailed', {
        headers: {
          'Cookie': cookieString
        }
      });
      
      const authTestData = await authTestResponse.json();
      
      console.log('   Auth check status:', authTestResponse.status);
      console.log('   Session exists:', authTestData.server?.session?.exists);
      console.log('   User exists:', authTestData.server?.user?.exists);
      console.log('   User ID:', authTestData.server?.user?.userId);
      console.log();
      
      if (authTestData.server?.session?.exists && authTestData.server?.user?.exists) {
        console.log('✅ SUCCESS! Authentication is working with cookies!');
        console.log('   The issue is likely browser-related, not server-side.');
        console.log();
        console.log('💡 Browser troubleshooting steps:');
        console.log('   1. Open browser in incognito/private mode');
        console.log('   2. Clear all cookies and localStorage');
        console.log('   3. Disable browser extensions that might interfere');
        console.log('   4. Check browser console for JavaScript errors');
        console.log('   5. Try a different browser');
      } else {
        console.log('❌ Cookies not working properly');
        console.log('   Server-side session handling needs fixes');
      }
      
    } else {
      console.log('❌ Sign-in failed or no cookies set');
      console.log('   Error:', signinData.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log();
  console.log('🔧 Alternative solutions if browser issues persist:');
  console.log('   • Use curl to test: curl -c cookies.txt -d \'{"email":"test@weddingplanner.local","password":"TestPassword123!"}\' -H "Content-Type: application/json" http://localhost:4000/api/auth/signin');
  console.log('   • Check if HTTPS is required in production');
  console.log('   • Verify domain settings in Supabase dashboard');
}

testSigninWithCookies().catch(console.error);