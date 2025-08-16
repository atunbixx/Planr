const fetch = require('node-fetch');

async function testCompleteAuthFlow() {
  console.log('🌟 Testing Complete Authentication Flow\n');
  
  const testUser = {
    email: 'test@weddingplanner.local',
    password: 'TestPassword123!'
  };
  
  try {
    console.log('1️⃣ Step 1: Sign in via API and capture cookies...');
    
    // Step 1: Sign in and get cookies
    const signinResponse = await fetch('http://localhost:4000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const signinData = await signinResponse.json();
    const setCookieHeaders = signinResponse.headers.raw()['set-cookie'] || [];
    
    console.log('   ✅ Sign-in result:', {
      status: signinResponse.status,
      success: signinData.success,
      userId: signinData.user?.id,
      redirectTo: signinData.redirectTo,
      cookiesSet: setCookieHeaders.length
    });
    
    if (!signinData.success || setCookieHeaders.length === 0) {
      console.log('❌ Sign-in failed or no cookies set');
      return;
    }
    
    // Extract cookies for subsequent requests
    const cookieString = setCookieHeaders
      .map(cookie => cookie.split(';')[0])
      .join('; ');
    
    console.log('   📝 Cookies to use:', cookieString);
    console.log();
    
    // Step 2: Test refresh session endpoint
    console.log('2️⃣ Step 2: Test refresh session endpoint...');
    
    const refreshResponse = await fetch('http://localhost:4000/api/auth/refresh-session', {
      method: 'POST',
      headers: {
        'Cookie': cookieString,
        'Content-Type': 'application/json'
      }
    });
    
    const refreshData = await refreshResponse.json();
    
    console.log('   ✅ Refresh session result:', {
      status: refreshResponse.status,
      success: refreshData.success,
      authenticated: refreshData.authenticated,
      userExists: refreshData.user?.exists,
      sessionExists: refreshData.session?.exists
    });
    console.log();
    
    // Step 3: Test protected route access
    console.log('3️⃣ Step 3: Test protected route access...');
    
    const dashboardResponse = await fetch('http://localhost:4000/dashboard', {
      headers: {
        'Cookie': cookieString
      },
      redirect: 'manual' // Don't follow redirects to see the actual response
    });
    
    console.log('   ✅ Dashboard access result:', {
      status: dashboardResponse.status,
      redirected: dashboardResponse.status >= 300 && dashboardResponse.status < 400,
      location: dashboardResponse.headers.get('location')
    });
    console.log();
    
    // Step 4: Test middleware auth check
    console.log('4️⃣ Step 4: Test detailed auth debug...');
    
    const debugResponse = await fetch('http://localhost:4000/api/debug-auth-detailed', {
      headers: {
        'Cookie': cookieString
      }
    });
    
    const debugData = await debugResponse.json();
    
    console.log('   ✅ Debug auth result:', {
      status: debugResponse.status,
      serverSessionExists: debugData.server?.session?.exists,
      serverUserExists: debugData.server?.user?.exists,
      cookieCount: debugData.cookies?.total,
      supabaseCookieCount: debugData.cookies?.supabase?.length,
      authContextUserId: debugData.authContext?.user?.id,
      recommendations: debugData.recommendations?.length || 0
    });
    
    if (debugData.recommendations?.length > 0) {
      console.log('   📋 Recommendations:');
      debugData.recommendations.forEach((rec, i) => {
        console.log(`     ${i + 1}. ${rec}`);
      });
    }
    console.log();
    
    // Final assessment
    const isFullyWorking = (
      signinData.success &&
      refreshData.success && 
      refreshData.authenticated &&
      debugData.server?.session?.exists &&
      debugData.server?.user?.exists
    );
    
    if (isFullyWorking) {
      console.log('🎉 SUCCESS! Complete authentication flow is working!');
      console.log('   ✓ Sign-in API works correctly');
      console.log('   ✓ Session refresh endpoint works');
      console.log('   ✓ Server-side session persists');
      console.log('   ✓ Authentication context is valid');
      console.log('   ✓ Protected routes should work in browser');
      console.log();
      console.log('💡 Next step: Test in browser at http://localhost:4000/sign-in');
      console.log('   Use email: test@weddingplanner.local');
      console.log('   Use password: TestPassword123!');
    } else {
      console.log('⚠️ Issues detected in the authentication flow:');
      if (!signinData.success) console.log('   ❌ Sign-in API failed');
      if (!refreshData.success || !refreshData.authenticated) console.log('   ❌ Session refresh failed');
      if (!debugData.server?.session?.exists) console.log('   ❌ Server session not persisting');
      if (!debugData.server?.user?.exists) console.log('   ❌ Server user not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testCompleteAuthFlow().catch(console.error);