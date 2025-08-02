import { useState, useEffect } from 'react'
import { BudgetOverview } from '@/lib/services/budget.service'

interface UseBudgetResult {
  overview: BudgetOverview | null
  loading: boolean
  error: string | null
  refreshBudget: () => Promise<void>
  initializeBudget: (totalBudget: number) => Promise<void>
}

export function useBudget(): UseBudgetResult {
  const [overview, setOverview] = useState<BudgetOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshBudget = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/budget/overview')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch budget overview')
      }

      setOverview(data.data)
    } catch (err: any) {
      setError(err.message)
      setOverview(null)
    } finally {
      setLoading(false)
    }
  }

  const initializeBudget = async (totalBudget: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/budget/overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalBudget })
      })
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize budget')
      }

      setOverview(data.data.overview)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load budget on mount
  useEffect(() => {
    refreshBudget()
  }, [])

  return {
    overview,
    loading,
    error,
    refreshBudget,
    initializeBudget
  }
}