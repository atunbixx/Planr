import { prisma } from '@/lib/prisma'
import { BudgetCategory, Prisma } from '@prisma/client'
import { BaseRepository } from '@/lib/repositories/BaseRepository'

export class BudgetCategoryRepository extends BaseRepository<BudgetCategory> {
  async findById(id: string): Promise<BudgetCategory | null> {
    return this.executeQuery(() =>
      prisma.budgetCategory.findUnique({ where: { id } })
    )
  }

  async findByCoupleId(coupleId: string): Promise<BudgetCategory[]> {
    return this.executeQuery(() =>
      prisma.budgetCategory.findMany({ 
        where: { coupleId },
        orderBy: { displayOrder: 'asc' },
        include: {
          _count: {
            select: { expenses: true }
          }
        }
      })
    )
  }

  async findByName(name: string, coupleId: string): Promise<BudgetCategory | null> {
    return this.executeQuery(() =>
      prisma.budgetCategory.findFirst({ 
        where: { 
          name,
          coupleId 
        } 
      })
    )
  }

  async create(data: Prisma.BudgetCategoryCreateInput): Promise<BudgetCategory> {
    return this.executeQuery(() =>
      prisma.budgetCategory.create({ data })
    )
  }

  async createDefaults(coupleId: string): Promise<BudgetCategory[]> {
    const defaultCategories = [
      { name: 'Venue & Catering', icon: '🏛️', color: '#8B5CF6', allocatedAmount: 10000 },
      { name: 'Photography & Video', icon: '📸', color: '#EC4899', allocatedAmount: 3000 },
      { name: 'Music & Entertainment', icon: '🎵', color: '#10B981', allocatedAmount: 2000 },
      { name: 'Flowers & Decor', icon: '💐', color: '#F59E0B', allocatedAmount: 2500 },
      { name: 'Attire & Beauty', icon: '👗', color: '#3B82F6', allocatedAmount: 2000 },
      { name: 'Invitations & Stationery', icon: '💌', color: '#6366F1', allocatedAmount: 500 },
      { name: 'Transportation', icon: '🚗', color: '#14B8A6', allocatedAmount: 1000 },
      { name: 'Gifts & Favors', icon: '🎁', color: '#F97316', allocatedAmount: 500 },
      { name: 'Miscellaneous', icon: '📦', color: '#6B7280', allocatedAmount: 1500 }
    ]

    return this.withTransaction(async (tx) => {
      const categories = await Promise.all(
        defaultCategories.map((cat, index) =>
          tx.budgetCategory.create({
            data: {
              coupleId,
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              allocatedAmount: cat.allocatedAmount,
              displayOrder: index,
              isDefault: true
            }
          })
        )
      )
      return categories
    })
  }

  async update(id: string, data: Prisma.BudgetCategoryUpdateInput): Promise<BudgetCategory> {
    return this.executeQuery(() =>
      prisma.budgetCategory.update({ 
        where: { id },
        data 
      })
    )
  }

  async delete(id: string): Promise<BudgetCategory> {
    return this.executeQuery(() =>
      prisma.budgetCategory.delete({ where: { id } })
    )
  }

  async getSpendingByCoupleId(coupleId: string): Promise<{
    categories: Array<{
      id: string
      name: string
      allocatedAmount: number
      spentAmount: number
      remainingAmount: number
      percentageUsed: number
    }>
    totalAllocated: number
    totalSpent: number
    totalRemaining: number
  }> {
    return this.executeQuery(async () => {
      const categories = await prisma.budgetCategory.findMany({
        where: { coupleId },
        include: {
          expenses: {
            where: { isPaid: true }
          }
        },
        orderBy: { displayOrder: 'asc' }
      })

      const categoriesWithSpending = categories.map(cat => {
        const spentAmount = cat.expenses.reduce((sum, exp) => sum + exp.amount.toNumber(), 0)
        const remainingAmount = cat.allocatedAmount.toNumber() - spentAmount
        const percentageUsed = cat.allocatedAmount.toNumber() > 0 
          ? (spentAmount / cat.allocatedAmount.toNumber()) * 100 
          : 0

        return {
          id: cat.id,
          name: cat.name,
          allocatedAmount: cat.allocatedAmount.toNumber(),
          spentAmount,
          remainingAmount,
          percentageUsed
        }
      })

      const totalAllocated = categoriesWithSpending.reduce((sum, cat) => sum + cat.allocatedAmount, 0)
      const totalSpent = categoriesWithSpending.reduce((sum, cat) => sum + cat.spentAmount, 0)
      const totalRemaining = totalAllocated - totalSpent

      return {
        categories: categoriesWithSpending,
        totalAllocated,
        totalSpent,
        totalRemaining
      }
    })
  }

  async updateDisplayOrder(updates: { id: string; displayOrder: number }[]): Promise<void> {
    return this.withTransaction(async (tx) => {
      await Promise.all(
        updates.map(({ id, displayOrder }) =>
          tx.budgetCategory.update({
            where: { id },
            data: { displayOrder }
          })
        )
      )
    })
  }
}