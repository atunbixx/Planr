import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    console.log('Testing vendor authentication flow...')
    
    // Get the clerk user ID like the component would
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user found'
      }, { status: 401 })
    }

    console.log('Clerk user ID:', userId)

    // Test the exact query the AddVendorDialog component uses
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('couples(id)')
      .eq('clerk_user_id', userId)
      .single()

    console.log('User lookup result:', { data: userData, error: userError })

    if (userError || !userData?.couples?.[0]) {
      return NextResponse.json({
        success: false,
        error: 'Could not find wedding profile',
        details: {
          userError: userError?.message,
          userData: userData,
          userId: userId
        }
      })
    }

    const coupleId = userData.couples[0].id
    console.log('Found couple ID:', coupleId)

    // Test vendor insertion with proper authentication
    const testVendor = {
      couple_id: coupleId,
      name: 'Test Vendor - Auth Test',
      contact_name: 'Test Contact',
      phone: '555-0123',
      email: 'test@example.com',
      status: 'potential',
      priority: 'medium'
    }

    console.log('Testing vendor insert with proper auth...')
    const { data: insertTest, error: insertError } = await supabase
      .from('vendors')
      .insert([testVendor])
      .select()

    console.log('Insert test result:', { data: insertTest, error: insertError })

    return NextResponse.json({
      success: true,
      clerk_user_id: userId,
      user_data: userData,
      couple_id: coupleId,
      insert_test: {
        success: !insertError,
        error: insertError?.message,
        error_code: insertError?.code,
        data: insertTest
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug vendor auth error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}