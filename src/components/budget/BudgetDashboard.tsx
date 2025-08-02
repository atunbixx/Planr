'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/utils/cn'
import { BudgetCategory, BudgetExpense } from '@/hooks/useBudget'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Info,
  Target,
  Wallet,
  Receipt,
  PiggyBank
} from 'lucide-react'

interface BudgetDashboardProps {
  categories: BudgetCategory[]
  expenses: BudgetExpense[]
  totalBudget: number
}

export function BudgetDashboard({ categories, expenses, totalBudget }: BudgetDashboardProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  // Calculate key metrics
  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated_amount, 0)
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent_amount, 0)
  const totalRemaining = totalAllocated - totalSpent
  const percentageSpent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0

  // Get categories sorted by spending percentage
  const categoriesBySpending = [...categories].sort((a, b) => {
    const percentA = a.allocated_amount > 0 ? (a.spent_amount / a.allocated_amount) * 100 : 0
    const percentB = b.allocated_amount > 0 ? (b.spent_amount / b.allocated_amount) * 100 : 0
    return percentB - percentA
  })

  // Get top spending categories
  const topSpendingCategories = categoriesBySpending.slice(0, 3)

  // Get categories that need attention
  const categoriesNeedingAttention = categories.filter(cat => {
    const percentage = cat.allocated_amount > 0 ? (cat.spent_amount / cat.allocated_amount) * 100 : 0
    return percentage >= 80
  })

  // Calculate savings opportunities
  const potentialSavings = categories.reduce((sum, cat) => {
    const remaining = cat.allocated_amount - cat.spent_amount
    return sum + (remaining > 0 ? remaining : 0)
  }, 0)

  // Get recent high-value expenses
  const highValueExpenses = expenses
    .filter(exp => exp.amount >= 1000)
    .sort((a, b) => new Date(b.date_incurred).getTime() - new Date(a.date_incurred).getTime())
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Budget Health Score */}
      <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Budget Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-accent">
                  {percentageSpent <= 100 ? (100 - percentageSpent).toFixed(0) : 0}/100
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {percentageSpent <= 50 ? 'Excellent' : 
                   percentageSpent <= 75 ? 'Good' : 
                   percentageSpent <= 90 ? 'Fair' : 
                   percentageSpent <= 100 ? 'Needs Attention' : 'Over Budget'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Allocated</p>
                <p className="text-2xl font-semibold">${totalAllocated.toLocaleString()}</p>
              </div>
            </div>
            <Progress 
              value={Math.min(percentageSpent, 100)} 
              className={cn(
                "h-3",
                percentageSpent <= 50 ? "[&>div]:bg-green-500" :
                percentageSpent <= 75 ? "[&>div]:bg-accent" :
                percentageSpent <= 90 ? "[&>div]:bg-orange-500" :
                "[&>div]:bg-red-500"
              )}
            />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Spent</p>
                <p className="font-semibold">{percentageSpent.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="font-semibold">{Math.max(100 - percentageSpent, 0).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="font-semibold">{categories.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAllocated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Allocated across {categories.length} categories
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">${totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {expenses.length} transactions recorded
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              totalRemaining >= 0 ? "text-green-600" : "text-red-600"
            )}>
              ${Math.abs(totalRemaining).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalRemaining >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${potentialSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available to reallocate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spending Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spending Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Top Spending Categories
            </CardTitle>
            <CardDescription>Where most of your budget is going</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSpendingCategories.map((category, index) => {
                const percentage = category.allocated_amount > 0 
                  ? (category.spent_amount / category.allocated_amount) * 100 
                  : 0
                const remaining = category.allocated_amount - category.spent_amount

                return (
                  <div 
                    key={category.id} 
                    className="space-y-2 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                        <div>
                          <p className="font-semibold">{category.name}</p>
                          <p className="text-sm text-gray-600">
                            ${category.spent_amount.toLocaleString()} of ${category.allocated_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-lg font-semibold",
                          percentage > 100 ? "text-red-600" : 
                          percentage > 80 ? "text-orange-600" : 
                          "text-green-600"
                        )}>
                          {percentage.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {remaining >= 0 ? `$${remaining.toLocaleString()} left` : `$${Math.abs(remaining).toLocaleString()} over`}
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={cn(
                        "h-2 transition-all",
                        percentage > 100 ? "[&>div]:bg-red-500" :
                        percentage > 80 ? "[&>div]:bg-orange-500" :
                        "[&>div]:bg-green-500",
                        hoveredCategory === category.id && "h-3"
                      )}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Budget Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Budget Alerts
            </CardTitle>
            <CardDescription>Categories that need your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {categoriesNeedingAttention.length > 0 ? (
              <div className="space-y-3">
                {categoriesNeedingAttention.map(category => {
                  const percentage = category.allocated_amount > 0 
                    ? (category.spent_amount / category.allocated_amount) * 100 
                    : 0
                  const remaining = category.allocated_amount - category.spent_amount

                  return (
                    <div key={category.id} className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-orange-900">{category.name}</p>
                          <p className="text-sm text-orange-700 mt-1">
                            {percentage >= 100 
                              ? `Over budget by $${Math.abs(remaining).toLocaleString()}`
                              : `${percentage.toFixed(0)}% spent - Only $${remaining.toLocaleString()} remaining`
                            }
                          </p>
                        </div>
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          percentage >= 100 
                            ? "bg-red-100 text-red-700" 
                            : "bg-orange-100 text-orange-700"
                        )}>
                          {percentage >= 100 ? 'Over Budget' : 'Nearly Spent'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">All categories are within healthy spending limits!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent High-Value Expenses */}
      {highValueExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Recent High-Value Expenses
            </CardTitle>
            <CardDescription>Transactions over $1,000</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highValueExpenses.map(expense => {
                const category = categories.find(cat => cat.id === expense.category_id)
                
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{expense.description}</p>
                      <p className="text-sm text-gray-600">
                        {category?.name || 'Uncategorized'} • {new Date(expense.date_incurred).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-900">${expense.amount.toLocaleString()}</p>
                      {expense.payment_status && (
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          expense.payment_status === 'paid' 
                            ? "bg-green-100 text-green-700" 
                            : "bg-gray-100 text-gray-700"
                        )}>
                          {expense.payment_status}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}