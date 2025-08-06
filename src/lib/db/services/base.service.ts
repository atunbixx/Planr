import { prisma } from '@/lib/prisma'
import { PaginationParams } from '@/types/api'

export interface FindManyOptions {
  where?: any
  include?: any
  orderBy?: any
  skip?: number
  take?: number
}

export abstract class BaseService<T> {
  protected prisma = prisma
  protected abstract modelName: keyof typeof prisma

  // Generic find methods
  async findById(id: string, include?: any): Promise<T | null> {
    return await (this.prisma[this.modelName] as any).findUnique({
      where: { id },
      include
    })
  }

  async findMany(options: FindManyOptions = {}): Promise<T[]> {
    return await (this.prisma[this.modelName] as any).findMany(options)
  }

  async findFirst(where: any, include?: any): Promise<T | null> {
    return await (this.prisma[this.modelName] as any).findFirst({
      where,
      include
    })
  }

  // Count methods
  async count(where?: any): Promise<number> {
    return await (this.prisma[this.modelName] as any).count({ where })
  }

  // Pagination helper
  async findManyPaginated(
    where: any,
    pagination: PaginationParams,
    include?: any,
    orderBy?: any
  ) {
    const page = pagination.page || 1
    const limit = pagination.limit || 20
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.findMany({
        where,
        include,
        orderBy: orderBy || { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.count(where)
    ])

    return {
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  // Create, Update, Delete methods
  async create(data: any, include?: any): Promise<T> {
    return await (this.prisma[this.modelName] as any).create({
      data,
      include
    })
  }

  async update(id: string, data: any, include?: any): Promise<T> {
    return await (this.prisma[this.modelName] as any).update({
      where: { id },
      data,
      include
    })
  }

  async delete(id: string): Promise<T> {
    return await (this.prisma[this.modelName] as any).delete({
      where: { id }
    })
  }

  // Bulk operations
  async createMany(data: any[]): Promise<{ count: number }> {
    return await (this.prisma[this.modelName] as any).createMany({
      data
    })
  }

  async updateMany(where: any, data: any): Promise<{ count: number }> {
    return await (this.prisma[this.modelName] as any).updateMany({
      where,
      data
    })
  }

  async deleteMany(where: any): Promise<{ count: number }> {
    return await (this.prisma[this.modelName] as any).deleteMany({
      where
    })
  }
}