import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { getAdminClient } from '@/lib/supabase-admin-transformed'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Creating vendor with admin privileges:', body)
    console.log('User:', user.id)

    // Get user's couple data using admin client
    const supabase = getAdminClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        wedding_couples (id)
      `)
      .eq('supabaseUserId', user.id)
      .single()

    console.log('User lookup result:', { userData, userError })

    if (userError) {
      return NextResponse.json({ 
        error: 'Failed to find user profile',
        details: userError.message 
      }, { status: 400 })
    }

    if (!userData?.wedding_couples?.[0]) {
      return NextResponse.json({ 
        error: 'No couple data found. Please complete onboarding first.',
        redirect: '/onboarding'
      }, { status: 404 })
    }

    const coupleId = userData.wedding_couples[0].id
    console.log('Found couple ID:', coupleId)

    // Create new vendor using admin client (bypasses RLS)
    const vendorData = {
      coupleId: coupleId,
      name: body.name,
      categoryId: body.categoryId || null,
      contactName: body.contactName || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      website: body.website || null,
      status: body.status || 'potential',
      priority: body.priority || 'medium',
      rating: body.rating || null,
      estimatedCost: body.estimatedCost ? Number(body.estimatedCost) : null,
      actualCost: body.actualCost ? Number(body.actualCost) : null,
      notes: body.notes || null,
      meetingDate: body.meetingDate || null,
      contractSigned: body.contractSigned || false
    }

    console.log('Inserting vendor data:', vendorData)

    const { data: vendor, error } = await supabase
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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's couple data
    const supabase = getAdminClient()
    const { data: userData } = await supabase
      .from('users')
      .select(`
        wedding_couples (id)
      `)
      .eq('supabaseUserId', user.id)
      .single()

    if (!userData?.wedding_couples?.[0]) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = userData.wedding_couples[0].id

    // Get vendors for this couple using admin client
    const { data: vendors, error } = await supabase
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
      .eq('coupleId', coupleId)
      .order('createdAt', { ascending: false })

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
          totalVendors: vendors?.length || 0,
          bookedVendors: vendors?.filter(v => v.status === 'booked').length || 0,
          pendingVendors: vendors?.filter(v => ['potential', 'contacted', 'quote_requested', 'in_discussion'].includes(v.status)).length || 0,
          totalEstimatedCost: vendors?.reduce((sum, v) => sum + (v.estimatedCost || 0), 0) || 0,
          totalActualCost: vendors?.reduce((sum, v) => sum + (v.actualCost || 0), 0) || 0,
          contractsSigned: vendors?.filter(v => v.contractSigned).length || 0
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