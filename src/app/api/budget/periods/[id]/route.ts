import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.generated'
import { BudgetPeriod } from '@/types/budget'

// GET /api/budget/periods/[id] - Get a specific budget period
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('partner1_email', session.user.email)
      .or(`partner2_email.eq.${session.user.email}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    // Return mock data for now
    const mockPeriod: BudgetPeriod = {
      id: params.id,
      couple_id: coupleData.id,
      name: 'Wedding Budget',
      start_date: new Date().toISOString(),
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      total_budget: 50000,
      currency: 'USD',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockPeriod)
  } catch (error) {
    console.error('Get budget period error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/budget/periods/[id] - Update a budget period
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Return mock updated data
    const updatedPeriod: BudgetPeriod = {
      id: params.id,
      couple_id: body.couple_id,
      name: body.name,
      start_date: body.start_date,
      end_date: body.end_date,
      total_budget: body.total_budget,
      currency: body.currency || 'USD',
      is_active: body.is_active,
      notes: body.notes,
      created_at: body.created_at,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(updatedPeriod)
  } catch (error) {
    console.error('Update budget period error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/budget/periods/[id] - Delete a budget period
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return success for now
    return NextResponse.json({ success: true, deleted_id: params.id })
  } catch (error) {
    console.error('Delete budget period error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}