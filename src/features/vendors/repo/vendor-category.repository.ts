import { prisma } from '@/lib/prisma'
import { VendorCategory, Prisma } from '@prisma/client'
import { BaseRepository } from '@/lib/repositories/BaseRepository'

export class VendorCategoryRepository extends BaseRepository<VendorCategory> {
  async findAll(): Promise<VendorCategory[]> {
    return this.executeQuery(() =>
      prisma.vendorCategory.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { vendors: true }
          }
        }
      })
    )
  }

  async findById(id: string): Promise<VendorCategory | null> {
    return this.executeQuery(() =>
      prisma.vendorCategory.findUnique({ 
        where: { id },
        include: {
          _count: {
            select: { vendors: true }
          }
        }
      })
    )
  }

  async findByName(name: string): Promise<VendorCategory | null> {
    return this.executeQuery(() =>
      prisma.vendorCategory.findFirst({ 
        where: { name } 
      })
    )
  }

  async create(data: Prisma.VendorCategoryCreateInput): Promise<VendorCategory> {
    return this.executeQuery(() =>
      prisma.vendorCategory.create({ data })
    )
  }

  async createDefaults(): Promise<VendorCategory[]> {
    const defaultCategories = [
      { name: 'Venue', icon: '🏛️', color: '#8B5CF6' },
      { name: 'Catering', icon: '🍽️', color: '#EC4899' },
      { name: 'Photography', icon: '📸', color: '#10B981' },
      { name: 'Videography', icon: '🎥', color: '#F59E0B' },
      { name: 'Music & DJ', icon: '🎵', color: '#3B82F6' },
      { name: 'Flowers & Decor', icon: '💐', color: '#6366F1' },
      { name: 'Wedding Planner', icon: '📋', color: '#14B8A6' },
      { name: 'Hair & Makeup', icon: '💄', color: '#F97316' },
      { name: 'Transportation', icon: '🚗', color: '#84CC16' },
      { name: 'Cake & Desserts', icon: '🎂', color: '#A855F7' },
      { name: 'Invitations', icon: '💌', color: '#0EA5E9' },
      { name: 'Attire', icon: '👗', color: '#D946EF' },
      { name: 'Officiant', icon: '📖', color: '#64748B' },
      { name: 'Other', icon: '📦', color: '#6B7280' }
    ]

    return this.withTransaction(async (tx) => {
      // Check if categories already exist
      const existingCount = await tx.vendorCategory.count()
      if (existingCount > 0) {
        return tx.vendorCategory.findMany({
          orderBy: { name: 'asc' }
        })
      }

      // Create default categories
      const categories = await Promise.all(
        defaultCategories.map(cat =>
          tx.vendorCategory.create({ data: cat })
        )
      )
      return categories
    })
  }

  async update(id: string, data: Prisma.VendorCategoryUpdateInput): Promise<VendorCategory> {
    return this.executeQuery(() =>
      prisma.vendorCategory.update({ 
        where: { id },
        data 
      })
    )
  }

  async delete(id: string): Promise<VendorCategory> {
    return this.executeQuery(() =>
      prisma.vendorCategory.delete({ where: { id } })
    )
  }

  async getUsageStats(): Promise<Array<{
    id: string
    name: string
    icon: string
    color: string
    vendorCount: number
    totalSpent: number
  }>> {
    return this.executeQuery(async () => {
      const categories = await prisma.vendorCategory.findMany({
        include: {
          vendors: {
            select: {
              actualCost: true,
              estimatedCost: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        vendorCount: cat.vendors.length,
        totalSpent: cat.vendors.reduce((sum, vendor) => {
          const cost = vendor.actualCost?.toNumber() || vendor.estimatedCost?.toNumber() || 0
          return sum + cost
        }, 0)
      }))
    })
  }
}