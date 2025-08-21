import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'
  const urls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/vendors`, lastModified: new Date() },
  ]

  try {
    const categories = await prisma.directoryVendor.groupBy({ by: ['category'], _count: { _all: true } })
    const regions = await prisma.directoryVendor.groupBy({ by: ['region'], _count: { _all: true } })
    for (const c of categories) {
      if (!c.category) continue
      urls.push({ url: `${baseUrl}/vendors/category/${encodeURIComponent(c.category)}`, lastModified: new Date() })
    }
    for (const r of regions) {
      if (!r.region) continue
      urls.push({ url: `${baseUrl}/vendors/region/${encodeURIComponent(r.region)}`, lastModified: new Date() })
    }
    const vendors = await prisma.directoryVendor.findMany({ select: { id: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 200 })
    for (const v of vendors) urls.push({ url: `${baseUrl}/vendors/${v.id}`, lastModified: v.updatedAt })
  } catch {
    const fallbackCategories = ['venue','photographer','videographer','catering','florist','music']
    const fallbackRegions = ['NG','US','GB','CA']
    fallbackCategories.forEach(c => urls.push({ url: `${baseUrl}/vendors/category/${c}`, lastModified: new Date() }))
    fallbackRegions.forEach(r => urls.push({ url: `${baseUrl}/vendors/region/${r}`, lastModified: new Date() }))
  }

  return urls
}

