import { VendorsRepository, VendorRecord } from '../repo/vendors.repository'
import { RepositoryResult, createErrorResult } from '@/lib/repositories/BaseRepository'
import { createVendorSchema, updateVendorSchema } from '@/lib/validation/vendor'
import { normalizeCategory } from '@/lib/vendors/categories'

export class VendorsService {
  private repo = new VendorsRepository()

  async list(userId: string, opts?: { q?: string; category?: string; status?: string; page?: number; pageSize?: number }): Promise<RepositoryResult<{ vendors: VendorRecord[]; total: number }>> {
    const category = opts?.category ? normalizeCategory(opts.category) : undefined
    const status = opts?.status
    return this.repo.list(userId, { ...opts, category, status })
  }

  async create(userId: string, body: any): Promise<RepositoryResult<VendorRecord>> {
    const parsed = createVendorSchema.safeParse(body)
    if (!parsed.success) return createErrorResult('Validation error', 'VALIDATION_ERROR', 400)
    const data = parsed.data as any
    return this.repo.create(userId, {
      name: data.name,
      category: data.category,
      priceRange: data.priceRange,
      contact: data.contact,
      website: data.website,
      status: data.status,
      rating: data.rating as any,
      isfavorite: data.isFavorite,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      tags: data.tags,
      notes: data.notes,
      quoteamount: data.quoteAmount as any,
      bookeddate: data.bookedDate as any,
      instagramurl: data.instagramUrl,
      logourl: data.logoUrl,
    })
  }

  async get(userId: string, id: string) {
    return this.repo.get(userId, id)
  }

  async update(userId: string, id: string, body: any) {
    const parsed = updateVendorSchema.safeParse(body)
    if (!parsed.success) return createErrorResult('Validation error', 'VALIDATION_ERROR', 400)
    const v = parsed.data as any
    const payload: Partial<VendorRecord> = {
      name: v.name,
      category: v.category ? normalizeCategory(v.category) : undefined,
      priceRange: v.priceRange,
      contact: v.contact,
      website: v.website,
      status: v.status,
      rating: v.rating as any,
      isfavorite: typeof v.isFavorite === 'boolean' ? v.isFavorite : undefined,
      email: v.email,
      phone: v.phone,
      address: v.address,
      city: v.city,
      tags: v.tags,
      notes: v.notes,
      quoteamount: v.quoteAmount as any,
      bookeddate: v.bookedDate as any,
      instagramurl: v.instagramUrl,
      logourl: v.logoUrl,
    }
    return this.repo.update(userId, id, payload)
  }

  async delete(userId: string, id: string) {
    return this.repo.delete(userId, id)
  }
}

