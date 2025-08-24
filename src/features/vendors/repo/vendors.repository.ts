import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'
import { RepositoryResult, createErrorResult, createSuccessResult } from '@/lib/repositories/BaseRepository'

export type VendorRecord = {
  id: string
  userId: string
  name: string
  category: string
  priceRange?: string
  contact?: string
  website?: string
  createdAt: string
  updatedAt: string
  status?: 'inquiry'|'shortlisted'|'quoted'|'booked'|'contracted'|'paid'
  rating?: number
  isfavorite?: boolean
  email?: string
  phone?: string
  address?: string
  city?: string
  tags?: string[]
  notes?: string
  quoteamount?: number
  bookeddate?: string
  instagramurl?: string
  logourl?: string
}

export class VendorsRepository {
  async list(userId: string, opts?: { q?: string; category?: string; status?: string; page?: number; pageSize?: number }): Promise<RepositoryResult<{ vendors: VendorRecord[]; total: number }>> {
    try {
      const where: any = { userId }
      if (opts?.category) where.category = opts.category
      if (opts?.status) where.status = opts.status
      if (opts?.q) {
        where.OR = [
          { name: { contains: opts.q, mode: 'insensitive' } },
          { category: { contains: opts.q, mode: 'insensitive' } },
          { contact: { contains: opts.q, mode: 'insensitive' } },
          { notes: { contains: opts.q, mode: 'insensitive' } },
        ]
      }
      const total = await prisma.vendor.count({ where })
      const orderBy: any = { createdAt: 'desc' }
      let vendors
      if (opts?.page && opts?.pageSize) {
        vendors = await prisma.vendor.findMany({ where, orderBy, skip: (opts.page - 1) * opts.pageSize, take: opts.pageSize })
      } else {
        vendors = await prisma.vendor.findMany({ where, orderBy })
      }
      return createSuccessResult({ vendors: vendors as any, total })
    } catch (err) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          const { vendors, total } = await tempStorage.listVendors(userId, { q: opts?.q, category: opts?.category, status: opts?.status, skip: opts?.page && opts?.pageSize ? (opts.page - 1) * opts.pageSize : 0, take: opts?.pageSize })
          return createSuccessResult({ vendors: vendors as any, total })
        }
      } catch (e) {
        // ignore and fall through to error
      }
      return createErrorResult('Failed to list vendors', 'VENDORS_LIST_FAILED', 500)
    }
  }

  async create(userId: string, data: Partial<VendorRecord>): Promise<RepositoryResult<VendorRecord>> {
    try {
      const vendor = await prisma.vendor.create({ data: { ...(data as any), userId } })
      return createSuccessResult(vendor as any)
    } catch (err) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          const v = await tempStorage.createVendor(userId, data as any)
          return createSuccessResult(v as any)
        }
      } catch (e) {
        // ignore and fall through
      }
      return createErrorResult('Failed to create vendor', 'VENDOR_CREATE_FAILED', 500)
    }
  }

  async get(userId: string, id: string): Promise<RepositoryResult<VendorRecord | null>> {
    try {
      const v = await prisma.vendor.findFirst({ where: { id, userId } })
      return createSuccessResult((v as any) || null)
    } catch (err) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          const { vendors } = await tempStorage.listVendors(userId)
          const v = vendors.find((vv: any) => vv.id === id)
          return createSuccessResult((v as any) || null)
        }
      } catch (e) {
        // ignore
      }
      return createErrorResult('Failed to get vendor', 'VENDOR_GET_FAILED', 500)
    }
  }

  async update(userId: string, id: string, data: Partial<VendorRecord>): Promise<RepositoryResult<VendorRecord | null>> {
    try {
      const existing = await prisma.vendor.findFirst({ where: { id, userId } })
      if (!existing) return createSuccessResult(null)
      await prisma.vendor.update({ where: { id }, data: data as any })
      const updated = await prisma.vendor.findFirst({ where: { id, userId } })
      return createSuccessResult(updated as any)
    } catch (err) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          const updated = await tempStorage.updateVendor(userId, id, data as any)
          return createSuccessResult(updated as any)
        }
      } catch (e) {
        // ignore
      }
      return createErrorResult('Failed to update vendor', 'VENDOR_UPDATE_FAILED', 500)
    }
  }

  async delete(userId: string, id: string): Promise<RepositoryResult<boolean>> {
    try {
      const existing = await prisma.vendor.findFirst({ where: { id, userId } })
      if (!existing) return createSuccessResult(false)
      await prisma.vendor.delete({ where: { id } })
      return createSuccessResult(true)
    } catch (err) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          const ok = await tempStorage.deleteVendor(userId, id)
          return createSuccessResult(ok)
        }
      } catch (e) {
        // ignore
      }
      return createErrorResult('Failed to delete vendor', 'VENDOR_DELETE_FAILED', 500)
    }
  }
}
