import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const vendorType = searchParams.get('vendor_type')
    const isDefault = searchParams.get('is_default')

    // Build query
    let query = supabase
      .from('task_templates')
      .select('*')
      .order('name', { ascending: true })

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }
    if (vendorType) {
      query = query.eq('vendor_type', vendorType)
    }
    if (isDefault !== null) {
      query = query.eq('is_default', isDefault === 'true')
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching task templates:', error)
      return NextResponse.json({ error: 'Failed to fetch task templates' }, { status: 500 })
    }

    return NextResponse.json({ templates })

  } catch (error) {
    console.error('Error in task templates GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }

    // Create task template
    const { data: template, error } = await supabase
      .from('task_templates')
      .insert({
        ...body,
        is_default: body.is_default || false,
        subtasks: body.subtasks || [],
        typical_duration_days: body.typical_duration_days || 1,
        months_before_wedding: body.months_before_wedding || 6
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task template:', error)
      return NextResponse.json({ error: 'Failed to create task template' }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })

  } catch (error) {
    console.error('Error in task templates POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 