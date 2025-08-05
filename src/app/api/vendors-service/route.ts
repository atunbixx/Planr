import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

// Use service role key for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Creating vendor with admin privileges:', body)
    console.log('User:', userId)

    // Get user's couple data using admin client
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        couples (id)
      `)
      .eq('clerk_user_id', userId)
      .single()

    console.log('User lookup result:', { userData, userError })

    if (userError) {
      return NextResponse.json({ 
        error: 'Failed to find user profile',
        details: userError.message 
      }, { status: 400 })
    }

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ 
        error: 'No couple data found. Please complete onboarding first.',
        redirect: '/onboarding'
      }, { status: 404 })
    }

    const coupleId = userData.couples[0].id
    console.log('Found couple ID:', coupleId)

    // Create new vendor using admin client (bypasses RLS)
    const vendorData = {
      couple_id: coupleId,
      name: body.name,
      category_id: body.category_id || null,
      contact_name: body.contact_name || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      website: body.website || null,
      status: body.status || 'potential',
      priority: body.priority || 'medium',
      rating: body.rating || null,
      estimated_cost: body.estimated_cost ? Number(body.estimated_cost) : null,
      actual_cost: body.actual_cost ? Number(body.actual_cost) : null,
      notes: body.notes || null,
      meeting_date: body.meeting_date || null,
      contract_signed: body.contract_signed || false
    }

    console.log('Inserting vendor data:', vendorData)

    const { data: vendor, error } = await supabaseAdmin
      .from('vendors')
      .insert(vendorData)
      .select(`
        *,
        vendor_categories (
          id,
          name,
          icon,
          color
        )
      `)
      .single()

    if (error) {
      console.error('Error creating vendor:', error)
      return NextResponse.json({
        error: 'Failed to create vendor',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log('Vendor created successfully:', vendor)

    return NextResponse.json({
      success: true,
      data: vendor,
      message: 'Vendor created successfully!'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's couple data
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select(`
        couples (id)
      `)
      .eq('clerk_user_id', userId)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Get vendors for this couple using admin client
    const { data: vendors, error } = await supabaseAdmin
      .from('vendors')
      .select(`
        *,
        vendor_categories (
          id,
          name,
          icon,
          color
        )
      `)
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch vendors',
        details: error.message
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        vendors: vendors || [],
        categoryStats: [], // We can add this later
        summary: {
          total_vendors: vendors?.length || 0,
          booked_vendors: vendors?.filter(v => v.status === 'booked').length || 0,
          pending_vendors: vendors?.filter(v => ['potential', 'contacted', 'quote_requested', 'in_discussion'].includes(v.status)).length || 0,
          total_estimated_cost: vendors?.reduce((sum, v) => sum + (v.estimated_cost || 0), 0) || 0,
          total_actual_cost: vendors?.reduce((sum, v) => sum + (v.actual_cost || 0), 0) || 0,
          contracts_signed: vendors?.filter(v => v.contract_signed).length || 0
        }
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}