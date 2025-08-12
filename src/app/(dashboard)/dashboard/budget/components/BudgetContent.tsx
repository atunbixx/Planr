'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatCurrency, type LocaleCode } from '@/lib/localization'
import PaymentScheduleDialog from './PaymentScheduleDialog'
import { Calendar, DollarSign, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface BudgetCategory {
  id: string
  name: string
  icon: string
  color: string
  allocatedAmount: number
  spentAmount: number
  priority: string
  industryAveragePercentage: number
}

interface Expense {
  id: string
  description: string
  amount: number
  expense_date: string
  budget_categories?: {
    name: string
    icon: string
    color: string
  }
  vendors?: {
    name: string
  }
}

interface BudgetData {
  totalBudget: number
  totalSpent: number
  totalAllocated: number
  remaining: number
  spentPercentage: number
}

interface BudgetContentProps {
  budgetData: BudgetData | null
  categories: BudgetCategory[]
  expenses: Expense[]
  locale: LocaleCode
}

export default function BudgetContent({ budgetData, categories, expenses, locale }: BudgetContentProps) {
  const t = useTranslations()
  const [paymentSchedules, setPaymentSchedules] = useState<any[]>([])

  const handlePaymentScheduleSave = (schedule: any) => {
    try {
      setPaymentSchedules(prev => {
        const existing = prev.findIndex(s => s.id === schedule.id)
        if (existing >= 0) {
          return prev.map(s => s.id === schedule.id ? schedule : s)
        }
        return [...prev, schedule]
      })
      toast.success('Payment schedule saved successfully!')
    } catch (error) {
      console.error('Error handling payment schedule save:', error)
      toast.error('Failed to save payment schedule')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('budget.title')}</h1>
        <p className="text-gray-600 mt-2">{t('budget.description')}</p>
      </div>

      {budgetData ? (
        <>
          {/* Budget Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('budget.totalBudget')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(budgetData.totalBudget, 'USD', locale)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('budget.spent')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(budgetData.totalSpent, 'USD', locale)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {budgetData.spentPercentage}% {t('dashboard.stats.of')} {t('budget.totalBudget').toLowerCase()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('budget.remaining')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${budgetData.remaining >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(budgetData.remaining, 'USD', locale)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {budgetData.remaining >= 0 ? 
                    `${Math.round(100 - budgetData.spentPercentage)}% ${t('dashboard.stats.remaining')}` : 
                    t('budget.overBudget')
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Budget Categories */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t('budget.categoryBreakdown')}</CardTitle>
                  <CardDescription>{t('budget.categoryBreakdownDescription')}</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/dashboard/budget/categories">{t('budget.manageCategories')}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {categories.length > 0 ? (
                <div className="space-y-4">
                  {categories.map((category) => {
                    const spent = Number(category.spentAmount) || 0
                    const allocated = Number(category.allocatedAmount) || 0
                    const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0
                    
                    return (
                      <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {category.priority === 'essential' && `🔴 ${t('budget.essential')}`}
                              {category.priority === 'important' && `🟡 ${t('budget.important')}`}
                              {category.priority === 'nice_to_have' && `🟢 ${t('budget.niceToHave')}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(spent, 'USD', locale)}
                            {allocated > 0 && (
                              <span className="text-muted-foreground text-sm ml-1">
                                / {formatCurrency(allocated, 'USD', locale)}
                              </span>
                            )}
                          </div>
                          {allocated > 0 && (
                            <div className="text-sm text-muted-foreground">
                              {percentage}% {t('budget.used')}
                            </div>
                          )}
                          <div className="mt-2">
                            <PaymentScheduleDialog
                              category={{
                                id: category.id,
                                name: category.name,
                                allocatedAmount: allocated
                              }}
                              onSave={handlePaymentScheduleSave}
                            >
                              <Button variant="outline" size="sm">
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule
                              </Button>
                            </PaymentScheduleDialog>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">{t('budget.noCategoriesYet')}</p>
                  <Button asChild>
                    <Link href="/dashboard/budget/categories">{t('budget.createCategories')}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Payments Dashboard */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Upcoming Payments</CardTitle>
                  <CardDescription>Track your payment schedules and due dates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <Clock className="h-8 w-8 mx-auto text-red-600 mb-2" />
                  <p className="text-2xl font-bold text-red-600">3</p>
                  <p className="text-sm text-red-700">Overdue</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Calendar className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">7</p>
                  <p className="text-sm text-yellow-700">Due This Week</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <DollarSign className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-600">${formatCurrency(15000, 'USD', locale)}</p>
                  <p className="text-sm text-blue-700">Total Scheduled</p>
                </div>
              </div>

              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No payment schedules created yet</p>
                <p className="text-sm text-gray-400 mb-4">
                  Set up payment schedules for your budget categories to track when payments are due
                </p>
                <Button asChild>
                  <Link href="/dashboard/budget/categories">Create Payment Schedules</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t('budget.recentExpenses')}</CardTitle>
                  <CardDescription>{t('budget.recentExpensesDescription')}</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/dashboard/budget/expenses">{t('budget.addExpense')}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length > 0 ? (
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border-l-4 bg-gray-50" 
                         style={{ borderLeftColor: expense.budget_categories?.color || '#6B7280' }}>
                      <div>
                        <p className="font-semibold">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.budget_categories?.name}
                          {expense.vendors?.name && ` • ${expense.vendors.name}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold" style={{ color: expense.budget_categories?.color || '#6B7280' }}>
                          -{formatCurrency(Number(expense.amount), 'USD', locale)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(expense.expense_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">{t('budget.noExpensesYet')}</p>
                  <Button asChild>
                    <Link href="/dashboard/budget/expenses">{t('budget.addFirstExpense')}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">{t('budget.setupBudget')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('budget.completeOnboarding')}
            </p>
            <Button asChild>
              <Link href="/onboarding">{t('budget.completeSetup')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}