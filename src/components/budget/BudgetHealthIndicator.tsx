'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { useBudget } from '@/hooks/useBudget'
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  AlertTriangle
} from 'lucide-react'

export function BudgetHealthIndicator() {
  const { budgetStats, categories } = useBudget()

  // Calculate health score (0-100)
  const calculateHealthScore = () => {
    let score = 100

    // Deduct points for overspending
    if (budgetStats.percentageSpent > 100) {
      score -= 30
    } else if (budgetStats.percentageSpent > 90) {
      score -= 15
    } else if (budgetStats.percentageSpent > 80) {
      score -= 5
    }

    // Deduct points for categories over budget
    const overBudgetPenalty = Math.min(budgetStats.categoriesOverBudget * 5, 25)
    score -= overBudgetPenalty

    // Deduct points for unbalanced spending
    const categorySpending = categories.map(cat => 
      cat.allocated_amount > 0 ? (cat.spent_amount / cat.allocated_amount) : 0
    )
    const spendingVariance = categorySpending.length > 0
      ? Math.sqrt(categorySpending.reduce((sum, pct) => sum + Math.pow(pct - budgetStats.percentageSpent / 100, 2), 0) / categorySpending.length)
      : 0
    score -= Math.min(spendingVariance * 50, 20)

    return Math.max(0, Math.min(100, score))
  }

  const healthScore = calculateHealthScore()

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', icon: CheckCircle }
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', icon: Activity }
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600', icon: AlertCircle }
    return { label: 'Poor', color: 'text-red-600', icon: XCircle }
  }

  const healthStatus = getHealthStatus(healthScore)
  const HealthIcon = healthStatus.icon

  // Get recommendations
  const getRecommendations = () => {
    const recommendations = []

    if (budgetStats.percentageSpent > 100) {
      recommendations.push({
        type: 'critical',
        message: 'You have exceeded your total budget. Consider reducing expenses or adjusting your budget.'
      })
    }

    if (budgetStats.categoriesOverBudget > 0) {
      recommendations.push({
        type: 'warning',
        message: `${budgetStats.categoriesOverBudget} ${budgetStats.categoriesOverBudget === 1 ? 'category is' : 'categories are'} over budget. Review and reallocate funds.`
      })
    }

    if (budgetStats.percentageSpent > 80 && budgetStats.percentageSpent <= 100) {
      recommendations.push({
        type: 'info',
        message: 'You\'re approaching your budget limit. Monitor spending carefully.'
      })
    }

    const highPriorityOverspend = categories.filter(cat => 
      cat.priority <= 2 && cat.spent_amount > cat.allocated_amount
    )
    if (highPriorityOverspend.length > 0) {
      recommendations.push({
        type: 'warning',
        message: 'High priority categories are over budget. Consider reallocating from lower priorities.'
      })
    }

    return recommendations
  }

  const recommendations = getRecommendations()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Health</CardTitle>
        <CardDescription>Overall financial wellness of your wedding budget</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Score */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-4">
            <div className="text-center">
              <HealthIcon className={cn("h-8 w-8 mb-1", healthStatus.color)} />
              <p className={cn("text-2xl font-bold", healthStatus.color)}>
                {healthScore}
              </p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-sm",
              healthScore >= 80 && "bg-green-50 text-green-700 border-green-200",
              healthScore >= 60 && healthScore < 80 && "bg-blue-50 text-blue-700 border-blue-200",
              healthScore >= 40 && healthScore < 60 && "bg-yellow-50 text-yellow-700 border-yellow-200",
              healthScore < 40 && "bg-red-50 text-red-700 border-red-200"
            )}
          >
            {healthStatus.label} Health
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Budget Utilization</span>
              <span className="font-medium">{budgetStats.percentageSpent}%</span>
            </div>
            <Progress 
              value={Math.min(budgetStats.percentageSpent, 100)} 
              className={cn(
                "h-2",
                budgetStats.percentageSpent > 100 && "[&>div]:bg-red-600",
                budgetStats.percentageSpent > 80 && budgetStats.percentageSpent <= 100 && "[&>div]:bg-orange-600"
              )}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Categories on Track</span>
            <span className="font-medium">
              {categories.length - budgetStats.categoriesOverBudget} / {categories.length}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Average Expense</span>
            <span className="font-medium">
              ${Math.round(budgetStats.averageExpense).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recommendations</p>
            {recommendations.map((rec, idx) => (
              <div 
                key={idx}
                className={cn(
                  "flex items-start gap-2 text-sm p-2 rounded-lg",
                  rec.type === 'critical' && "bg-red-50 text-red-700",
                  rec.type === 'warning' && "bg-yellow-50 text-yellow-700",
                  rec.type === 'info' && "bg-blue-50 text-blue-700"
                )}
              >
                {rec.type === 'critical' && <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                {rec.type === 'warning' && <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                {rec.type === 'info' && <Activity className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                <span>{rec.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Trend Indicator */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t">
          {budgetStats.totalRemaining >= 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">Under Budget</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Over Budget</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}