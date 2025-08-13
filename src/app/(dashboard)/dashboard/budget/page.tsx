'use client'

import { useEffect, useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import BudgetContent from './components/BudgetContent'
import { useLocale } from '@/providers/LocaleProvider'
import type { LocaleCode } from '@/lib/localization'
import { enterpriseApi, type BudgetSummaryResponse } from '@/lib/api/enterprise-client'

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
  expense_date?: Date | string | null
  dueDate: string | null
  paymentStatus: string | null
  category?: {
    name: string
    icon: string
    color: string
  } | null
}

interface BudgetData {
  totalBudget: number
  totalSpent: number
  totalAllocated: number
  remaining: number
  spentPercentage: number
}

export default function BudgetPage() {
  const { user, isSignedIn, isLoading } = useSupabaseAuth()
  const { localeConfig } = useLocale()
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBudgetData = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await enterpriseApi.budget.getSummary()
      
      setBudgetData({
        totalBudget: data.totalBudget,
        totalSpent: data.totalSpent,
        totalAllocated: data.totalAllocated,
        remaining: data.totalRemaining,
        spentPercentage: data.totalBudget > 0 ? (data.totalSpent / data.totalBudget) * 100 : 0
      })
      setCategories(data.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '💰',
        color: cat.color || '#667eea',
        allocatedAmount: cat.allocatedAmount,
        spentAmount: cat.spent,
        priority: 'medium',
        industryAveragePercentage: 0
      })))
      setExpenses([]) // Summary doesn't include expenses
    } catch (err) {
      console.error('Error in fetchBudgetData:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      fetchBudgetData()
    }
  }, [isLoading, isSignedIn, user])

  if (loading || isLoading) {
    return (
      <div className="px-8 py-12">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200/50 rounded-sm mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200/50 rounded-sm"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200/50 rounded-sm"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="px-8 py-12">
        <div className="text-center py-16">
          <h3 className="text-2xl font-light tracking-wide text-gray-900 uppercase mb-4">
            Sign In Required
          </h3>
          <p className="text-lg font-light text-gray-600">
            Please sign in to view your budget
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-8 py-12">
        <div className="text-center py-16">
          <h3 className="text-2xl font-light tracking-wide text-gray-900 uppercase mb-4">
            Error Loading Budget
          </h3>
          <p className="text-lg font-light text-gray-600 mb-8">
            {error}
          </p>
          <button
            onClick={fetchBudgetData}
            className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-6 py-2 text-sm font-light tracking-wider uppercase"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <BudgetContent 
      budgetData={budgetData}
      categories={categories}
      expenses={expenses}
      locale={localeConfig.locale as LocaleCode}
      currency={localeConfig.currency}
    />
  )
}