'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import { DollarSign, TrendingUp, TrendingDown, Receipt } from 'lucide-react'

interface BudgetSummaryCardProps {
  totalBudget: number
  totalSpent: number
  totalRemaining: number
  percentageSpent: number
  expenseCount: number
}

export function BudgetSummaryCard({
  totalBudget,
  totalSpent,
  totalRemaining,
  percentageSpent,
  expenseCount
}: BudgetSummaryCardProps) {
  return (
    <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Main Summary */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-600">Total Wedding Budget</h3>
            <p className="text-4xl font-bold text-ink mt-2">${totalBudget.toLocaleString()}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Budget Progress</span>
              <span className={cn(
                "font-medium",
                percentageSpent > 100 ? "text-red-600" :
                percentageSpent > 80 ? "text-orange-600" :
                "text-green-600"
              )}>
                {percentageSpent}% spent
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={cn(
                  "h-3 rounded-full transition-all",
                  percentageSpent > 100 ? "bg-red-500" :
                  percentageSpent > 80 ? "bg-orange-500" :
                  "bg-green-500"
                )}
                style={{ width: `${Math.min(percentageSpent, 100)}%` }}
              />
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="h-4 w-4 text-accent" />
                <span className="text-sm text-gray-600">Spent</span>
              </div>
              <p className="text-xl font-bold text-accent">${totalSpent.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{expenseCount} expenses</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                {totalRemaining >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm text-gray-600">Remaining</span>
              </div>
              <p className={cn(
                "text-xl font-bold",
                totalRemaining >= 0 ? "text-green-600" : "text-red-600"
              )}>
                ${Math.abs(totalRemaining).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {totalRemaining >= 0 ? 'Under budget' : 'Over budget'}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Average per expense</span>
              <span className="font-medium">
                ${expenseCount > 0 ? Math.round(totalSpent / expenseCount).toLocaleString() : 0}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}