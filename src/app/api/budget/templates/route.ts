import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.generated'

// Budget templates based on different wedding styles and sizes
const budgetTemplates = [
  {
    id: 'intimate-garden',
    name: 'Intimate Garden Wedding',
    description: 'Perfect for small gatherings of 50 guests or less',
    total_budget: 25000,
    guest_count: 50,
    categories: [
      { name: 'Venue', percentage: 20, amount: 5000, priority: 'high' },
      { name: 'Catering', percentage: 35, amount: 8750, priority: 'high' },
      { name: 'Photography', percentage: 12, amount: 3000, priority: 'high' },
      { name: 'Florals', percentage: 10, amount: 2500, priority: 'medium' },
      { name: 'Music & Entertainment', percentage: 8, amount: 2000, priority: 'medium' },
      { name: 'Attire', percentage: 8, amount: 2000, priority: 'medium' },
      { name: 'Miscellaneous', percentage: 7, amount: 1750, priority: 'low' }
    ]
  },
  {
    id: 'classic-traditional',
    name: 'Classic Traditional Wedding',
    description: 'Traditional celebration for 100-150 guests',
    total_budget: 50000,
    guest_count: 125,
    categories: [
      { name: 'Venue', percentage: 25, amount: 12500, priority: 'high' },
      { name: 'Catering', percentage: 30, amount: 15000, priority: 'high' },
      { name: 'Photography & Videography', percentage: 12, amount: 6000, priority: 'high' },
      { name: 'Florals & Decor', percentage: 10, amount: 5000, priority: 'medium' },
      { name: 'Music & Entertainment', percentage: 8, amount: 4000, priority: 'medium' },
      { name: 'Attire', percentage: 6, amount: 3000, priority: 'medium' },
      { name: 'Invitations & Stationery', percentage: 3, amount: 1500, priority: 'low' },
      { name: 'Transportation', percentage: 3, amount: 1500, priority: 'low' },
      { name: 'Miscellaneous', percentage: 3, amount: 1500, priority: 'low' }
    ]
  },
  {
    id: 'luxury-grand',
    name: 'Luxury Grand Wedding',
    description: 'Lavish celebration for 200+ guests',
    total_budget: 100000,
    guest_count: 250,
    categories: [
      { name: 'Venue', percentage: 20, amount: 20000, priority: 'high' },
      { name: 'Catering', percentage: 25, amount: 25000, priority: 'high' },
      { name: 'Photography & Videography', percentage: 15, amount: 15000, priority: 'high' },
      { name: 'Florals & Decor', percentage: 12, amount: 12000, priority: 'high' },
      { name: 'Music & Entertainment', percentage: 10, amount: 10000, priority: 'medium' },
      { name: 'Attire', percentage: 5, amount: 5000, priority: 'medium' },
      { name: 'Wedding Planner', percentage: 5, amount: 5000, priority: 'medium' },
      { name: 'Invitations & Stationery', percentage: 2, amount: 2000, priority: 'low' },
      { name: 'Transportation', percentage: 3, amount: 3000, priority: 'low' },
      { name: 'Miscellaneous', percentage: 3, amount: 3000, priority: 'low' }
    ]
  },
  {
    id: 'destination-beach',
    name: 'Destination Beach Wedding',
    description: 'Tropical getaway for 75-100 guests',
    total_budget: 40000,
    guest_count: 85,
    categories: [
      { name: 'Venue & Accommodation', percentage: 35, amount: 14000, priority: 'high' },
      { name: 'Catering', percentage: 25, amount: 10000, priority: 'high' },
      { name: 'Photography & Videography', percentage: 15, amount: 6000, priority: 'high' },
      { name: 'Guest Transportation', percentage: 8, amount: 3200, priority: 'medium' },
      { name: 'Florals & Decor', percentage: 7, amount: 2800, priority: 'medium' },
      { name: 'Music & Entertainment', percentage: 5, amount: 2000, priority: 'medium' },
      { name: 'Attire', percentage: 3, amount: 1200, priority: 'low' },
      { name: 'Miscellaneous', percentage: 2, amount: 800, priority: 'low' }
    ]
  },
  {
    id: 'rustic-barn',
    name: 'Rustic Barn Wedding',
    description: 'Charming countryside celebration for 100-150 guests',
    total_budget: 35000,
    guest_count: 125,
    categories: [
      { name: 'Venue', percentage: 20, amount: 7000, priority: 'high' },
      { name: 'Catering', percentage: 30, amount: 10500, priority: 'high' },
      { name: 'Photography', percentage: 12, amount: 4200, priority: 'high' },
      { name: 'Florals & Decor', percentage: 15, amount: 5250, priority: 'medium' },
      { name: 'Music & Entertainment', percentage: 8, amount: 2800, priority: 'medium' },
      { name: 'Attire', percentage: 6, amount: 2100, priority: 'medium' },
      { name: 'Rentals', percentage: 5, amount: 1750, priority: 'low' },
      { name: 'Transportation', percentage: 2, amount: 700, priority: 'low' },
      { name: 'Miscellaneous', percentage: 2, amount: 700, priority: 'low' }
    ]
  },
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist Wedding',
    description: 'Sleek and simple celebration for 80-100 guests',
    total_budget: 30000,
    guest_count: 90,
    categories: [
      { name: 'Venue', percentage: 25, amount: 7500, priority: 'high' },
      { name: 'Catering', percentage: 35, amount: 10500, priority: 'high' },
      { name: 'Photography', percentage: 15, amount: 4500, priority: 'high' },
      { name: 'Minimalist Florals', percentage: 8, amount: 2400, priority: 'medium' },
      { name: 'Music', percentage: 7, amount: 2100, priority: 'medium' },
      { name: 'Attire', percentage: 7, amount: 2100, priority: 'medium' },
      { name: 'Miscellaneous', percentage: 3, amount: 900, priority: 'low' }
    ]
  }
]

