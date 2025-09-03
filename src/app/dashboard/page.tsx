'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import PremiumDashboardOverview from '@/components/dashboard/PremiumDashboardOverview'

interface DashboardData {
  guestTotal: number
  vendorTotal: number
  vendorBookedTotal: number
  budget: {
    totalAmount: number
    totalAllocated: number
    totalActual: number
    remainingBudget: number
    percentSpent: number
  }
  guests: {
    total: number
    accepted: number
    pending: number
    declined: number
  }
  vendorCritical: {
    venue: boolean
    photographer: boolean
    caterer: boolean
    music: boolean
    florist: boolean
  }
}

interface ChecklistData {
  completedCount: number
  totalCount: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin')
    }
  }, [user, isLoading, router])

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Load overview data
        const token = AuthClient.getToken()
        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const overviewResponse = await fetch('/api/dashboard/overview', { headers })

        if (!overviewResponse.ok) {
          throw new Error('Failed to load dashboard overview')
        }

        const overviewResult = await overviewResponse.json()
        if (!overviewResult.success) {
          throw new Error(overviewResult.error?.message || 'Failed to load overview')
        }

        setDashboardData(overviewResult.data)

        // Load checklist data
        const checklistResponse = await fetch('/api/dashboard/checklist', { headers })

        if (checklistResponse.ok) {
          const checklistResult = await checklistResponse.json()
          if (checklistResult.success && checklistResult.data?.items) {
            const items = checklistResult.data.items
            const completed = items.filter((item: any) => item.completed).length
            setChecklistData({
              completedCount: completed,
              totalCount: items.length
            })
          }
        }

      } catch (err) {
        console.error('Dashboard data loading error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    if (user && !isLoading) {
      loadDashboardData()
    }
  }, [user, isLoading])

  // Show loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !dashboardData) {
    return (
      <PremiumDashboardLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Unable to Load Dashboard
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </PremiumDashboardLayout>
    )
  }

  // Get wedding date from user data if available (with type safety)
  const weddingDate = (user as any)?.weddingDate ? new Date((user as any).weddingDate) : undefined

  return (
    <PremiumDashboardLayout>
      {/* Classic editorial hero (hidden on premium) */}
      <div className="classic-editorial-hero">
        <div className="mx-auto max-w-6xl px-6 py-10 border-b">
          <div className="meta mb-2">THE PLANNER • YOUR WEDDING DASHBOARD</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">A Clear View of Your Day</h1>
          <p className="mt-3 max-w-2xl text-slate-700">Guests, vendors, budget, and timeline — distilled to essentials with an editorial eye.</p>
        </div>
      </div>
      {loading ? (
        <div className="p-6 flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <PremiumDashboardOverview
          guestTotal={dashboardData?.guestTotal || 0}
          vendorTotal={dashboardData?.vendorTotal || 0}
          budgetSummary={dashboardData?.budget}
          completedTasks={checklistData?.completedCount || 0}
          totalTasks={checklistData?.totalCount || 0}
          weddingDate={weddingDate}
        />
      )}
    </PremiumDashboardLayout>
  )
}
