'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { CategoryBreakdown } from '@/hooks/useBudgetItems'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'

interface BudgetCategoryBreakdownProps {
  categories: CategoryBreakdown[]
  totalBudget: number
}

export function BudgetCategoryBreakdown({ categories, totalBudget }: BudgetCategoryBreakdownProps) {
  // Calculate totals
  const totalAllocated = categories.reduce((sum, cat) => sum + (cat.allocatedAmount || 0), 0)
  const totalSpent = categories.reduce((sum, cat) => sum + cat.finalTotal, 0)
  const totalRemaining = totalAllocated - totalSpent

  // Sort categories by spending
  const sortedCategories = [...categories].sort((a, b) => b.finalTotal - a.finalTotal)

  // Prepare data for pie chart
  const pieData = categories
    .filter(cat => cat.finalTotal > 0)
    .map(cat => ({
      name: cat.categoryName,
      value: cat.finalTotal,
      color: cat.color || '#gray'
    }))

  // Prepare data for bar chart
  const barData = categories.map(cat => ({
    name: cat.categoryName,
    allocated: cat.allocatedAmount || 0,
    spent: cat.finalTotal,
    percentage: cat.percentageUsed
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            ${data.value?.toLocaleString() || data.spent?.toLocaleString()}
          </p>
          {data.percentage !== undefined && (
            <p className="text-sm text-gray-600">{data.percentage}% of budget</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Total Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAllocated.toLocaleString()}</div>
            <p className="text-sm text-gray-600 mt-1">
              Across {categories.length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              ${totalSpent.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {((totalSpent / totalAllocated) * 100).toFixed(1)}% of allocated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              totalRemaining >= 0 ? "text-green-600" : "text-red-600"
            )}>
              ${Math.abs(totalRemaining).toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {totalRemaining >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
            <CardDescription>How your budget is distributed across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Allocated vs Spent</CardTitle>
            <CardDescription>Compare your budget allocation with actual spending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="allocated" fill="#e5e7eb" name="Allocated" />
                  <Bar dataKey="spent" fill="#f97316" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>Detailed breakdown of spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedCategories.map((category) => {
              const isOverBudget = category.finalTotal > (category.allocatedAmount || 0)
              const percentageOfTotal = totalBudget > 0 ? (category.finalTotal / totalBudget) * 100 : 0

              return (
                <div key={category.categoryId} className="space-y-2 p-4 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: category.color + '20' }}
                      >
                        <span className="text-xl">{category.icon || '📊'}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{category.categoryName}</p>
                        <p className="text-sm text-gray-600">
                          {category.itemCount} items • {percentageOfTotal.toFixed(1)}% of total budget
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${category.finalTotal.toLocaleString()}
                        {category.allocatedAmount && (
                          <span className="text-sm text-gray-600 font-normal">
                            {' '}/ ${category.allocatedAmount.toLocaleString()}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        {isOverBudget ? (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-600">
                              ${(category.finalTotal - (category.allocatedAmount || 0)).toLocaleString()} over
                            </span>
                          </>
                        ) : category.percentageUsed >= 90 ? (
                          <>
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-orange-600">
                              {category.percentageUsed.toFixed(0)}% used
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">
                              ${((category.allocatedAmount || 0) - category.finalTotal).toLocaleString()} left
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {category.allocatedAmount && (
                    <Progress 
                      value={Math.min(category.percentageUsed, 100)} 
                      className={cn(
                        "h-2",
                        isOverBudget ? "[&>div]:bg-red-500" :
                        category.percentageUsed >= 90 ? "[&>div]:bg-orange-500" :
                        category.percentageUsed >= 75 ? "[&>div]:bg-yellow-500" :
                        "[&>div]:bg-green-500"
                      )}
                    />
                  )}

                  <div className="grid grid-cols-4 gap-4 text-sm mt-3">
                    <div>
                      <p className="text-gray-600">Estimated</p>
                      <p className="font-medium">${category.estimatedTotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Contracted</p>
                      <p className="font-medium">${category.contractedTotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Paid</p>
                      <p className="font-medium text-green-600">
                        ${category.paidTotal.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Pending</p>
                      <p className="font-medium text-orange-600">
                        ${(category.finalTotal - category.paidTotal).toLocaleString()}
                      </p>
                    </div>
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