'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/utils/cn'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  PieChart,
  BarChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Receipt
} from 'lucide-react'

interface BudgetItem {
  id: string
  category: string
  vendor_name: string
  estimated_cost: number
  actual_cost: number | null
  is_paid: boolean
  payment_due_date: string | null
  notes: string | null
}

interface CategorySpending {
  category: string
  estimated: number
  actual: number
  items: number
}

interface BudgetAnalyticsProps {
  coupleId: string
  totalBudget: number
}

export function BudgetAnalytics({ coupleId, totalBudget }: BudgetAnalyticsProps) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([])
  const supabase = createClientComponentClient()

  // Fetch budget data
  useEffect(() => {
    fetchBudgetData()
  }, [coupleId])

  const fetchBudgetData = async () => {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('couple_id', coupleId)
        .order('category', { ascending: true })

      if (error) throw error

      setBudgetItems(data || [])
      calculateCategoryData(data || [])
    } catch (error) {
      console.error('Error fetching budget data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateCategoryData = (items: BudgetItem[]) => {
    const categoryMap = new Map<string, CategorySpending>()

    items.forEach(item => {
      const existing = categoryMap.get(item.category) || {
        category: item.category,
        estimated: 0,
        actual: 0,
        items: 0
      }

      existing.estimated += item.estimated_cost
      existing.actual += item.actual_cost || 0
      existing.items += 1

      categoryMap.set(item.category, existing)
    })

    setCategoryData(Array.from(categoryMap.values()))
  }

  // Calculate totals
  const totalEstimated = budgetItems.reduce((sum, item) => sum + item.estimated_cost, 0)
  const totalActual = budgetItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0)
  const totalPaid = budgetItems.filter(item => item.is_paid).reduce((sum, item) => sum + (item.actual_cost || 0), 0)
  const totalUnpaid = totalActual - totalPaid

  // Calculate percentages
  const budgetUsedPercentage = totalBudget > 0 ? (totalEstimated / totalBudget) * 100 : 0
  const actualSpentPercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0

  // Get top spending categories
  const topCategories = [...categoryData]
    .sort((a, b) => b.actual - a.actual)
    .slice(0, 5)

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
      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {budgetUsedPercentage.toFixed(1)}% allocated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent So Far</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalActual.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {actualSpentPercentage.toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalActual > 0 ? ((totalPaid / totalActual) * 100).toFixed(0) : 0}% of spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalUnpaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {budgetItems.filter(item => !item.is_paid && item.actual_cost).length} unpaid items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Track your spending against your budget</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Allocated Budget</span>
              <span className="font-medium">${totalEstimated.toLocaleString()}</span>
            </div>
            <Progress value={budgetUsedPercentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Actual Spending</span>
              <span className="font-medium">${totalActual.toLocaleString()}</span>
            </div>
            <Progress 
              value={actualSpentPercentage} 
              className={cn(
                "h-2",
                actualSpentPercentage > 100 && "bg-red-100"
              )}
            />
          </div>

          {actualSpentPercentage > budgetUsedPercentage && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span>Actual spending exceeds allocated budget</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spending Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
            <CardDescription>Where your money is going</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map((category, index) => {
                const percentage = totalActual > 0 ? (category.actual / totalActual) * 100 : 0
                return (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">
                        {category.category.replace('_', ' ')}
                      </span>
                      <span>${category.actual.toLocaleString()}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{percentage.toFixed(1)}% of total</span>
                      <span>{category.items} items</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Budget vs Actual by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
            <CardDescription>Compare estimated vs actual costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryData.map(category => {
                const variance = category.actual - category.estimated
                const variancePercent = category.estimated > 0 
                  ? ((category.actual - category.estimated) / category.estimated) * 100 
                  : 0

                return (
                  <div key={category.category} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {category.category.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        {variance > 0 ? (
                          <TrendingUp className="h-4 w-4 text-red-600" />
                        ) : variance < 0 ? (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        ) : null}
                        <span className={cn(
                          "text-sm font-medium",
                          variance > 0 ? "text-red-600" : variance < 0 ? "text-green-600" : ""
                        )}>
                          {variance > 0 ? '+' : ''}{variancePercent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-muted-foreground">
                        Est: ${category.estimated.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Actual: ${category.actual.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Payments</CardTitle>
          <CardDescription>Items that need to be paid soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {budgetItems
              .filter(item => !item.is_paid && item.actual_cost && item.payment_due_date)
              .sort((a, b) => new Date(a.payment_due_date!).getTime() - new Date(b.payment_due_date!).getTime())
              .slice(0, 5)
              .map(item => {
                const dueDate = new Date(item.payment_due_date!)
                const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.vendor_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Due {daysUntilDue > 0 ? `in ${daysUntilDue} days` : 'today'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${item.actual_cost?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.category.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}