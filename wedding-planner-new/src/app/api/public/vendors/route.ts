import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { checkRateLimit } from '@/lib/security/rate-limit'

export async function GET(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0].trim()
    const rl = checkRateLimit(`pub:vendors:${ip || 'unknown'}`, { windowMs: 60000, max: 300 })
    if (!rl.ok) {
      const res = NextResponse.json({ success: false, error: { message: 'Too many requests' } }, { status: 429 })
      res.headers.set('X-RateLimit-Limit', String(rl.limit))
      res.headers.set('X-RateLimit-Remaining', String(rl.remaining))
      res.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
      res.headers.set('Retry-After', String(Math.ceil(rl.retryAfter / 1000)))
      return res
    }
    const url = new URL(request.url)
    const sp = url.searchParams
    const q = sp.get('q') || undefined
    const category = sp.get('category') || undefined
    const city = sp.get('city') || undefined
    const region = sp.get('region') || undefined
    const minRating = sp.get('minRating') ? parseInt(sp.get('minRating')!, 10) : undefined
    const price = sp.get('price') || undefined
    const tags = sp.get('tags') || undefined
    const page = sp.get('page') ? Math.max(1, parseInt(sp.get('page') || '1', 10)) : 1
    const pageSize = sp.get('pageSize') ? Math.max(1, Math.min(60, parseInt(sp.get('pageSize') || '20', 10))) : 20
    const sort = sp.get('sort') || 'newest'

    const where: any = {}
    if (q) where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { shortDescription: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
      { city: { contains: q, mode: 'insensitive' } },
      { region: { contains: q, mode: 'insensitive' } },
    ]
    if (category) where.category = category
    if (city) where.city = city
    if (region) where.region = region
    if (price) where.priceBand = price
    if (typeof minRating === 'number' && !Number.isNaN(minRating)) where.averageRating = { gte: minRating }
    if (tags) {
      const tagList = tags.split(',').map(s => s.trim()).filter(Boolean)
      if (tagList.length) where.tags = { hasEvery: tagList }
    }

    const total = await prisma.directoryVendor.count({ where }).catch(() => 0)
    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'rating_desc') orderBy = { averageRating: 'desc' }
    else if (sort === 'reviews_desc') orderBy = { reviewCount: 'desc' }
    const vendors = await prisma.directoryVendor.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy }).catch(() => [])
    const res = NextResponse.json({ success: true, data: { vendors, total, page, pageSize } })
    res.headers.set('X-RateLimit-Limit', String(rl.limit))
    res.headers.set('X-RateLimit-Remaining', String(rl.remaining))
    res.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
    return res
  } catch (e) {
    return NextResponse.json({ success: true, data: { vendors: [], total: 0, page: 1, pageSize: 20 } })
  }
}
