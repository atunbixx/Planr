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

    // Get user's couple data first
    const { data: userData } = await supabase
      .from('users')
      .select(`
        id,
        couples (
          id,
          budget_total
        )
      `)
      .eq('clerk_user_id', user.id)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id
    const totalBudget = userData.couples[0].budget_total || 0

    // Get budget categories for this couple
    const { data: categories, error } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at')

    if (error) {
      console.error('Error fetching budget categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch budget categories', details: error.message },
        { status: 500 }
      )
    }

    // Calculate budget breakdown
    const totalSpent = categories.reduce((sum, cat) => sum + (Number(cat.spent_amount) || 0), 0)
    const totalAllocated = categories.reduce((sum, cat) => sum + (Number(cat.allocated_amount) || 0), 0)
    const remaining = Number(totalBudget) - totalSpent

    return NextResponse.json({
      success: true,
      data: {
        categories,
        totals: {
          budget: Number(totalBudget),
          spent: totalSpent,
          allocated: totalAllocated,
          remaining
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
    const { name, icon, color, allocated_amount, priority } = body

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

    // Create new budget category
    const { data: category, error } = await supabase
      .from('budget_categories')
      .insert({
        couple_id: coupleId,
        name,
        icon: icon || '💰',
        color: color || '#3B82F6',
        allocated_amount: allocated_amount || 0,
        spent_amount: 0,
        priority: priority || 'important'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating budget category:', error)
      return NextResponse.json(
        { error: 'Failed to create budget category', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: category
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}