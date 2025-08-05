import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function BudgetPage() {
  const { userId } = await auth()
  const user = await currentUser()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  // Fetch user's budget data
  let budgetData: any = null
  let categories: any[] = []
  let expenses: any[] = []
  
  if (user?.emailAddresses?.[0]?.emailAddress) {
    // Get user's couple data and budget info
    const { data: userData } = await supabase
      .from('users')
      .select(`
        couples (
          id,
          budget_total,
          budget_categories (
            id,
            name,
            icon,
            color,
            allocated_amount,
            spent_amount,
            priority,
            industry_average_percentage
          )
        )
      `)
      .eq('email', user.emailAddresses[0].emailAddress)
      .single()
    
    if (userData?.couples?.[0]) {
      const coupleData = userData.couples[0]
      categories = coupleData.budget_categories || []
      
      // Calculate totals
      const totalBudget = Number(coupleData.budget_total) || 0
      const totalSpent = categories.reduce((sum, cat) => sum + (Number(cat.spent_amount) || 0), 0)
      const totalAllocated = categories.reduce((sum, cat) => sum + (Number(cat.allocated_amount) || 0), 0)
      const remaining = totalBudget - totalSpent
      
      budgetData = {
        totalBudget,
        totalSpent,
        totalAllocated,
        remaining,
        spentPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
      }
      
      // Get recent expenses
      const { data: expensesData } = await supabase
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
        .eq('couple_id', coupleData.id)
        .order('expense_date', { ascending: false })
        .limit(5)
      
      expenses = expensesData || []
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
        <p className="text-gray-600 mt-2">Track your wedding expenses and stay within budget</p>
      </div>

      {budgetData ? (
        <>
          {/* Budget Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Budget</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${budgetData.totalBudget.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Amount Spent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${budgetData.totalSpent.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {budgetData.spentPercentage}% of budget
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Remaining</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${budgetData.remaining >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ${budgetData.remaining.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {budgetData.remaining >= 0 ? 
                    `${Math.round(100 - budgetData.spentPercentage)}% remaining` : 
                    'Over budget!'
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Budget Categories */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Budget Breakdown by Category</CardTitle>
                  <CardDescription>See how your budget is distributed across different categories</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/dashboard/budget/categories">Manage Categories</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {categories.length > 0 ? (
                <div className="space-y-4">
                  {categories.map((category) => {
                    const spent = Number(category.spent_amount) || 0
                    const allocated = Number(category.allocated_amount) || 0
                    const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0
                    
                    return (
                      <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {category.priority === 'essential' && '🔴 Essential'}
                              {category.priority === 'important' && '🟡 Important'}
                              {category.priority === 'nice_to_have' && '🟢 Nice to have'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ${spent.toLocaleString()} 
                            {allocated > 0 && <span className="text-muted-foreground text-sm ml-1">/ ${allocated.toLocaleString()}</span>}
                          </div>
                          {allocated > 0 && (
                            <div className="text-sm text-muted-foreground">
                              {percentage}% used
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No budget categories set up yet</p>
                  <Button asChild>
                    <Link href="/dashboard/budget/categories">Create Categories</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>Your latest wedding-related purchases</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/dashboard/budget/expenses">Add Expense</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length > 0 ? (
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border-l-4 bg-gray-50" 
                         style={{ borderLeftColor: expense.budget_categories?.color || '#6B7280' }}>
                      <div>
                        <p className="font-semibold">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.budget_categories?.name}
                          {expense.vendors?.name && ` • ${expense.vendors.name}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold" style={{ color: expense.budget_categories?.color || '#6B7280' }}>
                          -${Number(expense.amount).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(expense.expense_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No expenses recorded yet</p>
                  <Button asChild>
                    <Link href="/dashboard/budget/expenses">Add First Expense</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Set Up Your Budget</h3>
            <p className="text-muted-foreground mb-4">
              Complete your onboarding to start tracking your wedding budget
            </p>
            <Button asChild>
              <Link href="/onboarding">Complete Setup</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}