// GET /api/budget/templates - Get available budget templates
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get filter parameters
    const searchParams = request.nextUrl.searchParams
    const budgetMin = searchParams.get('budget_min')
    const budgetMax = searchParams.get('budget_max')
    const guestCount = searchParams.get('guest_count')

    let filteredTemplates = [...budgetTemplates]

    // Apply filters
    if (budgetMin) {
      filteredTemplates = filteredTemplates.filter(t => t.total_budget >= parseInt(budgetMin))
    }
    if (budgetMax) {
      filteredTemplates = filteredTemplates.filter(t => t.total_budget <= parseInt(budgetMax))
    }
    if (guestCount) {
      const count = parseInt(guestCount)
      filteredTemplates = filteredTemplates.filter(t => 
        Math.abs(t.guest_count - count) <= 50 // Within 50 guests
      )
    }

    return NextResponse.json({ templates: filteredTemplates })
  } catch (error) {
    console.error('Budget templates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/budget/templates/apply - Apply a budget template
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { template_id, couple_id, adjustments } = body

    // Validate template exists
    const template = budgetTemplates.find(t => t.id === template_id)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Verify couple ownership
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('id', couple_id)
      .eq('partner1_email', session.user.email)
      .or(`partner2_email.eq.${session.user.email}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Apply adjustments if provided
    let adjustedBudget = template.total_budget
    if (adjustments?.total_budget) {
      adjustedBudget = adjustments.total_budget
    }

    // Create categories based on template
    const createdCategories = []
    
    for (const categoryTemplate of template.categories) {
      const categoryAmount = adjustments?.total_budget 
        ? Math.round((categoryTemplate.percentage / 100) * adjustments.total_budget)
        : categoryTemplate.amount

      const { data: category, error: createError } = await supabase
        .from('budget_categories')
        .insert({
          couple_id,
          name: categoryTemplate.name,
          allocated_amount: categoryAmount,
          percentage_of_total: categoryTemplate.percentage,
          priority: categoryTemplate.priority,
          spent_amount: 0
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating category:', createError)
        continue
      }

      createdCategories.push(category)
    }

    return NextResponse.json({
      success: true,
      template_applied: template.name,
      total_budget: adjustedBudget,
      categories_created: createdCategories.length,
      categories: createdCategories
    })
  } catch (error) {
    console.error('Apply budget template error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}