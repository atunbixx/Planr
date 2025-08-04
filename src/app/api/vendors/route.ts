import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Get user's couple data first
    const { data: userData } = await supabase
      .from('users')
      .select(`
        couples (id)
      `)
      .eq('clerk_user_id', user.id)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Build query for vendors with categories
    let query = supabase
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

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('vendor_categories.name', category)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: vendors, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vendors:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vendors', details: error.message },
        { status: 500 }
      )
    }

    // Get vendor statistics by category
    const { data: categoryStats, error: statsError } = await supabase.rpc('get_vendor_stats_by_category', {
      p_couple_id: coupleId
    })

    if (statsError) {
      console.error('Error fetching vendor stats:', statsError)
    }

    // Get overall vendor summary
    const { data: summary, error: summaryError } = await supabase.rpc('get_vendor_summary', {
      p_couple_id: coupleId
    })

    if (summaryError) {
      console.error('Error fetching vendor summary:', summaryError)
    }

    return NextResponse.json({
      success: true,
      data: {
        vendors: vendors || [],
        categoryStats: categoryStats || [],
        summary: summary?.[0] || {
          total_vendors: 0,
          booked_vendors: 0,
          pending_vendors: 0,
          total_estimated_cost: 0,
          total_actual_cost: 0,
          contracts_signed: 0
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

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name,
      category_id,
      contact_name,
      phone,
      email,
      address,
      website,
      social_media,
      status,
      priority,
      rating,
      estimated_cost,
      actual_cost,
      notes,
      meeting_date,
      contract_signed
    } = body

    // Get user's couple data
    const { data: userData } = await supabase
      .from('users')
      .select(`
        couples (id)
      `)
      .eq('clerk_user_id', user.id)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Create new vendor
    const { data: vendor, error } = await supabase
      .from('vendors')
      .insert({
        couple_id: coupleId,
        name,
        category_id: category_id || null,
        contact_name: contact_name || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        website: website || null,
        social_media: social_media || null,
        status: status || 'potential',
        priority: priority || 'medium',
        rating: rating || null,
        estimated_cost: estimated_cost ? Number(estimated_cost) : null,
        actual_cost: actual_cost ? Number(actual_cost) : null,
        notes: notes || null,
        meeting_date: meeting_date || null,
        contract_signed: contract_signed || false
      })
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
      return NextResponse.json(
        { error: 'Failed to create vendor', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: vendor
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}