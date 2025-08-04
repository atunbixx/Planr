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
        couples (id)
      `)
      .eq('clerk_user_id', user.id)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Get recent expenses for this couple
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        *,
        budget_categories (
          name,
          icon,
          color
        ),
        vendors (
          name
        )
      `)
      .eq('couple_id', coupleId)
      .order('expense_date', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching expenses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch expenses', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: expenses
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
      description, 
      amount, 
      category_id, 
      vendor_id, 
      expense_date, 
      payment_method,
      receipt_url,
      notes 
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

    // Create new expense
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        couple_id: coupleId,
        description,
        amount: Number(amount),
        category_id,
        vendor_id: vendor_id || null,
        expense_date: expense_date || new Date().toISOString().split('T')[0],
        payment_method: payment_method || 'other',
        receipt_url: receipt_url || null,
        notes: notes || null
      })
      .select(`
        *,
        budget_categories (
          name,
          icon,
          color
        ),
        vendors (
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error creating expense:', error)
      return NextResponse.json(
        { error: 'Failed to create expense', details: error.message },
        { status: 500 }
      )
    }

    // Update the spent amount in the budget category
    if (category_id) {
      const { error: updateError } = await supabase.rpc('increment_spent_amount', {
        category_id,
        amount: Number(amount)
      })

      if (updateError) {
        console.error('Error updating category spent amount:', updateError)
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      data: expense
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}