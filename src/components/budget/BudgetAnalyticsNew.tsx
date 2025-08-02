'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/utils/cn'
import { useBudget, BudgetCategory, BudgetExpense } from '@/hooks/useBudget'
import {
  PieChart,
  BarChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Receipt,
  Calendar,
  CreditCard,
  Wallet
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface BudgetAnalyticsProps {
  coupleId: string
  totalBudget: number
}

export function BudgetAnalyticsNew({ coupleId, totalBudget }: BudgetAnalyticsProps) {
  const { categories, expenses, loading, budgetStats } = useBudget()
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '30d' | '90d' | '180d'>('all')

  // Filter expenses by period
  const filteredExpenses = expenses.filter(expense => {
    if (selectedPeriod === 'all') return true
    
    const daysAgo = {
      '30d': 30,
      '90d': 90,
      '180d': 180
    }[selectedPeriod]
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)
    
    return new Date(expense.date_incurred) >= cutoffDate
  })

  // Calculate spending by category for pie chart
  const categorySpending = categories.map(cat => ({
    name: cat.name,
    value: cat.spent_amount,
    allocated: cat.allocated_amount,
    percentage: cat.allocated_amount > 0 ? (cat.spent_amount / cat.allocated_amount) * 100 : 0
  })).filter(cat => cat.value > 0)

  // Calculate monthly spending trend
  const monthlySpending = filteredExpenses.reduce((acc, expense) => {
    const month = new Date(expense.date_incurred).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    acc[month] = (acc[month] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const monthlyData = Object.entries(monthlySpending)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

  // Colors for charts
  const COLORS = ['#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899']

  // Get recent transactions
  const recentTransactions = filteredExpenses.slice(0, 5)

  // Calculate payment method breakdown
  const paymentMethods = filteredExpenses.reduce((acc, expense) => {
    const method = expense.payment_method || 'Not specified'
    acc[method] = (acc[method] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const paymentData = Object.entries(paymentMethods).map(([method, amount]) => ({
    name: method,
    value: amount
  }))

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={selectedPeriod === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('all')}
        >
          All Time
        </Button>
        <Button
          size="sm"
          variant={selectedPeriod === '30d' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('30d')}
        >
          Last 30 Days
        </Button>
        <Button
          size="sm"
          variant={selectedPeriod === '90d' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('90d')}
        >
          Last 90 Days
        </Button>
        <Button
          size="sm"
          variant={selectedPeriod === '180d' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('180d')}
        >
          Last 6 Months
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {budgetStats.percentageSpent}% spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${budgetStats.totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {budgetStats.expenseCount} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              budgetStats.totalRemaining >= 0 ? "text-green-600" : "text-red-600"
            )}>
              ${Math.abs(budgetStats.totalRemaining).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgetStats.totalRemaining >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Expense</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(budgetStats.averageExpense).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Distribution of your wedding expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={categorySpending}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categorySpending.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Spending Trend */}
        {monthlyData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending Trend</CardTitle>
              <CardDescription>Track your spending over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Budget vs Actual by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual by Category</CardTitle>
          <CardDescription>Compare your allocated budget with actual spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map(category => {
              const percentage = category.allocated_amount > 0 
                ? (category.spent_amount / category.allocated_amount) * 100 
                : 0
              const isOverBudget = category.spent_amount > category.allocated_amount

              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ${category.spent_amount.toLocaleString()} of ${category.allocated_amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOverBudget ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : percentage >= 80 ? (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        isOverBudget ? "text-red-600" : percentage >= 80 ? "text-orange-600" : "text-green-600"
                      )}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={cn(
                      "h-2",
                      isOverBudget ? "[&>div]:bg-red-600" : percentage >= 80 ? "[&>div]:bg-orange-600" : ""
                    )}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map(expense => {
                const category = categories.find(cat => cat.id === expense.category_id)
                return (
                  <div key={expense.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{expense.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(expense.date_incurred).toLocaleDateString()}</span>
                        {category && (
                          <>
                            <span>•</span>
                            <span>{category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${expense.amount.toLocaleString()}</p>
                      {expense.payment_method && (
                        <p className="text-xs text-muted-foreground">{expense.payment_method}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        {paymentData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Breakdown by payment type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsBarChart data={paymentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#8B5CF6" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Categories Over Budget Alert */}
      {budgetStats.categoriesOverBudget > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Budget Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800">
              {budgetStats.categoriesOverBudget} {budgetStats.categoriesOverBudget === 1 ? 'category is' : 'categories are'} over budget.
              Consider reallocating funds or adjusting your spending to stay within your overall budget.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}