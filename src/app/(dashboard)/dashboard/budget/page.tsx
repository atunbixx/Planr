'use client'

import { useEffect, useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import BudgetContent from './components/BudgetContent'
import { useLocale } from '@/providers/LocaleProvider'
import type { LocaleCode } from '@/lib/localization'
import { enterpriseApi, type BudgetSummaryResponse } from '@/lib/api/enterprise-client'
import { 
  WeddingPageLayout, 
  WeddingPageHeader,
  WeddingCard,
  WeddingButton
} from '@/components/wedding-theme'

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
        totalAllocated: data.categoryBreakdown?.reduce((acc, cat) => acc + cat.plannedAmount, 0) || 0,
        remaining: data.totalRemaining,
        spentPercentage: data.totalBudget > 0 ? (data.totalSpent / data.totalBudget) * 100 : 0
      })
      setCategories((data.categoryBreakdown || []).map(cat => ({
        id: cat.categoryId,
        name: cat.categoryName,
        icon: '💰',
        color: '#667eea',
        allocatedAmount: cat.plannedAmount,
        spentAmount: cat.actualSpent,
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
      <WeddingPageLayout>
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
      </WeddingPageLayout>
    )
  }

  if (!isSignedIn) {
    return (
      <WeddingPageLayout>
        <WeddingCard className="text-center py-16">
          <h3 className="text-2xl font-light tracking-wide text-gray-900 uppercase mb-4">
            Sign In Required
          </h3>
          <p className="text-lg font-light text-gray-600">
            Please sign in to view your budget
          </p>
        </WeddingCard>
      </WeddingPageLayout>
    )
  }

  if (error) {
    return (
      <WeddingPageLayout>
        <WeddingCard className="text-center py-16">
          <h3 className="text-2xl font-light tracking-wide text-gray-900 uppercase mb-4">
            Error Loading Budget
          </h3>
          <p className="text-lg font-light text-gray-600 mb-8">
            {error}
          </p>
          <WeddingButton onClick={fetchBudgetData}>
            Try Again
          </WeddingButton>
        </WeddingCard>
      </WeddingPageLayout>
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