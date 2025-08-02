'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { PaymentTimeline } from '@/hooks/useBudgetItems'
import { format } from 'date-fns'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import {
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight
} from 'lucide-react'

interface BudgetPaymentTimelineProps {
  timeline: PaymentTimeline[]
  onMonthClick?: (month: string) => void
}

export function BudgetPaymentTimeline({ timeline, onMonthClick }: BudgetPaymentTimelineProps) {
  // Calculate cumulative amounts
  const timelineWithCumulative = timeline.map((month, index) => {
    const previousMonths = timeline.slice(0, index + 1)
    return {
      ...month,
      cumulativeDue: previousMonths.reduce((sum, m) => sum + m.amountDue, 0),
      cumulativePaid: previousMonths.reduce((sum, m) => sum + m.amountPaid, 0),
      monthLabel: format(new Date(month.paymentMonth), 'MMM yyyy'),
      shortLabel: format(new Date(month.paymentMonth), 'MMM')
    }
  })

  // Calculate totals
  const totalDue = timeline.reduce((sum, month) => sum + month.amountDue, 0)
  const totalPaid = timeline.reduce((sum, month) => sum + month.amountPaid, 0)
  const totalOverdue = timeline.reduce((sum, month) => sum + (month.overdueItems > 0 ? month.amountDue - month.amountPaid : 0), 0)

  // Find upcoming payments
  const currentMonth = format(new Date(), 'yyyy-MM')
  const upcomingPayments = timeline.filter(month => month.paymentMonth >= currentMonth && month.amountDue > month.amountPaid)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <p className="font-medium mb-2">{data.monthLabel}</p>
          <div className="space-y-1 text-sm">
            <p>Due: ${data.amountDue.toLocaleString()}</p>
            <p className="text-green-600">Paid: ${data.amountPaid.toLocaleString()}</p>
            <p>Items: {data.itemsDue} ({data.itemsPaid} paid)</p>
            {data.overdueItems > 0 && (
              <p className="text-red-600">{data.overdueItems} overdue items</p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Total Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDue.toLocaleString()}</div>
            <p className="text-sm text-gray-600 mt-1">
              Across {timeline.length} months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Already Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalPaid.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {totalDue > 0 ? ((totalPaid / totalDue) * 100).toFixed(0) : 0}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${(totalDue - totalPaid).toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              To be paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              totalOverdue > 0 ? "text-red-600" : "text-green-600"
            )}>
              ${totalOverdue.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {totalOverdue > 0 ? 'Action needed' : 'All on track'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
          <CardDescription>Monthly payment amounts due and paid</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineWithCumulative}>
                <defs>
                  <linearGradient id="colorDue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shortLabel" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amountDue"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorDue)"
                  name="Amount Due"
                />
                <Area
                  type="monotone"
                  dataKey="amountPaid"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorPaid)"
                  name="Amount Paid"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cumulative Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Progress</CardTitle>
          <CardDescription>Total amounts due vs paid over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineWithCumulative}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shortLabel" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulativeDue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Total Due"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativePaid"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Total Paid"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Upcoming Payments
            </CardTitle>
            <CardDescription>Payments scheduled for the coming months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPayments.slice(0, 5).map((month, index) => {
                const isCurrentMonth = month.paymentMonth === currentMonth
                const hasOverdue = month.overdueItems > 0

                return (
                  <div
                    key={month.paymentMonth}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-gray-50",
                      isCurrentMonth && "border-blue-500 bg-blue-50",
                      hasOverdue && "border-red-500 bg-red-50"
                    )}
                    onClick={() => onMonthClick?.(month.paymentMonth)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-sm">
                        <Calendar className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {format(new Date(month.paymentMonth), 'MMMM yyyy')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {month.itemsDue} items due
                          {hasOverdue && (
                            <span className="text-red-600 ml-2">
                              ({month.overdueItems} overdue)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">${month.amountDue.toLocaleString()}</p>
                        {month.amountPaid > 0 && (
                          <p className="text-sm text-green-600">
                            ${month.amountPaid.toLocaleString()} paid
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Details</CardTitle>
          <CardDescription>Detailed payment information by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {timeline.map((month) => {
              const isPast = month.paymentMonth < currentMonth
              const isCurrent = month.paymentMonth === currentMonth
              const percentPaid = month.amountDue > 0 ? (month.amountPaid / month.amountDue) * 100 : 0

              return (
                <div
                  key={month.paymentMonth}
                  className={cn(
                    "p-4 rounded-lg",
                    isPast ? "bg-gray-50" : "bg-white border",
                    isCurrent && "border-blue-500"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Calendar className={cn(
                        "h-5 w-5",
                        isPast ? "text-gray-400" : "text-gray-600"
                      )} />
                      <div>
                        <p className={cn(
                          "font-medium",
                          isPast && "text-gray-600"
                        )}>
                          {format(new Date(month.paymentMonth), 'MMMM yyyy')}
                        </p>
                        {isCurrent && (
                          <Badge variant="secondary" className="mt-1">
                            Current Month
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Items</p>
                        <p className="font-medium">
                          {month.itemsPaid}/{month.itemsDue}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="font-medium">
                          ${month.amountDue.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Status</p>
                        {percentPaid === 100 ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        ) : month.overdueItems > 0 && isPast ? (
                          <Badge className="bg-red-100 text-red-700">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        ) : percentPaid > 0 ? (
                          <Badge className="bg-orange-100 text-orange-700">
                            {percentPaid.toFixed(0)}% Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700">
                            Pending
                          </Badge>
                        )}
                      </div>
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