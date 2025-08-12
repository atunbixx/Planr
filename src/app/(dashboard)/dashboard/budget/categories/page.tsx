import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/server'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, ArrowLeft } from 'lucide-react'
import AddCategoryDialog from './components/AddCategoryDialog'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function BudgetCategoriesPage() {
  const user = await requireAuth()
  const userId = user.id
  
  let categories: any[] = []
  let budgetData: any = null
  
  if (user?.email) {
    // Get user's couple data and budget categories
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
            allocatedAmount,
            spentAmount,
            priority,
            industryAveragePercentage
          )
        )
      `)
      .eq('supabase_user_id', user.id)
      .single()
    
    if (userData?.couples?.[0]) {
      const coupleData = userData.couples[0]
      categories = coupleData.budget_categories || []
      
      // Calculate totals
      const totalBudget = Number(coupleData.budget_total) || 0
      const totalSpent = categories.reduce((sum, cat) => sum + (Number(cat.spentAmount) || 0), 0)
      const totalAllocated = categories.reduce((sum, cat) => sum + (Number(cat.allocatedAmount) || 0), 0)
      const remaining = totalBudget - totalSpent
      
      budgetData = {
        totalBudget,
        totalSpent,
        totalAllocated,
        remaining
      }
    }
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Budget Categories</h1>
            <p className="text-gray-600 mt-1">Organize your wedding budget by category</p>
          </div>
        </div>
        <AddCategoryDialog />
      </div>

      {/* Budget Overview */}
      {budgetData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Budget</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">
                ${budgetData.totalBudget.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Allocated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-600">
                ${budgetData.totalAllocated.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Spent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">
                ${budgetData.totalSpent.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unallocated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${budgetData.totalBudget - budgetData.totalAllocated >= 0 ? 'text-gray-600' : 'text-red-600'}`}>
                ${(budgetData.totalBudget - budgetData.totalAllocated).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Budget Categories</CardTitle>
          <CardDescription>
            Manage how your wedding budget is divided across different expense categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((category) => {
                const spent = Number(category.spentAmount) || 0
                const allocated = Number(category.allocatedAmount) || 0
                const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0
                const remaining = allocated - spent
                
                return (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h3 className="font-semibold text-lg">{category.name}</h3>
                          <div className="flex items-center space-x-2 text-sm">
                            {category.priority === 'essential' && (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                🔴 Essential
                              </span>
                            )}
                            {category.priority === 'important' && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                🟡 Important
                              </span>
                            )}
                            {category.priority === 'nice_to_have' && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                🟢 Nice to have
                              </span>
                            )}
                            {category.industryAveragePercentage && (
                              <span className="text-muted-foreground text-xs">
                                Industry avg: {category.industryAveragePercentage}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          ${allocated.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          allocated
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Spent: ${spent.toLocaleString()}</span>
                        <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {remaining >= 0 ? `$${remaining.toLocaleString()} remaining` : `$${Math.abs(remaining).toLocaleString()} over budget`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            percentage <= 100 ? 'bg-blue-600' : 'bg-red-600'
                          }`}
                          style={{ 
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: category.color 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>{percentage}% used</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">No budget categories yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start organizing your wedding budget by creating categories for different types of expenses.
              </p>
              <AddCategoryDialog />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}