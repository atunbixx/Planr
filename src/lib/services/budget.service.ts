import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface BudgetOverview {
  totalBudget: number
  totalAllocated: number
  totalSpent: number
  totalRemaining: number
  categories: BudgetCategoryStats[]
}

export interface BudgetCategoryStats {
  id: string
  name: string
  allocatedAmount: number
  spentAmount: number
  remainingAmount: number
  percentageUsed: number
  expenseCount: number
  color?: string
  icon?: string
}

export interface SpendingTrend {
  date: string
  amount: number
  category: string
  description: string
}

export interface PaymentScheduleItem {
  id: string
  vendorName: string
  amount: number
  dueDate: string
  paid: boolean
  category: string
  milestone: string
}

export class BudgetService {
  // Get comprehensive budget overview
  static async getBudgetOverview(coupleId: string): Promise<BudgetOverview> {
    const couple = await prisma.couples.findUnique({
      where: { id: coupleId },
      select: { total_budget: true }
    })

    if (!couple) {
      throw new Error('Couple not found')
    }

    const categories = await prisma.budget_categories.findMany({
      where: { couple_id: coupleId },
      include: {
        budget_expenses: true
      },
      orderBy: { priority: 'desc' }
    })

    const categoryStats: BudgetCategoryStats[] = categories.map(category => {
      const spentAmount = category.budget_expenses.reduce((sum, expense) => 
        sum + Number(expense.amount), 0
      )
      const allocatedAmount = Number(category.allocated_amount)
      const remainingAmount = allocatedAmount - spentAmount
      const percentageUsed = allocatedAmount > 0 ? (spentAmount / allocatedAmount) * 100 : 0

      return {
        id: category.id,
        name: category.name,
        allocatedAmount,
        spentAmount,
        remainingAmount,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        expenseCount: category.budget_expenses.length,
        color: category.color || undefined,
        icon: category.icon || undefined
      }
    })

    const totalAllocated = categoryStats.reduce((sum, cat) => sum + cat.allocatedAmount, 0)
    const totalSpent = categoryStats.reduce((sum, cat) => sum + cat.spentAmount, 0)
    const totalBudget = Number(couple.total_budget) || 0
    const totalRemaining = totalBudget - totalSpent

    return {
      totalBudget,
      totalAllocated,
      totalSpent,
      totalRemaining,
      categories: categoryStats
    }
  }

  // Get spending trends over time
  static async getSpendingTrends(coupleId: string, days: number = 30): Promise<SpendingTrend[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const expenses = await prisma.budget_expenses.findMany({
      where: {
        couple_id: coupleId,
        expense_date: {
          gte: startDate
        }
      },
      include: {
        budget_categories: {
          select: { name: true }
        }
      },
      orderBy: { expense_date: 'desc' }
    })

    return expenses.map(expense => ({
      date: expense.expense_date.toISOString().split('T')[0],
      amount: Number(expense.amount),
      category: expense.budget_categories.name,
      description: expense.description
    }))
  }

  // Get payment schedule
  static async getPaymentSchedule(coupleId: string): Promise<PaymentScheduleItem[]> {
    const payments = await prisma.payment_schedules.findMany({
      where: { couple_id: coupleId },
      orderBy: { due_date: 'asc' }
    })

    return payments.map(payment => ({
      id: payment.id,
      vendorName: payment.milestone_name, // Using milestone_name as vendor name for now
      amount: Number(payment.amount),
      dueDate: payment.due_date.toISOString().split('T')[0],
      paid: payment.paid,
      category: payment.expense_category,
      milestone: payment.milestone_name
    }))
  }

  // Add budget expense
  static async addExpense(coupleId: string, data: {
    categoryId: string
    vendorId?: string
    description: string
    amount: number
    expenseDate?: Date
    paymentMethod?: string
    receiptUrl?: string
    notes?: string
  }) {
    return await prisma.budget_expenses.create({
      data: {
        couple_id: coupleId,
        category_id: data.categoryId,
        vendor_id: data.vendorId,
        description: data.description,
        amount: data.amount,
        expense_date: data.expenseDate || new Date(),
        payment_method: data.paymentMethod,
        receipt_url: data.receiptUrl,
        notes: data.notes
      }
    })
  }

  // Create budget category
  static async createCategory(coupleId: string, data: {
    name: string
    allocatedAmount: number
    color?: string
    icon?: string
    priority?: string
  }) {
    return await prisma.budget_categories.create({
      data: {
        couple_id: coupleId,
        name: data.name,
        allocated_amount: data.allocatedAmount,
        color: data.color,
        icon: data.icon,
        priority: data.priority
      }
    })
  }

  // Update budget category allocation
  static async updateCategoryAllocation(categoryId: string, amount: number) {
    return await prisma.budget_categories.update({
      where: { id: categoryId },
      data: { allocated_amount: amount }
    })
  }

  // Get budget alerts (overspending, upcoming payments)
  static async getBudgetAlerts(coupleId: string) {
    const alerts = await prisma.budget_alerts.findMany({
      where: {
        couple_id: coupleId,
        acknowledged: false
      },
      orderBy: { created_at: 'desc' }
    })

    return alerts
  }

  // Create default budget categories
  static async createDefaultCategories(coupleId: string, totalBudget: number) {
    const defaultCategories = [
      { name: 'Venue', percentage: 40, color: '#8B5CF6', icon: '🏛️' },
      { name: 'Catering', percentage: 25, color: '#10B981', icon: '🍽️' },
      { name: 'Photography', percentage: 10, color: '#F59E0B', icon: '📸' },
      { name: 'Flowers', percentage: 8, color: '#EF4444', icon: '🌸' },
      { name: 'Music/DJ', percentage: 5, color: '#3B82F6', icon: '🎵' },
      { name: 'Attire', percentage: 5, color: '#EC4899', icon: '👗' },
      { name: 'Transportation', percentage: 3, color: '#6B7280', icon: '🚗' },
      { name: 'Miscellaneous', percentage: 4, color: '#84CC16', icon: '✨' }
    ]

    const created = []
    for (const category of defaultCategories) {
      const allocatedAmount = (totalBudget * category.percentage) / 100
      
      const newCategory = await prisma.budget_categories.create({
        data: {
          couple_id: coupleId,
          name: category.name,
          allocated_amount: allocatedAmount,
          color: category.color,
          icon: category.icon,
          priority: 'medium'
        }
      })
      
      created.push(newCategory)
    }

    return created
  }
}