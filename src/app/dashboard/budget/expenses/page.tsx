import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AddExpenseDialog from './components/AddExpenseDialog'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ExpensesPage() {
  const user = await currentUser()
  
  let expenses: any[] = []
  let categories: any[] = []
  let vendors: any[] = []
  
  if (user?.id) {
    // Get user's couple data first
    const { data: userData } = await supabase
      .from('users')
      .select(`
        couples (
          id,
          budget_categories (
            id,
            name,
            icon,
            color
          )
        )
      `)
      .eq('clerk_user_id', user.id)
      .single()
    
    if (userData?.couples?.[0]) {
      const coupleData = userData.couples[0]
      categories = coupleData.budget_categories || []
      
      // Get expenses
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
      
      expenses = expensesData || []
      
      // Get vendors for the dropdown
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('couple_id', coupleData.id)
        .order('name')
      
      vendors = vendorsData || []
    }
  }

  // Group expenses by month/year
  const groupedExpenses = expenses.reduce((groups, expense) => {
    const date = new Date(expense.expense_date)
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    if (!groups[monthYear]) {
      groups[monthYear] = []
    }
    groups[monthYear].push(expense)
    
    return groups
  }, {} as Record<string, typeof expenses>)

  // Calculate totals
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.expense_date)
    const now = new Date()
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
  })
  const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/budget">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Budget
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expense Tracker</h1>
            <p className="text-gray-600 mt-1">Track all your wedding-related expenses</p>
          </div>
        </div>
        <AddExpenseDialog categories={categories} vendors={vendors} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${currentMonthTotal.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonthExpenses.length} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average per Transaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${expenses.length > 0 ? Math.round(totalSpent / expenses.length).toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      {expenses.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedExpenses).map(([monthYear, monthExpenses]) => (
            <Card key={monthYear}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{monthYear}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    ${(monthExpenses as any[]).reduce((sum, exp) => sum + Number(exp.amount), 0).toLocaleString()} 
                    ({(monthExpenses as any[]).length} expenses)
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(monthExpenses as any[]).map((expense: any) => (
                    <div 
                      key={expense.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: expense.budget_categories?.color || '#6B7280' }}
                        ></div>
                        <div>
                          <h4 className="font-semibold">{expense.description}</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{expense.budget_categories?.name || 'Uncategorized'}</span>
                            {expense.vendors?.name && (
                              <>
                                <span>•</span>
                                <span>{expense.vendors.name}</span>
                              </>
                            )}
                            {expense.payment_method && expense.payment_method !== 'other' && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{expense.payment_method}</span>
                              </>
                            )}
                          </div>
                          {expense.notes && (
                            <p className="text-sm text-muted-foreground mt-1 italic">
                              {expense.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-red-600">
                          -${Number(expense.amount).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(expense.expense_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">No expenses tracked yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start tracking your wedding expenses to stay on top of your budget.
            </p>
            <AddExpenseDialog categories={categories} vendors={vendors} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}