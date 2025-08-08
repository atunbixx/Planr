'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatCurrency, type LocaleCode } from '@/lib/localization'
import { ArrowRight, TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react'

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

  if (!budgetData) {
    return (
      <div className="px-8 py-12">
        <div className="text-center py-16">
          <h3 className="text-2xl font-light tracking-wide text-gray-900 uppercase mb-4">Setup Budget</h3>
          <p className="text-lg font-light text-gray-600 mb-8">
            Complete your wedding planning setup to start tracking expenses
          </p>
          <Button asChild className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-6 py-2 text-sm font-light tracking-wider uppercase">
            <Link href="/onboarding">Complete Setup</Link>
          </Button>
        </div>
      </div>
    )
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'essential': return 'text-red-600'
      case 'important': return 'text-amber-600'
      case 'nice_to_have': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-light tracking-wide text-gray-900 mb-2 uppercase">Budget</h1>
        <p className="text-lg font-light text-gray-600">Track expenses and manage your wedding budget</p>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-8 rounded-sm shadow-sm">
          <div className="text-center">
            <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">Total Budget</p>
            <p className="text-3xl font-light text-gray-900">
              {formatCurrency(budgetData.totalBudget, 'USD', locale)}
            </p>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-sm shadow-sm">
          <div className="text-center">
            <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">Spent</p>
            <p className="text-3xl font-light text-gray-900">
              {formatCurrency(budgetData.totalSpent, 'USD', locale)}
            </p>
            <p className="text-xs font-light text-gray-500 mt-2">
              {budgetData.spentPercentage}% of total
            </p>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-sm shadow-sm">
          <div className="text-center">
            <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">Remaining</p>
            <p className={`text-3xl font-light ${budgetData.remaining >= 0 ? 'text-[#7a9b7f]' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(budgetData.remaining), 'USD', locale)}
            </p>
            <p className="text-xs font-light text-gray-500 mt-2">
              {budgetData.remaining >= 0 ? 
                `${Math.round(100 - budgetData.spentPercentage)}% available` : 
                'Over budget'
              }
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-sm shadow-sm">
          <div className="text-center">
            <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">Status</p>
            <div className="flex items-center justify-center">
              {budgetData.remaining >= 0 ? (
                <>
                  <TrendingUp className="w-6 h-6 text-[#7a9b7f] mr-2" />
                  <p className="text-lg font-light text-[#7a9b7f]">On Track</p>
                </>
              ) : (
                <>
                  <TrendingDown className="w-6 h-6 text-red-600 mr-2" />
                  <p className="text-lg font-light text-red-600">Over Budget</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="bg-white rounded-sm shadow-sm mb-8">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-light tracking-wide text-gray-900 uppercase">Categories</h2>
              <p className="text-sm font-light text-gray-600 mt-1">Budget allocation by category</p>
            </div>
            <Button asChild variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-sm px-4 py-2 text-sm font-light tracking-wider uppercase">
              <Link href="/dashboard/budget/categories">
                Manage
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="p-8">
          {categories.length > 0 ? (
            <div className="space-y-6">
              {categories.map((category) => {
                const spent = Number(category.spentAmount) || 0
                const allocated = Number(category.allocatedAmount) || 0
                const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0
                
                return (
                  <div key={category.id} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h3 className="font-light text-gray-900">{category.name}</h3>
                          <p className={`text-xs font-medium tracking-[0.2em] uppercase mt-1 ${getPriorityStyle(category.priority)}`}>
                            {category.priority.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-light text-gray-900">
                          {formatCurrency(spent, 'USD', locale)}
                        </p>
                        {allocated > 0 && (
                          <p className="text-sm font-light text-gray-500 mt-1">
                            of {formatCurrency(allocated, 'USD', locale)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {allocated > 0 && (
                      <div className="ml-12">
                        <div className="flex items-center justify-between text-xs font-light text-gray-500 mb-2">
                          <span>{percentage}% used</span>
                          <span>Industry avg: {category.industryAveragePercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-sm h-1 overflow-hidden">
                          <div 
                            className="h-full bg-[#7a9b7f] transition-all duration-300"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-light mb-6">No budget categories yet</p>
              <Button asChild className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-6 py-2 text-sm font-light tracking-wider uppercase">
                <Link href="/dashboard/budget/categories">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Categories
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-sm shadow-sm">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-light tracking-wide text-gray-900 uppercase">Recent Expenses</h2>
              <p className="text-sm font-light text-gray-600 mt-1">Latest transactions</p>
            </div>
            <Button asChild className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-4 py-2 text-sm font-light tracking-wider uppercase">
              <Link href="/dashboard/budget/expenses">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="p-8">
          {expenses.length > 0 ? (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-12 rounded-sm" style={{ backgroundColor: expense.budget_categories?.color || '#6B7280' }} />
                    <div>
                      <p className="font-light text-gray-900">{expense.description}</p>
                      <p className="text-sm font-light text-gray-500 mt-1">
                        {expense.budget_categories?.name}
                        {expense.vendors?.name && ` • ${expense.vendors.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-light text-gray-900">
                      -{formatCurrency(Number(expense.amount), 'USD', locale)}
                    </p>
                    <p className="text-xs font-light text-gray-500 mt-1">
                      {new Date(expense.expense_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="pt-4">
                <Button asChild variant="ghost" className="w-full text-gray-600 hover:text-gray-900 text-sm font-light tracking-wider uppercase">
                  <Link href="/dashboard/budget/expenses">
                    View All Expenses
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 font-light mb-6">No expenses recorded yet</p>
              <Button asChild className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-6 py-2 text-sm font-light tracking-wider uppercase">
                <Link href="/dashboard/budget/expenses">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Expense
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}