import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    console.log('Debugging user-couple relationship...')
    
    // Get the clerk user ID
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user found',
        step: 'clerk_auth_check'
      }, { status: 401 })
    }

    console.log('Clerk user ID:', userId)

    // Check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)

    console.log('User lookup result:', { userData, userError })

    if (userError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to lookup user',
        details: userError.message,
        step: 'user_lookup',
        clerk_user_id: userId
      })
    }

    if (!userData || userData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database',
        details: 'User needs to complete onboarding',
        step: 'user_missing',
        clerk_user_id: userId
      })
    }

    const user = userData[0]
    console.log('Found user:', user)

    // Check if user has couple record
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('*')
      .eq('user_id', user.id)

    console.log('Couple lookup result:', { coupleData, coupleError })

    if (coupleError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to lookup couple',
        details: coupleError.message,
        step: 'couple_lookup',
        user: user
      })
    }

    if (!coupleData || coupleData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No couple record found',
        details: 'User needs to complete wedding profile setup',
        step: 'couple_missing',
        user: user,
        recommendation: 'Redirect to /onboarding to create couple profile'
      })
    }

    const couple = coupleData[0]
    console.log('Found couple:', couple)

    // Test RLS policy by trying to query vendors directly
    const { data: vendorTest, error: vendorTestError } = await supabase
      .from('vendors')
      .select('*')
      .eq('couple_id', couple.id)
      .limit(1)

    console.log('Vendor RLS test:', { vendorTest, vendorTestError })

    return NextResponse.json({
      success: true,
      clerk_user_id: userId,
      user: user,
      couple: couple,
      vendor_rls_test: {
        success: !vendorTestError,
        error: vendorTestError?.message,
        data: vendorTest
      },
      can_create_vendors: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'exception'
    }, { status: 500 })
  }
}