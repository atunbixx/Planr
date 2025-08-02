'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/utils/cn'
import { BudgetAnalytics, CategoryBreakdown } from '@/hooks/useBudgetItems'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  CreditCard,
  X,
  ChevronRight
} from 'lucide-react'

interface BudgetAlert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  category: string
  title: string
  description: string
  action?: string
  actionLabel?: string
  value?: number
  percentage?: number
  dueDate?: string
}

interface BudgetAlertsEnhancedProps {
  analytics: BudgetAnalytics
  categoryBreakdown: CategoryBreakdown[]
  totalBudget: number
  weddingDate?: string
  onActionClick?: (alert: BudgetAlert) => void
}

export function BudgetAlertsEnhanced({
  analytics,
  categoryBreakdown,
  totalBudget,
  weddingDate,
  onActionClick
}: BudgetAlertsEnhancedProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  // Generate alerts based on analytics
  const generateAlerts = (): BudgetAlert[] => {
    const alerts: BudgetAlert[] = []
    let alertId = 0

    // Overall budget alerts
    const budgetUsed = (analytics.totalCommitted / totalBudget) * 100
    if (budgetUsed > 100) {
      alerts.push({
        id: `alert-${alertId++}`,
        type: 'critical',
        category: 'budget',
        title: 'Budget Exceeded',
        description: `You've committed ${budgetUsed.toFixed(0)}% of your total budget, exceeding by $${(analytics.totalCommitted - totalBudget).toLocaleString()}.`,
        action: 'review-budget',
        actionLabel: 'Review Budget',
        value: analytics.totalCommitted - totalBudget,
        percentage: budgetUsed
      })
    } else if (budgetUsed > 90) {
      alerts.push({
        id: `alert-${alertId++}`,
        type: 'warning',
        category: 'budget',
        title: 'Approaching Budget Limit',
        description: `You've committed ${budgetUsed.toFixed(0)}% of your total budget. Only $${(totalBudget - analytics.totalCommitted).toLocaleString()} remaining.`,
        action: 'review-budget',
        actionLabel: 'Review Allocations',
        value: totalBudget - analytics.totalCommitted,
        percentage: budgetUsed
      })
    }

    // Overdue payment alerts
    if (analytics.overdueItems > 0) {
      alerts.push({
        id: `alert-${alertId++}`,
        type: 'critical',
        category: 'payment',
        title: 'Overdue Payments',
        description: `You have ${analytics.overdueItems} overdue payment${analytics.overdueItems > 1 ? 's' : ''} that need immediate attention.`,
        action: 'view-overdue',
        actionLabel: 'View Overdue Items',
        value: analytics.overdueItems
      })
    }

    // Category-specific alerts
    categoryBreakdown.forEach(category => {
      if (category.allocatedAmount && category.allocatedAmount > 0) {
        const percentageUsed = (category.finalTotal / category.allocatedAmount) * 100
        
        if (percentageUsed > 100) {
          alerts.push({
            id: `alert-${alertId++}`,
            type: 'warning',
            category: 'category',
            title: `${category.categoryName} Over Budget`,
            description: `This category is ${(percentageUsed - 100).toFixed(0)}% over budget ($${(category.finalTotal - category.allocatedAmount).toLocaleString()} over).`,
            action: `review-category-${category.categoryId}`,
            actionLabel: 'Review Category',
            value: category.finalTotal - category.allocatedAmount,
            percentage: percentageUsed
          })
        } else if (percentageUsed > 80 && percentageUsed <= 100) {
          alerts.push({
            id: `alert-${alertId++}`,
            type: 'info',
            category: 'category',
            title: `${category.categoryName} Nearly Spent`,
            description: `${percentageUsed.toFixed(0)}% of this category's budget has been used. $${(category.allocatedAmount - category.finalTotal).toLocaleString()} remaining.`,
            action: `review-category-${category.categoryId}`,
            actionLabel: 'View Details',
            value: category.allocatedAmount - category.finalTotal,
            percentage: percentageUsed
          })
        }
      }
    })

    // Payment progress alerts
    const paymentProgress = analytics.totalCommitted > 0 ? (analytics.totalPaid / analytics.totalCommitted) * 100 : 0
    if (paymentProgress < 50 && analytics.itemsCommitted > 5) {
      alerts.push({
        id: `alert-${alertId++}`,
        type: 'info',
        category: 'payment',
        title: 'Payment Progress',
        description: `Only ${paymentProgress.toFixed(0)}% of committed expenses have been paid. Consider reviewing your payment schedule.`,
        action: 'view-payments',
        actionLabel: 'View Payment Schedule',
        percentage: paymentProgress
      })
    }

    // Wedding date approaching alerts
    if (weddingDate) {
      const daysUntilWedding = Math.ceil((new Date(weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilWedding <= 30 && daysUntilWedding > 0) {
        alerts.push({
          id: `alert-${alertId++}`,
          type: 'warning',
          category: 'timeline',
          title: 'Wedding Approaching',
          description: `Your wedding is in ${daysUntilWedding} days. Ensure all final payments and confirmations are complete.`,
          action: 'view-timeline',
          actionLabel: 'View Timeline',
          dueDate: weddingDate
        })
      }
      
      if (daysUntilWedding <= 60 && analytics.itemsPlanned > 0) {
        alerts.push({
          id: `alert-${alertId++}`,
          type: 'info',
          category: 'planning',
          title: 'Finalize Planned Items',
          description: `You have ${analytics.itemsPlanned} items still in planning status. Time to finalize these decisions.`,
          action: 'view-planned',
          actionLabel: 'View Planned Items',
          value: analytics.itemsPlanned
        })
      }
    }

    // Success alerts
    if (budgetUsed < 50 && analytics.itemsPaid > 10) {
      alerts.push({
        id: `alert-${alertId++}`,
        type: 'success',
        category: 'budget',
        title: 'Great Budget Management',
        description: `You're tracking well with only ${budgetUsed.toFixed(0)}% of budget committed and ${analytics.itemsPaid} items already paid.`,
        percentage: budgetUsed
      })
    }

    return alerts.filter(alert => !dismissedAlerts.has(alert.id))
  }

  const alerts = generateAlerts()

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-orange-200 bg-orange-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'budget':
        return <DollarSign className="h-4 w-4" />
      case 'payment':
        return <CreditCard className="h-4 w-4" />
      case 'timeline':
        return <Calendar className="h-4 w-4" />
      case 'category':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId))
  }

  // Group alerts by type
  const criticalAlerts = alerts.filter(a => a.type === 'critical')
  const warningAlerts = alerts.filter(a => a.type === 'warning')
  const infoAlerts = alerts.filter(a => a.type === 'info')
  const successAlerts = alerts.filter(a => a.type === 'success')

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">No alerts at this time</p>
            <p className="text-gray-600 mt-1">Your budget is on track!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {criticalAlerts.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-900">Critical</p>
                  <p className="text-2xl font-bold text-red-700">{criticalAlerts.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        )}
        
        {warningAlerts.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-900">Warnings</p>
                  <p className="text-2xl font-bold text-orange-700">{warningAlerts.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        )}
        
        {infoAlerts.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Info</p>
                  <p className="text-2xl font-bold text-blue-700">{infoAlerts.length}</p>
                </div>
                <Info className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        )}
        
        {successAlerts.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Success</p>
                  <p className="text-2xl font-bold text-green-700">{successAlerts.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alert List */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Alerts & Insights</CardTitle>
          <CardDescription>
            Important notifications about your wedding budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map(alert => (
              <Alert
                key={alert.id}
                className={cn(
                  "relative cursor-pointer hover:shadow-md transition-shadow",
                  getAlertColor(alert.type)
                )}
                onClick={() => alert.action && onActionClick?.(alert)}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <AlertTitle className="flex items-center gap-2 mb-1">
                      {alert.title}
                      <Badge variant="secondary" className="ml-2">
                        {getCategoryIcon(alert.category)}
                        <span className="ml-1 capitalize">{alert.category}</span>
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      {alert.description}
                    </AlertDescription>
                    
                    {(alert.value !== undefined || alert.percentage !== undefined) && (
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {alert.value !== undefined && (
                          <span className="font-medium">
                            ${alert.value.toLocaleString()}
                          </span>
                        )}
                        {alert.percentage !== undefined && (
                          <span className="font-medium">
                            {alert.percentage.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                    
                    {alert.actionLabel && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          alert.action && onActionClick?.(alert)
                        }}
                      >
                        {alert.actionLabel}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      dismissAlert(alert.id)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}