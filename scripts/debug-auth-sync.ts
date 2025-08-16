#!/usr/bin/env node

/**
 * Authentication Sync Debugging Tool
 */

import fetch from 'node-fetch'

const API_BASE = 'http://localhost:4000'

async function debugAuthSync() {
  console.log('🔍 Authentication Sync Debugging\n')

  // Step 1: Check current auth state
  console.log('1️⃣ Checking current authentication state...')
  try {
    const response = await fetch(`${API_BASE}/api/debug-auth-detailed`)
    const data = await response.json()
    
    console.log('   Session exists:', data.server.session.exists)
    console.log('   User exists:', data.server.user.exists)
    console.log('   Cookies found:', data.cookies.supabase.length)
    console.log('   Environment:', data.environment.nodeEnv)
    console.log('   Recommendations:', data.recommendations.slice(0, 2))
    
    if (data.server.session.exists) {
      console.log('   ✅ User is authenticated')
      console.log('\n💡 If you\'re seeing authentication errors, try:')
      console.log('   - Refresh the page')
      console.log('   - Clear browser cache and cookies')
      console.log('   - Check browser console for errors')
      return
    } else {
      console.log('   ❌ No active session found\n')
    }
  } catch (error: any) {
    console.log('   ❌ Error checking auth state:', error.message, '\n')
  }

  // Step 2: Check if user needs to sign in
  console.log('2️⃣ Authentication required - user needs to sign in\n')
  
  // Step 3: Provide sign-in instructions
  console.log('🔧 How to resolve authentication sync issues:\n')
  
  console.log('   Option 1 - Sign in via browser:')
  console.log('   📍 Go to: http://localhost:4000/sign-in')
  console.log('   📧 Use your email and password')
  console.log('   🔄 The system will automatically sync authentication\n')
  
  console.log('   Option 2 - Test sign-in via API:')
  console.log('   📡 POST to: http://localhost:4000/api/auth/test-signin')
  console.log('   📧 Body: { "email": "your-email", "password": "your-password" }')
  console.log('   🧪 This will help debug authentication flow\n')
  
  console.log('   Option 3 - Clear authentication state:')
  console.log('   🧹 Clear browser cookies and localStorage')
  console.log('   🔄 Refresh the page')
  console.log('   📝 Sign in again\n')

  // Step 4: Check for common issues
  console.log('3️⃣ Common authentication sync issues:\n')
  
  console.log('   🍪 Cookie Issues:')
  console.log('   - Check if browser is accepting cookies')
  console.log('   - Ensure localhost domain is properly configured')
  console.log('   - Try in incognito/private mode\n')
  
  console.log('   🔐 Session Issues:')
  console.log('   - Check if Supabase project is configured correctly')
  console.log('   - Verify environment variables are set')
  console.log('   - Ensure user exists in Supabase dashboard\n')
  
  console.log('   🌐 Network Issues:')
  console.log('   - Check if server is running on port 4000')
  console.log('   - Verify API endpoints are accessible')
  console.log('   - Check browser developer tools for errors\n')

  // Step 5: Environment check
  try {
    const healthResponse = await fetch(`${API_BASE}/api/health`)
    const healthData = await healthResponse.json()
    
    console.log('4️⃣ Server Status:')
    console.log('   Status:', healthData.status)
    console.log('   Port:', healthData.port)
    console.log('   ✅ Server is running correctly\n')
  } catch (error: any) {
    console.log('4️⃣ Server Status:')
    console.log('   ❌ Server is not responding')
    console.log('   💡 Make sure to run: npm run dev -- --port 4000\n')
  }

  console.log('🎯 Next Steps:')
  console.log('   1. Visit http://localhost:4000/sign-in')
  console.log('   2. Enter your credentials')
  console.log('   3. Authentication will sync automatically')
  console.log('   4. Check logs for any errors')
  console.log('\n✨ Authentication sync should resolve after successful sign-in!')
}

debugAuthSync().catch(console.error)