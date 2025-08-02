'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { format, subMonths } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Calendar,
  ShoppingCart,
  CreditCard
} from 'lucide-react'

interface SpendingTrend {
  month: string
  items_added: number
  amount_committed: number
  amount_paid: number
  cumulative_committed: number
  cumulative_paid: number
}

interface BudgetSpendingTrendsProps {
  trends: SpendingTrend[]
  totalBudget: number
  weddingDate?: string
}

export function BudgetSpendingTrends({ trends, totalBudget, weddingDate }: BudgetSpendingTrendsProps) {
  const [timeRange, setTimeRange] = useState<3 | 6 | 12>(6)
  const [filteredTrends, setFilteredTrends] = useState<SpendingTrend[]>([])

  useEffect(() => {
    // Filter trends based on time range
    const cutoffDate = subMonths(new Date(), timeRange)
    const filtered = trends.filter(trend => new Date(trend.month) >= cutoffDate)
    setFilteredTrends(filtered)
  }, [trends, timeRange])

  // Calculate statistics
  const latestTrend = filteredTrends[filteredTrends.length - 1]
  const firstTrend = filteredTrends[0]
  
  const totalCommitted = latestTrend?.cumulative_committed || 0
  const totalPaid = latestTrend?.cumulative_paid || 0
  const percentageOfBudget = totalBudget > 0 ? (totalCommitted / totalBudget) * 100 : 0
  
  const averageMonthlySpending = filteredTrends.length > 0
    ? filteredTrends.reduce((sum, t) => sum + t.amount_paid, 0) / filteredTrends.length
    : 0

  const monthlyGrowth = firstTrend && latestTrend && filteredTrends.length > 1
    ? ((latestTrend.cumulative_committed - firstTrend.cumulative_committed) / filteredTrends.length)
    : 0

  // Prepare chart data
  const chartData = filteredTrends.map(trend => ({
    ...trend,
    monthLabel: format(new Date(trend.month), 'MMM yyyy'),
    shortLabel: format(new Date(trend.month), 'MMM'),
    percentageOfBudget: totalBudget > 0 ? (trend.cumulative_committed / totalBudget) * 100 : 0
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <p className="font-medium mb-2">{data.monthLabel}</p>
          <div className="space-y-1 text-sm">
            <p>Items Added: {data.items_added}</p>
            <p>Committed: ${data.amount_committed.toLocaleString()}</p>
            <p className="text-green-600">Paid: ${data.amount_paid.toLocaleString()}</p>
            <p className="font-medium mt-2">
              Total: ${data.cumulative_committed.toLocaleString()} ({data.percentageOfBudget.toFixed(1)}% of budget)
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Spending Trends Analysis</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={timeRange === 3 ? "default" : "outline"}
            onClick={() => setTimeRange(3)}
          >
            3 Months
          </Button>
          <Button
            size="sm"
            variant={timeRange === 6 ? "default" : "outline"}
            onClick={() => setTimeRange(6)}
          >
            6 Months
          </Button>
          <Button
            size="sm"
            variant={timeRange === 12 ? "default" : "outline"}
            onClick={() => setTimeRange(12)}
          >
            12 Months
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Committed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommitted.toLocaleString()}</div>
            <p className="text-sm text-gray-600 mt-1">
              {percentageOfBudget.toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalPaid.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {totalCommitted > 0 ? ((totalPaid / totalCommitted) * 100).toFixed(0) : 0}% of committed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Monthly Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${averageMonthlySpending.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Average spending/month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Growth Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              monthlyGrowth > 0 ? "text-orange-600" : "text-green-600"
            )}>
              ${Math.abs(monthlyGrowth).toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Per month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cumulative Spending Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Spending Progress</CardTitle>
          <CardDescription>
            Track how your spending has grown over time compared to your budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shortLabel" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Budget reference line */}
                <ReferenceLine 
                  yAxisId="left"
                  y={totalBudget} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  label="Total Budget"
                />
                
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cumulative_committed"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Total Committed"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cumulative_paid"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Total Paid"
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="percentageOfBudget"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="% of Budget"
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Activity</CardTitle>
          <CardDescription>
            Number of items added and amounts committed each month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shortLabel" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Bar
                  yAxisId="left"
                  dataKey="amount_committed"
                  fill="#3b82f6"
                  name="Amount Committed"
                />
                <Bar
                  yAxisId="left"
                  dataKey="amount_paid"
                  fill="#10b981"
                  name="Amount Paid"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="items_added"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Items Added"
                  dot={{ fill: '#f97316', r: 4 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Spending Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Insights</CardTitle>
          <CardDescription>Key insights based on your spending patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Budget Usage */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Budget Utilization</p>
                  <p className="text-sm text-gray-600">
                    You've committed {percentageOfBudget.toFixed(1)}% of your total budget
                  </p>
                </div>
              </div>
              <Badge className={cn(
                percentageOfBudget > 90 ? "bg-red-100 text-red-700" :
                percentageOfBudget > 75 ? "bg-orange-100 text-orange-700" :
                "bg-green-100 text-green-700"
              )}>
                {percentageOfBudget > 90 ? "High" :
                 percentageOfBudget > 75 ? "Moderate" :
                 "Healthy"}
              </Badge>
            </div>

            {/* Payment Progress */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Payment Progress</p>
                  <p className="text-sm text-gray-600">
                    {totalCommitted > 0 ? ((totalPaid / totalCommitted) * 100).toFixed(0) : 0}% of committed expenses paid
                  </p>
                </div>
              </div>
              <span className="text-lg font-semibold text-green-600">
                ${totalPaid.toLocaleString()}
              </span>
            </div>

            {/* Monthly Trend */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  {monthlyGrowth > 0 ? 
                    <TrendingUp className="h-5 w-5 text-orange-600" /> :
                    <TrendingDown className="h-5 w-5 text-green-600" />
                  }
                </div>
                <div>
                  <p className="font-medium">Spending Trend</p>
                  <p className="text-sm text-gray-600">
                    Average monthly commitment: ${monthlyGrowth.toLocaleString()}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {filteredTrends.length} months
              </Badge>
            </div>

            {/* Time to Wedding */}
            {weddingDate && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Time to Wedding</p>
                    <p className="text-sm text-gray-600">
                      {Math.ceil((new Date(weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium">
                  ${((totalBudget - totalCommitted) / Math.max(1, Math.ceil((new Date(weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)))).toLocaleString()}/month left
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}