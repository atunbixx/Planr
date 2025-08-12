import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface Repository<T> {
  findById(id: string): Promise<T | null>
  findMany(where?: any, options?: any): Promise<T[]>
  create(data: any): Promise<T>
  update(id: string, data: any): Promise<T>
  delete(id: string): Promise<void>
  count(where?: any): Promise<number>
}

export abstract class BaseRepository<T> implements Repository<T> {
  protected prisma: PrismaClient
  protected abstract model: any

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findUnique({
      where: { id }
    })
  }

  async findMany(where?: any, options?: any): Promise<T[]> {
    return await this.model.findMany({
      where,
      ...options
    })
  }

  async create(data: any): Promise<T> {
    return await this.model.create({
      data
    })
  }

  async update(id: string, data: any): Promise<T> {
    return await this.model.update({
      where: { id },
      data
    })
  }

  async delete(id: string): Promise<void> {
    await this.model.delete({
      where: { id }
    })
  }

  async count(where?: any): Promise<number> {
    return await this.model.count({
      where
    })
  }

  async exists(where: any): Promise<boolean> {
    const count = await this.count(where)
    return count > 0
  }

  async findFirst(where: any, options?: any): Promise<T | null> {
    return await this.model.findFirst({
      where,
      ...options
    })
  }

  async createMany(data: any[]): Promise<number> {
    const result = await this.model.createMany({
      data,
      skipDuplicates: true
    })
    return result.count
  }

  async updateMany(where: any, data: any): Promise<number> {
    const result = await this.model.updateMany({
      where,
      data
    })
    return result.count
  }

  async deleteMany(where: any): Promise<number> {
    const result = await this.model.deleteMany({
      where
    })
    return result.count
  }

  async transaction<R>(fn: (prisma: PrismaClient) => Promise<R>): Promise<R> {
    return await this.prisma.$transaction(fn)
  }
}