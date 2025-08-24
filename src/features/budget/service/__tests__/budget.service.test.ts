import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BudgetService } from '../budget.service'
import { PrismaClient } from '@prisma/client'

// Mock Prisma
const mockPrisma = {
  budgetItem: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  $disconnect: vi.fn()
} as unknown as PrismaClient

describe('BudgetService', () => {
  let budgetService: BudgetService
  const testUserId = 'test-user-123'

  beforeEach(() => {
    budgetService = new BudgetService(mockPrisma)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getBudgetSummary', () => {
    it('should calculate budget summary correctly', async () => {
      const mockBudgetItems = [
        {
          id: '1',
          userId: testUserId,
          category: 'Venue',
          name: 'Wedding Hall',
          budgetedAmount: 100000,
          actualAmount: 95000,
          currency: 'NGN'
        },
        {
          id: '2',
          userId: testUserId,
          category: 'Catering',
          name: 'Food & Drinks',
          budgetedAmount: 50000,
          actualAmount: 55000,
          currency: 'NGN'
        },
        {
          id: '3',
          userId: testUserId,
          category: 'Photography',
          name: 'Wedding Photos',
          budgetedAmount: 30000,
          actualAmount: 0,
          currency: 'NGN'
        }
      ]

      vi.mocked(mockPrisma.budgetItem.findMany).mockResolvedValue(mockBudgetItems)

      const result = await budgetService.getBudgetSummary(testUserId)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      const summary = result.data!
      expect(summary.totalBudget).toBe(180000)
      expect(summary.totalSpent).toBe(150000)
      expect(summary.totalRemaining).toBe(30000)
      expect(summary.completionPercentage).toBe(83.33)
      expect(summary.itemCount).toBe(3)
      expect(summary.overBudgetCategories).toEqual(['Catering'])
      expect(summary.categoryBreakdown).toHaveLength(3)
    })

    it('should handle empty budget items', async () => {
      vi.mocked(mockPrisma.budgetItem.findMany).mockResolvedValue([])

      const result = await budgetService.getBudgetSummary(testUserId)

      expect(result.success).toBe(true)
      expect(result.data?.totalBudget).toBe(0)
      expect(result.data?.totalSpent).toBe(0)
      expect(result.data?.totalRemaining).toBe(0)
      expect(result.data?.completionPercentage).toBe(0)
      expect(result.data?.itemCount).toBe(0)
    })

    it('should handle database errors', async () => {
      vi.mocked(mockPrisma.budgetItem.findMany).mockRejectedValue(new Error('Database error'))

      const result = await budgetService.getBudgetSummary(testUserId)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('BUDGET_SUMMARY_FAILED')
    })
  })

  describe('getBudgetItems', () => {
    it('should get budget items with filters', async () => {
      const mockBudgetItems = [
        {
          id: '1',
          userId: testUserId,
          category: 'Venue',
          name: 'Wedding Hall',
          description: 'Main venue',
          budgetedAmount: 100000,
          actualAmount: 95000,
          currency: 'NGN',
          priority: 'HIGH',
          vendorId: null,
          dueDate: null,
          isPaid: true,
          paymentDate: new Date(),
          notes: 'Paid in full',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(mockPrisma.budgetItem.findMany).mockResolvedValue(mockBudgetItems)

      const result = await budgetService.getBudgetItems(testUserId, { category: 'Venue' })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0].category).toBe('Venue')
      expect(result.data![0].status).toBe('under_budget')
    })

    it('should calculate item status correctly', async () => {
      const mockBudgetItems = [
        {
          id: '1',
          userId: testUserId,
          category: 'Test',
          name: 'Over Budget Item',
          budgetedAmount: 1000,
          actualAmount: 1200,
          currency: 'NGN',
          priority: 'MEDIUM',
          isPaid: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          userId: testUserId,
          category: 'Test',
          name: 'On Budget Item',
          budgetedAmount: 1000,
          actualAmount: 1000,
          currency: 'NGN',
          priority: 'MEDIUM',
          isPaid: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          userId: testUserId,
          category: 'Test',
          name: 'Not Spent Item',
          budgetedAmount: 1000,
          actualAmount: 0,
          currency: 'NGN',
          priority: 'MEDIUM',
          isPaid: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(mockPrisma.budgetItem.findMany).mockResolvedValue(mockBudgetItems)

      const result = await budgetService.getBudgetItems(testUserId)

      expect(result.success).toBe(true)
      expect(result.data![0].status).toBe('over_budget')
      expect(result.data![1].status).toBe('on_budget')
      expect(result.data![2].status).toBe('not_spent')
    })
  })

  describe('createBudgetItem', () => {
    it('should create budget item successfully', async () => {
      const createData = {
        category: 'Venue',
        name: 'Wedding Hall',
        description: 'Main venue for ceremony',
        budgetedAmount: 100000,
        actualAmount: 0,
        currency: 'NGN',
        priority: 'HIGH' as const
      }

      const mockCreatedItem = {
        id: 'new-item-id',
        userId: testUserId,
        ...createData,
        vendorId: null,
        dueDate: null,
        isPaid: false,
        paymentDate: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(mockPrisma.budgetItem.create).mockResolvedValue(mockCreatedItem)

      const result = await budgetService.createBudgetItem(testUserId, createData)

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Wedding Hall')
      expect(result.data?.category).toBe('Venue')
      expect(result.data?.status).toBe('not_spent')
      expect(mockPrisma.budgetItem.create).toHaveBeenCalledWith({
        data: {
          userId: testUserId,
          category: 'Venue',
          name: 'Wedding Hall',
          description: 'Main venue for ceremony',
          budgetedAmount: 100000,
          actualAmount: 0,
          currency: 'NGN',
          priority: 'HIGH',
          vendorId: undefined,
          dueDate: undefined,
          isPaid: false,
          paymentDate: undefined,
          notes: undefined
        }
      })
    })

    it('should validate required fields', async () => {
      const invalidData = {
        category: '',
        name: '',
        budgetedAmount: -100
      }

      const result = await budgetService.createBudgetItem(testUserId, invalidData as any)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(result.error?.message).toContain('Name is required')
    })

    it('should handle database errors', async () => {
      const createData = {
        category: 'Venue',
        name: 'Wedding Hall',
        budgetedAmount: 100000
      }

      vi.mocked(mockPrisma.budgetItem.create).mockRejectedValue(new Error('Database error'))

      const result = await budgetService.createBudgetItem(testUserId, createData)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('BUDGET_ITEM_CREATE_FAILED')
    })
  })

  describe('updateBudgetItem', () => {
    it('should update budget item successfully', async () => {
      const itemId = 'item-123'
      const updateData = {
        name: 'Updated Wedding Hall',
        actualAmount: 95000
      }

      const mockExistingItem = {
        id: itemId,
        userId: testUserId,
        category: 'Venue',
        name: 'Wedding Hall',
        budgetedAmount: 100000,
        actualAmount: 0
      }

      const mockUpdatedItem = {
        ...mockExistingItem,
        ...updateData,
        updatedAt: new Date()
      }

      vi.mocked(mockPrisma.budgetItem.findFirst).mockResolvedValue(mockExistingItem as any)
      vi.mocked(mockPrisma.budgetItem.update).mockResolvedValue(mockUpdatedItem as any)

      const result = await budgetService.updateBudgetItem(testUserId, itemId, updateData)

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Updated Wedding Hall')
      expect(result.data?.actualAmount).toBe(95000)
      expect(result.data?.status).toBe('under_budget')
    })

    it('should return error for non-existent item', async () => {
      const itemId = 'non-existent'
      const updateData = { name: 'Updated Name' }

      vi.mocked(mockPrisma.budgetItem.findFirst).mockResolvedValue(null)

      const result = await budgetService.updateBudgetItem(testUserId, itemId, updateData)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('BUDGET_ITEM_NOT_FOUND')
    })
  })

  describe('deleteBudgetItem', () => {
    it('should delete budget item successfully', async () => {
      const itemId = 'item-123'

      const mockExistingItem = {
        id: itemId,
        userId: testUserId,
        category: 'Venue',
        name: 'Wedding Hall'
      }

      vi.mocked(mockPrisma.budgetItem.findFirst).mockResolvedValue(mockExistingItem as any)
      vi.mocked(mockPrisma.budgetItem.delete).mockResolvedValue(mockExistingItem as any)

      const result = await budgetService.deleteBudgetItem(testUserId, itemId)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockPrisma.budgetItem.delete).toHaveBeenCalledWith({
        where: { id: itemId }
      })
    })

    it('should return error for non-existent item', async () => {
      const itemId = 'non-existent'

      vi.mocked(mockPrisma.budgetItem.findFirst).mockResolvedValue(null)

      const result = await budgetService.deleteBudgetItem(testUserId, itemId)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('BUDGET_ITEM_NOT_FOUND')
    })
  })

  describe('getBudgetCategories', () => {
    it('should calculate category breakdown correctly', async () => {
      const mockBudgetItems = [
        {
          category: 'Venue',
          budgetedAmount: 100000,
          actualAmount: 95000
        },
        {
          category: 'Venue',
          budgetedAmount: 20000,
          actualAmount: 20000
        },
        {
          category: 'Catering',
          budgetedAmount: 50000,
          actualAmount: 55000
        }
      ]

      vi.mocked(mockPrisma.budgetItem.findMany).mockResolvedValue(mockBudgetItems as any)

      const result = await budgetService.getBudgetCategories(testUserId)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      
      const venueCategory = result.data!.find(cat => cat.category === 'Venue')
      expect(venueCategory?.budgetedAmount).toBe(120000)
      expect(venueCategory?.actualAmount).toBe(115000)
      expect(venueCategory?.remainingAmount).toBe(5000)
      expect(venueCategory?.itemCount).toBe(2)
      
      const cateringCategory = result.data!.find(cat => cat.category === 'Catering')
      expect(cateringCategory?.budgetedAmount).toBe(50000)
      expect(cateringCategory?.actualAmount).toBe(55000)
      expect(cateringCategory?.remainingAmount).toBe(-5000)
      expect(cateringCategory?.percentageUsed).toBe(110)
    })
  })

  describe('cleanup', () => {
    it('should disconnect from database', async () => {
      await budgetService.cleanup()
      expect(mockPrisma.$disconnect).toHaveBeenCalled()
    })

    it('should handle cleanup errors gracefully', async () => {
      vi.mocked(mockPrisma.$disconnect).mockRejectedValue(new Error('Disconnect failed'))
      
      // Should not throw
      await expect(budgetService.cleanup()).resolves.toBeUndefined()
    })
  })
})