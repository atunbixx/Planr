import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.generated'

// GET /api/budget/export - Export budget data in various formats
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id, partner1_name, partner2_name, wedding_date')
      .eq('partner1_email', session.user.email)
      .or(`partner2_email.eq.${session.user.email}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    // Get export format from query params
    const format = request.nextUrl.searchParams.get('format') || 'json'

    // Get all budget data
    const { data: categories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select(`
        *,
        budget_expenses(
          *,
          couple_vendors!vendor_id(id, business_name, contact_name, email, phone)
        )
      `)
      .eq('couple_id', coupleData.id)
      .order('priority', { ascending: false })

    if (categoriesError) {
      return NextResponse.json({ error: categoriesError.message }, { status: 500 })
    }

    // Calculate totals
    const totalBudget = categories?.reduce((sum, cat) => sum + (cat.allocated_amount || 0), 0) || 0
    const totalSpent = categories?.reduce((sum, cat) => {
      const categorySpent = cat.budget_expenses?.reduce((expSum, exp) => {
        return exp.payment_status === 'paid' ? expSum + exp.amount : expSum
      }, 0) || 0
      return sum + categorySpent
    }, 0) || 0
    const totalCommitted = categories?.reduce((sum, cat) => {
      const categoryCommitted = cat.budget_expenses?.reduce((expSum, exp) => {
        return exp.payment_status !== 'cancelled' ? expSum + exp.amount : expSum
      }, 0) || 0
      return sum + categoryCommitted
    }, 0) || 0

    if (format === 'csv') {
      // Generate CSV format
      const csvData = generateCSV(categories, coupleData, totalBudget, totalSpent, totalCommitted)
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="wedding-budget-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'pdf') {
      // For PDF, we'll return data that frontend can use to generate PDF
      const pdfData = {
        couple: {
          names: `${coupleData.partner1_name} & ${coupleData.partner2_name}`,
          wedding_date: coupleData.wedding_date
        },
        summary: {
          total_budget: totalBudget,
          total_spent: totalSpent,
          total_committed: totalCommitted,
          total_remaining: totalBudget - totalCommitted,
          spent_percentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
          committed_percentage: totalBudget > 0 ? (totalCommitted / totalBudget) * 100 : 0
        },
        categories: categories?.map(cat => {
          const spent = cat.budget_expenses?.reduce((sum, exp) => {
            return exp.payment_status === 'paid' ? sum + exp.amount : sum
          }, 0) || 0
          const committed = cat.budget_expenses?.reduce((sum, exp) => {
            return exp.payment_status !== 'cancelled' ? sum + exp.amount : sum
          }, 0) || 0
          
          return {
            name: cat.name,
            allocated: cat.allocated_amount || 0,
            spent,
            committed,
            remaining: (cat.allocated_amount || 0) - committed,
            percentage_used: cat.allocated_amount > 0 ? (committed / cat.allocated_amount) * 100 : 0,
            expenses: cat.budget_expenses?.map(exp => ({
              description: exp.description,
              vendor: exp.couple_vendors?.business_name || 'N/A',
              amount: exp.amount,
              status: exp.payment_status,
              due_date: exp.due_date,
              paid_date: exp.paid_date
            }))
          }
        }),
        generated_at: new Date().toISOString()
      }
      
      return NextResponse.json({ format: 'pdf', data: pdfData })
    } else {
      // Default JSON format
      const jsonData = {
        export_date: new Date().toISOString(),
        couple: {
          id: coupleData.id,
          partner1_name: coupleData.partner1_name,
          partner2_name: coupleData.partner2_name,
          wedding_date: coupleData.wedding_date
        },
        budget_summary: {
          total_budget: totalBudget,
          total_allocated: totalBudget,
          total_spent: totalSpent,
          total_committed: totalCommitted,
          total_remaining: totalBudget - totalCommitted
        },
        categories: categories?.map(category => ({
          id: category.id,
          name: category.name,
          allocated_amount: category.allocated_amount,
          spent_amount: category.budget_expenses?.reduce((sum, exp) => {
            return exp.payment_status === 'paid' ? sum + exp.amount : sum
          }, 0) || 0,
          committed_amount: category.budget_expenses?.reduce((sum, exp) => {
            return exp.payment_status !== 'cancelled' ? sum + exp.amount : sum
          }, 0) || 0,
          color: category.color,
          icon: category.icon,
          priority: category.priority,
          expenses: category.budget_expenses?.map(expense => ({
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            vendor: expense.couple_vendors ? {
              id: expense.couple_vendors.id,
              name: expense.couple_vendors.business_name,
              contact: expense.couple_vendors.contact_name,
              email: expense.couple_vendors.email,
              phone: expense.couple_vendors.phone
            } : null,
            status: expense.payment_status,
            payment_method: expense.payment_method,
            due_date: expense.due_date,
            paid_date: expense.paid_date,
            notes: expense.notes
          }))
        }))
      }
      
      return NextResponse.json(jsonData)
    }
  } catch (error) {
    console.error('Budget export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate CSV
function generateCSV(categories: any[], coupleData: any, totalBudget: number, totalSpent: number, totalCommitted: number): string {
  const lines: string[] = []
  
  // Header
  lines.push(`Wedding Budget Export - ${coupleData.partner1_name} & ${coupleData.partner2_name}`)
  lines.push(`Export Date: ${new Date().toISOString().split('T')[0]}`)
  lines.push(`Wedding Date: ${coupleData.wedding_date || 'Not set'}`)
  lines.push('')
  
  // Summary
  lines.push('BUDGET SUMMARY')
  lines.push(`Total Budget,$${totalBudget}`)
  lines.push(`Total Spent,$${totalSpent}`)
  lines.push(`Total Committed,$${totalCommitted}`)
  lines.push(`Total Remaining,$${totalBudget - totalCommitted}`)
  lines.push('')
  
  // Categories header
  lines.push('BUDGET BY CATEGORY')
  lines.push('Category,Allocated,Spent,Committed,Remaining,% Used')
  
  // Category data
  categories?.forEach(category => {
    const spent = category.budget_expenses?.reduce((sum: number, exp: any) => {
      return exp.payment_status === 'paid' ? sum + exp.amount : sum
    }, 0) || 0
    const committed = category.budget_expenses?.reduce((sum: number, exp: any) => {
      return exp.payment_status !== 'cancelled' ? sum + exp.amount : sum
    }, 0) || 0
    const allocated = category.allocated_amount || 0
    const remaining = allocated - committed
    const percentUsed = allocated > 0 ? ((committed / allocated) * 100).toFixed(1) : '0.0'
    
    lines.push(`${category.name},$${allocated},$${spent},$${committed},$${remaining},${percentUsed}%`)
  })
  
  lines.push('')
  
  // Expenses header
  lines.push('EXPENSE DETAILS')
  lines.push('Category,Description,Vendor,Amount,Status,Due Date,Paid Date,Payment Method')
  
  // Expense data
  categories?.forEach(category => {
    category.budget_expenses?.forEach((expense: any) => {
      const vendor = expense.couple_vendors?.business_name || 'N/A'
      const dueDate = expense.due_date ? new Date(expense.due_date).toLocaleDateString() : ''
      const paidDate = expense.paid_date ? new Date(expense.paid_date).toLocaleDateString() : ''
      
      lines.push(`${category.name},"${expense.description}","${vendor}",$${expense.amount},${expense.payment_status},${dueDate},${paidDate},${expense.payment_method || ''}`)
    })
  })
  
  return lines.join('\n')
}