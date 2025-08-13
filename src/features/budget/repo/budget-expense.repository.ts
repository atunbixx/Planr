import { prisma } from '@/lib/prisma'
import { BudgetExpense, Prisma } from '@prisma/client'
import { BaseRepository } from '@/lib/repositories/BaseRepository'

export class BudgetExpenseRepository extends BaseRepository<BudgetExpense> {
  constructor() {
    super('budgetExpense')
  }
  async findById(id: string): Promise<BudgetExpense | null> {
    return this.executeQueryWithCache(
      `budgetExpense:id:${id}`,
      () => prisma.budgetExpense.findUnique({ 
        where: { id },
        include: { category: true, vendor: true }
      }),
      { tags: ['budgetExpense', `budgetExpense:${id}`] }
    )
  }

  async findByCoupleId(coupleId: string, filters?: {
    categoryId?: string
    vendorId?: string
    isPaid?: boolean
    startDate?: Date
    endDate?: Date
  }): Promise<BudgetExpense[]> {
    return this.executeQuery(() => {
      const where: Prisma.BudgetExpenseWhereInput = { coupleId }
      
      if (filters?.categoryId) where.categoryId = filters.categoryId
      if (filters?.vendorId) where.vendorId = filters.vendorId
      if (filters?.isPaid !== undefined) where.isPaid = filters.isPaid
      if (filters?.startDate || filters?.endDate) {
        where.date = {}
        if (filters.startDate) where.date.gte = filters.startDate
        if (filters.endDate) where.date.lte = filters.endDate
      }

      return prisma.budgetExpense.findMany({ 
        where,
        include: {
          category: true,
          vendor: true
        },
        orderBy: { date: 'desc' }
      })
    })
  }

  async create(data: Prisma.BudgetExpenseCreateInput): Promise<BudgetExpense> {
    return this.executeQuery(() =>
      prisma.budgetExpense.create({ 
        data,
        include: {
          category: true,
          vendor: true
        }
      })
    )
  }

  async createMany(data: Prisma.BudgetExpenseCreateManyInput[]): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.budgetExpense.createMany({ data })
    )
  }

  async update(id: string, data: Prisma.BudgetExpenseUpdateInput): Promise<BudgetExpense> {
    return this.executeQuery(() =>
      prisma.budgetExpense.update({ 
        where: { id },
        data,
        include: {
          category: true,
          vendor: true
        }
      })
    )
  }

  async updatePaymentStatus(id: string, isPaid: boolean, paymentDate?: Date): Promise<BudgetExpense> {
    return this.executeQuery(() =>
      prisma.budgetExpense.update({
        where: { id },
        data: {
          isPaid,
          paymentDate: paymentDate || (isPaid ? new Date() : null)
        },
        include: {
          category: true,
          vendor: true
        }
      })
    )
  }

  async delete(id: string): Promise<BudgetExpense> {
    return this.executeQuery(() =>
      prisma.budgetExpense.delete({ 
        where: { id },
        include: {
          category: true,
          vendor: true
        }
      })
    )
  }

  async deleteMany(ids: string[]): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.budgetExpense.deleteMany({ 
        where: { 
          id: { in: ids } 
        } 
      })
    )
  }

  async getUpcomingPayments(coupleId: string, days: number = 30): Promise<BudgetExpense[]> {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    return this.executeQuery(() =>
      prisma.budgetExpense.findMany({
        where: {
          coupleId,
          isPaid: false,
          dueDate: {
            lte: futureDate
          }
        },
        include: {
          category: true,
          vendor: true
        },
        orderBy: { dueDate: 'asc' }
      })
    )
  }

  async getMonthlySpending(coupleId: string, months: number = 12): Promise<Array<{
    month: string
    year: number
    total: number
  }>> {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    return this.executeQuery(async () => {
      const expenses = await prisma.budgetExpense.findMany({
        where: {
          coupleId,
          isPaid: true,
          paymentDate: {
            gte: startDate
          }
        },
        select: {
          amount: true,
          paymentDate: true
        }
      })

      // Group by month
      const monthlyTotals = expenses.reduce((acc, expense) => {
        if (!expense.paymentDate) return acc
        
        const month = expense.paymentDate.toLocaleString('default', { month: 'long' })
        const year = expense.paymentDate.getFullYear()
        const key = `${year}-${month}`
        
        if (!acc[key]) {
          acc[key] = {
            month,
            year,
            total: 0
          }
        }
        
        acc[key].total += expense.amount.toNumber()
        return acc
      }, {} as Record<string, { month: string; year: number; total: number }>)

      return Object.values(monthlyTotals).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return new Date(`${a.month} 1`).getMonth() - new Date(`${b.month} 1`).getMonth()
      })
    })
  }

  async getTotalsByVendor(coupleId: string): Promise<Array<{
    vendorId: string
    vendorName: string
    totalAmount: number
    paidAmount: number
    unpaidAmount: number
  }>> {
    return this.executeQuery(async () => {
      const expenses = await prisma.budgetExpense.findMany({
        where: {
          coupleId,
          vendorId: { not: null }
        },
        include: {
          vendor: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Group by vendor
      const vendorTotals = expenses.reduce((acc, expense) => {
        if (!expense.vendor) return acc
        
        const vendorId = expense.vendor.id
        if (!acc[vendorId]) {
          acc[vendorId] = {
            vendorId,
            vendorName: expense.vendor.name,
            totalAmount: 0,
            paidAmount: 0,
            unpaidAmount: 0
          }
        }
        
        const amount = expense.amount.toNumber()
        acc[vendorId].totalAmount += amount
        
        if (expense.isPaid) {
          acc[vendorId].paidAmount += amount
        } else {
          acc[vendorId].unpaidAmount += amount
        }
        
        return acc
      }, {} as Record<string, any>)

      return Object.values(vendorTotals)
    })
  }

  async findByCategoryId(categoryId: string, filters?: {
    paymentStatus?: string[]
    orderBy?: 'dueDate' | 'amount' | 'createdAt'
  }): Promise<BudgetExpense[]> {
    return this.executeQuery(() => {
      const where: Prisma.BudgetExpenseWhereInput = { categoryId }
      
      if (filters?.paymentStatus) {
        where.paymentStatus = { in: filters.paymentStatus }
      }
      
      const orderBy = filters?.orderBy || 'createdAt'
      
      return prisma.budgetExpense.findMany({
        where,
        include: {
          category: true,
          vendor: true
        },
        orderBy: { [orderBy]: 'asc' }
      })
    })
  }

  async deletePendingByCategoryId(categoryId: string): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.budgetExpense.deleteMany({
        where: {
          categoryId,
          paymentStatus: 'pending'
        }
      })
    )
  }
}