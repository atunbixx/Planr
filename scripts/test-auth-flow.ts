#!/usr/bin/env node

/**
 * Test authentication flow to ensure all fixes are working
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuthFlow() {
  console.log('🧪 Testing authentication flow...\n')

  // Test 1: Check current session
  console.log('1️⃣ Checking current session...')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.log('   ❌ Session error:', sessionError.message)
  } else if (session) {
    console.log('   ✅ Active session found')
    console.log('   - User ID:', session.user.id)
    console.log('   - Email:', session.user.email)
    console.log('   - Expires at:', new Date(session.expires_at! * 1000).toLocaleString())
  } else {
    console.log('   ℹ️ No active session')
  }

  // Test 2: Check user
  console.log('\n2️⃣ Checking current user...')
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    console.log('   ❌ User error:', userError.message)
  } else if (user) {
    console.log('   ✅ User found')
    console.log('   - User ID:', user.id)
    console.log('   - Email:', user.email)
    console.log('   - Created at:', new Date(user.created_at).toLocaleString())
  } else {
    console.log('   ℹ️ No user found')
  }

  // Test 3: Test session refresh (if we have a session)
  if (session) {
    console.log('\n3️⃣ Testing session refresh...')
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      console.log('   ❌ Refresh error:', refreshError.message)
    } else if (refreshData?.session) {
      console.log('   ✅ Session refreshed successfully')
      console.log('   - New expires at:', new Date(refreshData.session.expires_at! * 1000).toLocaleString())
    }
  }

  // Test 4: Check API endpoint
  console.log('\n4️⃣ Testing API debug endpoint...')
  try {
    const response = await fetch('http://localhost:4000/api/debug-auth-detailed')
    const data = await response.json()
    
    console.log('   ✅ API endpoint accessible')
    console.log('   - Status:', data.status)
    console.log('   - Session exists:', data.server.session.exists)
    console.log('   - User exists:', data.server.user.exists)
    console.log('   - Cookies found:', data.cookies.supabase.length)
    console.log('   - Recommendations:', data.recommendations.length ? data.recommendations : 'None')
  } catch (error: any) {
    console.log('   ❌ API error:', error.message)
  }

  console.log('\n✅ Authentication flow test complete!')
}

// Run the test
testAuthFlow().catch(console.error)