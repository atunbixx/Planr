'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface BudgetItem {
  id: string
  couple_id: string
  period_id: string
  category_type_id: string
  subcategory_type_id?: string
  vendor_id?: string
  name: string
  description?: string
  estimated_amount: number
  contracted_amount?: number
  final_amount?: number
  status: 'planned' | 'committed' | 'partial' | 'paid' | 'cancelled' | 'refunded'
  due_date?: string
  contract_date?: string
  service_date?: string
  is_deposit: boolean
  is_gratuity: boolean
  is_tax_included: boolean
  requires_contract: boolean
  contract_signed: boolean
  quantity: number
  unit_price?: number
  priority_level: number
  tags: string[]
  attachments: any[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface BudgetCategoryType {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  display_order: number
  is_system: boolean
}

export interface BudgetSubcategoryType {
  id: string
  category_type_id: string
  name: string
  description?: string
  display_order: number
}

export interface BudgetAnalytics {
  totalItems: number
  totalVendors: number
  categoriesUsed: number
  totalEstimated: number
  totalContracted: number
  totalFinal: number
  totalPaid: number
  totalPending: number
  itemsPaid: number
  itemsCommitted: number
  itemsPlanned: number
  overdueItems: number
}

export interface CategoryBreakdown {
  categoryId: string
  categoryName: string
  icon?: string
  color?: string
  itemCount: number
  estimatedTotal: number
  contractedTotal: number
  finalTotal: number
  paidTotal: number
  allocatedAmount?: number
  allocatedPercentage?: number
  percentageUsed: number
}

export interface PaymentTimeline {
  paymentMonth: string
  itemsDue: number
  amountDue: number
  amountPaid: number
  itemsPaid: number
  overdueItems: number
}

export function useBudgetItems(coupleId: string, periodId: string) {
  const [items, setItems] = useState<BudgetItem[]>([])
  const [categories, setCategories] = useState<BudgetCategoryType[]>([])
  const [subcategories, setSubcategories] = useState<BudgetSubcategoryType[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<BudgetAnalytics | null>(null)
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [paymentTimeline, setPaymentTimeline] = useState<PaymentTimeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()

  // Load budget items and related data
  const loadBudgetItems = useCallback(async () => {
    if (!coupleId || !periodId) {
      setItems([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Load all data in parallel
      const [
        itemsResult,
        categoriesResult,
        subcategoriesResult,
        vendorsResult,
        analyticsResult,
        categoryBreakdownResult,
        paymentTimelineResult
      ] = await Promise.all([
        // Budget items
        supabase
          .from('budget_items')
          .select('*')
          .eq('couple_id', coupleId)
          .eq('period_id', periodId)
          .order('created_at', { ascending: false }),

        // Category types
        supabase
          .from('budget_category_types')
          .select('*')
          .order('display_order'),

        // Subcategory types
        supabase
          .from('budget_subcategory_types')
          .select('*')
          .order('display_order'),

        // Vendors
        supabase
          .from('couple_vendors')
          .select('id, business_name, vendor_type')
          .eq('couple_id', coupleId)
          .order('business_name'),

        // Analytics summary
        supabase
          .from('budget_analytics_summary')
          .select('*')
          .eq('couple_id', coupleId)
          .eq('period_id', periodId)
          .single(),

        // Category breakdown
        supabase
          .from('budget_category_breakdown')
          .select('*')
          .eq('couple_id', coupleId)
          .eq('period_id', periodId),

        // Payment timeline
        supabase
          .from('budget_payment_timeline')
          .select('*')
          .eq('couple_id', coupleId)
          .eq('period_id', periodId)
          .order('payment_month')
      ])

      if (itemsResult.error) throw itemsResult.error
      if (categoriesResult.error) throw categoriesResult.error
      if (subcategoriesResult.error) throw subcategoriesResult.error

      setItems(itemsResult.data || [])
      setCategories(categoriesResult.data || [])
      setSubcategories(subcategoriesResult.data || [])
      setVendors(vendorsResult.data || [])
      
      if (analyticsResult.data) {
        setAnalytics({
          totalItems: analyticsResult.data.total_items || 0,
          totalVendors: analyticsResult.data.total_vendors || 0,
          categoriesUsed: analyticsResult.data.categories_used || 0,
          totalEstimated: analyticsResult.data.total_estimated || 0,
          totalContracted: analyticsResult.data.total_contracted || 0,
          totalFinal: analyticsResult.data.total_final || 0,
          totalPaid: analyticsResult.data.total_paid || 0,
          totalPending: analyticsResult.data.total_pending || 0,
          itemsPaid: analyticsResult.data.items_paid || 0,
          itemsCommitted: analyticsResult.data.items_committed || 0,
          itemsPlanned: analyticsResult.data.items_planned || 0,
          overdueItems: analyticsResult.data.overdue_items || 0
        })
      }

      if (categoryBreakdownResult.data) {
        setCategoryBreakdown(categoryBreakdownResult.data.map((cat: any) => ({
          categoryId: cat.category_id,
          categoryName: cat.category_name,
          icon: cat.icon,
          color: cat.color,
          itemCount: cat.item_count || 0,
          estimatedTotal: cat.estimated_total || 0,
          contractedTotal: cat.contracted_total || 0,
          finalTotal: cat.final_total || 0,
          paidTotal: cat.paid_total || 0,
          allocatedAmount: cat.allocated_amount,
          allocatedPercentage: cat.allocated_percentage,
          percentageUsed: cat.percentage_used || 0
        })))
      }

      if (paymentTimelineResult.data) {
        setPaymentTimeline(paymentTimelineResult.data.map((timeline: any) => ({
          paymentMonth: timeline.payment_month,
          itemsDue: timeline.items_due || 0,
          amountDue: timeline.amount_due || 0,
          amountPaid: timeline.amount_paid || 0,
          itemsPaid: timeline.items_paid || 0,
          overdueItems: timeline.overdue_items || 0
        })))
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load budget items'
      console.error('Budget items loading error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [coupleId, periodId])

  // Add new budget item
  const addItem = useCallback(async (itemData: Partial<BudgetItem>) => {
    if (!coupleId || !periodId || !user?.id) {
      throw new Error('Authentication required to add budget item')
    }

    try {
      const { data, error } = await supabase
        .from('budget_items')
        .insert({
          ...itemData,
          couple_id: coupleId,
          period_id: periodId,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      setItems(prev => [data, ...prev])
      
      // Reload analytics
      await loadBudgetItems()
      
      return data
    } catch (err) {
      console.error('Error adding budget item:', err)
      throw err
    }
  }, [coupleId, periodId, user?.id, loadBudgetItems])

  // Update budget item
  const updateItem = useCallback(async (itemId: string, updates: Partial<BudgetItem>) => {
    if (!coupleId || !user?.id) {
      throw new Error('Authentication required to update budget item')
    }

    try {
      const { data, error } = await supabase
        .from('budget_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('couple_id', coupleId)
        .select()
        .single()

      if (error) throw error

      setItems(prev => prev.map(item => item.id === itemId ? data : item))
      
      // Reload analytics
      await loadBudgetItems()
      
      return data
    } catch (err) {
      console.error('Error updating budget item:', err)
      throw err
    }
  }, [coupleId, user?.id, loadBudgetItems])

  // Delete budget item
  const deleteItem = useCallback(async (itemId: string) => {
    if (!coupleId || !user?.id) {
      throw new Error('Authentication required to delete budget item')
    }

    try {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', itemId)
        .eq('couple_id', coupleId)

      if (error) throw error

      setItems(prev => prev.filter(item => item.id !== itemId))
      
      // Reload analytics
      await loadBudgetItems()
      
      return true
    } catch (err) {
      console.error('Error deleting budget item:', err)
      throw err
    }
  }, [coupleId, user?.id, loadBudgetItems])

  // Add transaction to budget item
  const addTransaction = useCallback(async (itemId: string, transaction: {
    amount: number
    transaction_type: 'payment' | 'refund' | 'adjustment'
    payment_method?: string
    payment_date?: string
    notes?: string
  }) => {
    if (!coupleId || !user?.id) {
      throw new Error('Authentication required to add transaction')
    }

    try {
      const { data, error } = await supabase
        .from('budget_transactions')
        .insert({
          couple_id: coupleId,
          budget_item_id: itemId,
          ...transaction,
          payment_date: transaction.payment_date || new Date().toISOString().split('T')[0],
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      // Update item status if fully paid
      const item = items.find(i => i.id === itemId)
      if (item && transaction.transaction_type === 'payment') {
        const totalPaid = await getTotalPaid(itemId)
        const amountDue = item.final_amount || item.contracted_amount || item.estimated_amount
        
        if (totalPaid >= amountDue) {
          await updateItem(itemId, { status: 'paid' })
        } else if (totalPaid > 0) {
          await updateItem(itemId, { status: 'partial' })
        }
      }

      return data
    } catch (err) {
      console.error('Error adding transaction:', err)
      throw err
    }
  }, [coupleId, user?.id, items, updateItem])

  // Get total paid for an item
  const getTotalPaid = useCallback(async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('amount, transaction_type')
        .eq('budget_item_id', itemId)

      if (error) throw error

      return (data || []).reduce((total, transaction) => {
        if (transaction.transaction_type === 'payment') {
          return total + transaction.amount
        } else if (transaction.transaction_type === 'refund') {
          return total - transaction.amount
        }
        return total
      }, 0)
    } catch (err) {
      console.error('Error calculating total paid:', err)
      return 0
    }
  }, [])

  // Get spending trends
  const getSpendingTrends = useCallback(async (monthsBack: number = 6) => {
    if (!coupleId || !periodId) return []

    try {
      const { data, error } = await supabase
        .rpc('get_budget_spending_trends', {
          p_couple_id: coupleId,
          p_period_id: periodId,
          p_months_back: monthsBack
        })

      if (error) throw error

      return data || []
    } catch (err) {
      console.error('Error getting spending trends:', err)
      return []
    }
  }, [coupleId, periodId])

  // Load data on mount
  useEffect(() => {
    loadBudgetItems()
  }, [loadBudgetItems])

  return {
    items,
    categories,
    subcategories,
    vendors,
    analytics,
    categoryBreakdown,
    paymentTimeline,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    addTransaction,
    getTotalPaid,
    getSpendingTrends,
    refreshItems: loadBudgetItems
  }
}