'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BudgetItemsList } from '@/components/budget/BudgetItemsList'
import { BudgetCategoryBreakdown } from '@/components/budget/BudgetCategoryBreakdown'
import { BudgetPaymentTimeline } from '@/components/budget/BudgetPaymentTimeline'
import { BudgetSpendingTrends } from '@/components/budget/BudgetSpendingTrends'
import { BudgetAlertsEnhanced } from '@/components/budget/BudgetAlertsEnhanced'
import { useBudgetItems } from '@/hooks/useBudgetItems'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Receipt,
  TrendingUp,
  Calendar,
  AlertCircle,
  DollarSign,
  PieChart,
  FileText,
  Download,
  Settings
} from 'lucide-react'

export default function BudgetAnalyticsPage() {
  const router = useRouter()
  const { couple } = useAuth()
  const [activePeriod, setActivePeriod] = useState<any>(null)
  const [spendingTrends, setSpendingTrends] = useState<any[]>([])
  const [loadingPeriod, setLoadingPeriod] = useState(true)

  // Load active budget period
  useEffect(() => {
    async function loadBudgetPeriod() {
      if (!couple?.id) return

      try {
        const { data, error } = await supabase
          .from('budget_periods')
          .select('*')
          .eq('couple_id', couple.id)
          .eq('is_active', true)
          .single()

        if (error) {
          // Create initial budget period if none exists
          const { data: newPeriod, error: createError } = await supabase
            .from('budget_periods')
            .insert({
              couple_id: couple.id,
              name: 'Wedding Budget',
              start_date: new Date().toISOString().split('T')[0],
              end_date: couple.wedding_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              total_budget: couple.budget_total || 50000,
              is_active: true
            })
            .select()
            .single()

          if (!createError && newPeriod) {
            setActivePeriod(newPeriod)
          }
        } else {
          setActivePeriod(data)
        }
      } catch (err) {
        console.error('Error loading budget period:', err)
      } finally {
        setLoadingPeriod(false)
      }
    }

    loadBudgetPeriod()
  }, [couple])

  const {
    items,
    analytics,
    categoryBreakdown,
    paymentTimeline,
    loading,
    getSpendingTrends
  } = useBudgetItems(couple?.id || '', activePeriod?.id || '')

  // Load spending trends
  useEffect(() => {
    async function loadTrends() {
      if (!couple?.id || !activePeriod?.id) return
      
      const trends = await getSpendingTrends(12)
      setSpendingTrends(trends)
    }
    
    loadTrends()
  }, [couple?.id, activePeriod?.id, getSpendingTrends])

  const handleAlertAction = (alert: any) => {
    if (alert.action?.startsWith('review-category-')) {
      const categoryId = alert.action.replace('review-category-', '')
      // Navigate to category view or open modal
      console.log('Review category:', categoryId)
    } else if (alert.action === 'view-overdue') {
      // Navigate to overdue items
      router.push('/dashboard/budget?status=overdue')
    } else if (alert.action === 'view-payments') {
      // Navigate to payment timeline
      router.push('/dashboard/budget/payments')
    }
  }

  const handleMonthClick = (month: string) => {
    // Navigate to items for specific month
    router.push(`/dashboard/budget?month=${month}`)
  }

  const exportBudgetData = () => {
    // TODO: Implement budget export functionality
    console.log('Export budget data')
  }

  if (loadingPeriod || loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading budget analytics...</p>
        </div>
      </div>
    )
  }

  if (!activePeriod) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No active budget period found.</p>
        <Button onClick={() => router.push('/dashboard/budget/setup')}>
          Set Up Budget
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budget Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track and analyze your wedding budget in detail
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportBudgetData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/budget/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${activePeriod.total_budget.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {activePeriod.name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Total Committed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${analytics?.totalCommitted.toLocaleString() || 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {analytics?.totalItems || 0} items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${analytics?.totalPaid.toLocaleString() || 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {analytics?.itemsPaid || 0} items paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (activePeriod.total_budget - (analytics?.totalCommitted || 0)) >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              ${Math.abs(activePeriod.total_budget - (analytics?.totalCommitted || 0)).toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {(activePeriod.total_budget - (analytics?.totalCommitted || 0)) >= 0 
                ? 'Under budget' 
                : 'Over budget'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {analytics && (
        <BudgetAlertsEnhanced
          analytics={analytics}
          categoryBreakdown={categoryBreakdown}
          totalBudget={activePeriod.total_budget}
          weddingDate={couple?.wedding_date}
          onActionClick={handleAlertAction}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full lg:w-auto">
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Items</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <BudgetItemsList
            coupleId={couple?.id || ''}
            periodId={activePeriod.id}
          />
        </TabsContent>

        <TabsContent value="categories">
          <BudgetCategoryBreakdown
            categories={categoryBreakdown}
            totalBudget={activePeriod.total_budget}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <BudgetPaymentTimeline
            timeline={paymentTimeline}
            onMonthClick={handleMonthClick}
          />
        </TabsContent>

        <TabsContent value="trends">
          <BudgetSpendingTrends
            trends={spendingTrends}
            totalBudget={activePeriod.total_budget}
            weddingDate={couple?.wedding_date}
          />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Budget Reports</CardTitle>
              <CardDescription>
                Generate detailed reports for your wedding budget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Budget Summary Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Category Analysis Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Payment Schedule Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Spending Trends Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}