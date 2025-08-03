'use client'

import { useState } from 'react'
import { useBudget, DEFAULT_BUDGET_CATEGORIES, BudgetCategoryInsert, BudgetExpenseInsert } from '@/hooks/useBudget'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { BudgetAnalyticsNew } from '@/components/budget/BudgetAnalyticsNew'
import { PaymentOverview } from '@/components/budget/PaymentOverview'
import { BudgetTemplates } from '@/components/budget/BudgetTemplates'
import { BudgetAlerts } from '@/components/budget/BudgetAlerts'
import { BudgetHealthIndicator } from '@/components/budget/BudgetHealthIndicator'
import { QuickExpenseEntry } from '@/components/budget/QuickExpenseEntry'
import { BudgetExport } from '@/components/budget/BudgetExport'
import { BudgetDashboard } from '@/components/budget/BudgetDashboard'
import { CategoryManager } from '@/components/budget/CategoryManager'
import { ExpenseTracker } from '@/components/budget/ExpenseTracker'
import { BudgetComparison } from '@/components/budget/BudgetComparison'
import { useAuth } from '@/contexts/AuthContext'

export default function BudgetPage() {
  const { couple } = useAuth()
  const {
    categories,
    expenses,
    templates,
    alerts,
    loading,
    error,
    budgetStats,
    addCategory,
    addExpense,
    updateCategory,
    deleteExpense,
    initializeDefaultCategories,
    initializeFromTemplate,
    refreshBudget
  } = useBudget()

  const [activeTab, setActiveTab] = useState<'dashboard' | 'categories' | 'expenses' | 'analytics' | 'comparison' | 'payments'>('dashboard')


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold text-ink">Budget</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your budget...</p>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh
      onRefresh={refreshBudget}
      className="min-h-screen"
      pullText="Pull to refresh budget"
      releaseText="Release to refresh"
      loadingText="Updating budget data..."
      successText="Budget updated!"
    >
      <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink">Budget</h1>
          <p className="text-gray-600 mt-1">Track your wedding expenses and stay on budget</p>
        </div>
        <div className="flex gap-2">
          {categories.length > 0 && <BudgetExport />}
        </div>
      </div>

      {/* Tabs */}
      {categories.length > 0 && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit overflow-x-auto">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "px-4 py-2 whitespace-nowrap",
              activeTab === 'dashboard' && "bg-white shadow-sm"
            )}
          >
            Dashboard
          </Button>
          <Button
            variant={activeTab === 'categories' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('categories')}
            className={cn(
              "px-4 py-2 whitespace-nowrap",
              activeTab === 'categories' && "bg-white shadow-sm"
            )}
          >
            Categories
          </Button>
          <Button
            variant={activeTab === 'expenses' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('expenses')}
            className={cn(
              "px-4 py-2 whitespace-nowrap",
              activeTab === 'expenses' && "bg-white shadow-sm"
            )}
          >
            Expenses
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-4 py-2 whitespace-nowrap",
              activeTab === 'analytics' && "bg-white shadow-sm"
            )}
          >
            Analytics
          </Button>
          <Button
            variant={activeTab === 'comparison' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('comparison')}
            className={cn(
              "px-4 py-2 whitespace-nowrap",
              activeTab === 'comparison' && "bg-white shadow-sm"
            )}
          >
            Compare
          </Button>
          <Button
            variant={activeTab === 'payments' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('payments')}
            className={cn(
              "px-4 py-2 whitespace-nowrap",
              activeTab === 'payments' && "bg-white shadow-sm"
            )}
          >
            Payments
          </Button>
        </div>
      )}

      {/* Budget Alerts */}
      {alerts.length > 0 && <BudgetAlerts />}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <p className="text-red-700">{error}</p>
              <Button variant="secondary" size="sm" onClick={refreshBudget} className="ml-auto">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initialize Default Categories */}
      {categories.length === 0 && !loading && (
        <>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="font-semibold text-blue-900">Set Up Your Budget</h3>
                  <p className="text-blue-700">Choose a template or start with default categories</p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button onClick={initializeDefaultCategories}>
                    Use Default Categories
                  </Button>
                  <Button variant="secondary">
                    Choose Template Below
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Templates */}
          {templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Budget Templates</CardTitle>
                <CardDescription>Select a template based on your wedding style and budget</CardDescription>
              </CardHeader>
              <CardContent>
                <BudgetTemplates onTemplateSelected={refreshBudget} />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Budget Overview Stats */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-ink">
                ${budgetStats.totalBudget.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">Total Budget</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-accent">
                ${budgetStats.totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">Total Spent ({budgetStats.percentageSpent}%)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className={cn(
                "text-2xl font-bold",
                budgetStats.totalRemaining >= 0 ? "text-green-600" : "text-red-600"
              )}>
                ${Math.abs(budgetStats.totalRemaining).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">
                {budgetStats.totalRemaining >= 0 ? 'Remaining' : 'Over Budget'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-ink">{budgetStats.expenseCount}</div>
              <p className="text-xs text-gray-500">Total Expenses</p>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Tab Content */}
      {activeTab === 'dashboard' ? (
        /* Dashboard Tab */
        <BudgetDashboard 
          categories={categories}
          expenses={expenses}
          totalBudget={couple?.budget_total || 50000}
        />
      ) : activeTab === 'categories' ? (
        /* Categories Tab */
        <CategoryManager 
          categories={categories}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
        />
      ) : activeTab === 'expenses' ? (
        /* Expenses Tab */
        <ExpenseTracker 
          expenses={expenses}
          categories={categories}
          onAddExpense={addExpense}
          onDeleteExpense={deleteExpense}
        />
      ) : activeTab === 'comparison' ? (
        /* Comparison Tab */
        <BudgetComparison 
          categories={categories}
        />
      ) : activeTab === 'analytics' ? (
        /* Analytics Tab */
        <BudgetAnalyticsNew 
          coupleId={couple?.id || ''} 
          totalBudget={couple?.budget_total || 50000}
        />
      ) : (
        /* Payments Tab */
        <PaymentOverview 
          expenses={expenses}
          categories={categories}
          onPaymentUpdate={refreshBudget}
        />
      )}
    </div>
    </PullToRefresh>
  )
}