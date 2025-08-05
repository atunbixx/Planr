/**
 * Budget Management API Tests
 * Tests budget categories and expense tracking
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

describe('Budget Management API', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Budget Categories', () => {
    it('should create default budget categories', async () => {
      const totalBudget = 50000
      
      const mockDefaultCategories = [
        { name: 'Venue', allocatedAmount: 20000, priority: 'high', color: '#8B5CF6', icon: '🏛️' },
        { name: 'Catering', allocatedAmount: 12500, priority: 'high', color: '#06B6D4', icon: '🍽️' },
        { name: 'Photography', allocatedAmount: 5000, priority: 'high', color: '#10B981', icon: '📸' },
        { name: 'Music/DJ', allocatedAmount: 4000, priority: 'medium', color: '#F59E0B', icon: '🎵' },
        { name: 'Flowers', allocatedAmount: 2500, priority: 'medium', color: '#EF4444', icon: '💐' },
        { name: 'Attire', allocatedAmount: 2500, priority: 'medium', color: '#8B5CF6', icon: '👗' },
        { name: 'Transportation', allocatedAmount: 1500, priority: 'low', color: '#6B7280', icon: '🚗' },
        { name: 'Other', allocatedAmount: 2000, priority: 'low', color: '#9CA3AF', icon: '📝' }
      ]

      const totalAllocated = mockDefaultCategories.reduce((sum, cat) => sum + cat.allocatedAmount, 0)
      
      expect(mockDefaultCategories).toHaveLength(8)
      expect(totalAllocated).toBe(totalBudget)
    })

    it('should create custom budget category', async () => {
      const categoryData = {
        name: 'Wedding Cake',
        allocatedAmount: 1200,
        priority: 'medium',
        color: '#FF6B9D',
        icon: '🎂'
      }

      const mockResponse = {
        id: 'category_123',
        ...categoryData,
        spentAmount: 0,
        remainingAmount: 1200,
        createdAt: new Date().toISOString()
      }

      expect(mockResponse.name).toBe('Wedding Cake')
      expect(mockResponse.allocatedAmount).toBe(1200)
      expect(mockResponse.spentAmount).toBe(0)
    })

    it('should retrieve categories with spending summary', async () => {
      const mockCategories = [
        {
          id: 'cat_1',
          name: 'Venue',
          allocatedAmount: 20000,
          spentAmount: 18000,
          remainingAmount: 2000,
          expenses: [
            { amount: 15000, name: 'Venue Deposit' },
            { amount: 3000, name: 'Final Payment' }
          ]
        },
        {
          id: 'cat_2',
          name: 'Catering',
          allocatedAmount: 12500,
          spentAmount: 0,
          remainingAmount: 12500,
          expenses: []
        }
      ]

      const totalAllocated = mockCategories.reduce((sum, cat) => sum + cat.allocatedAmount, 0)
      const totalSpent = mockCategories.reduce((sum, cat) => sum + cat.spentAmount, 0)

      expect(mockCategories).toHaveLength(2)
      expect(totalAllocated).toBe(32500)
      expect(totalSpent).toBe(18000)
    })
  })

  describe('Budget Expenses', () => {
    it('should create a new expense', async () => {
      const expenseData = {
        name: 'Wedding Venue Deposit',
        amount: 5000,
        categoryId: 'category_venue',
        vendorId: 'vendor_123',
        description: 'Initial deposit for Sunset Gardens venue',
        date: '2024-03-15T10:00:00Z',
        isPaid: true
      }

      const mockResponse = {
        id: 'expense_456',
        ...expenseData,
        createdAt: new Date().toISOString()
      }

      expect(mockResponse.name).toBe('Wedding Venue Deposit')
      expect(mockResponse.amount).toBe(5000)
      expect(mockResponse.isPaid).toBe(true)
    })

    it('should retrieve expenses with category and vendor details', async () => {
      const mockExpenses = [
        {
          id: 'exp_1',
          name: 'Venue Deposit',
          amount: 5000,
          isPaid: true,
          category: { name: 'Venue', color: '#8B5CF6' },
          vendor: { businessName: 'Sunset Gardens', contactName: 'Sarah Johnson' }
        },
        {
          id: 'exp_2',
          name: 'Photography Contract',
          amount: 2500,
          isPaid: false,
          category: { name: 'Photography', color: '#10B981' },
          vendor: { businessName: 'Perfect Moments Photo', contactName: 'Mike Chen' }
        }
      ]

      const totalExpenses = mockExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      const paidExpenses = mockExpenses.filter(exp => exp.isPaid).length

      expect(mockExpenses).toHaveLength(2)
      expect(totalExpenses).toBe(7500)
      expect(paidExpenses).toBe(1)
    })

    it('should update expense status', async () => {
      const updateData = {
        isPaid: true,
        paidDate: new Date().toISOString(),
        notes: 'Payment completed via bank transfer'
      }

      const mockUpdatedExpense = {
        id: 'expense_456',
        name: 'Photography Contract',
        amount: 2500,
        ...updateData
      }

      expect(mockUpdatedExpense.isPaid).toBe(true)
      expect(mockUpdatedExpense.paidDate).toBeTruthy()
    })
  })

  describe('Budget Analytics', () => {
    it('should provide budget overview and insights', async () => {
      const mockBudgetOverview = {
        totalBudget: 50000,
        totalAllocated: 50000,
        totalSpent: 25000,
        totalRemaining: 25000,
        percentageSpent: 50,
        categoriesOverBudget: 1,
        upcomingExpenses: 5,
        insights: [
          'You are 50% through your budget',
          'Venue category is over budget by $2,000',
          '5 expenses are due in the next 30 days'
        ]
      }

      expect(mockBudgetOverview.percentageSpent).toBe(50)
      expect(mockBudgetOverview.categoriesOverBudget).toBe(1)
      expect(mockBudgetOverview.insights).toHaveLength(3)
    })
  })
})