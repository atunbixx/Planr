import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { VendorService } from '@/features/vendors/service/vendor.service'
import { ClientPage } from './ClientPage'

// Next.js requires a statically analyzable value here
export const revalidate = 900

interface VendorPageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  try {
    const service = new VendorService()
    const popular = await service.getPopularVendors(50)
    if (!popular.success) return []
    return (popular.data || []).map(v => ({ slug: v.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  try {
    const service = new VendorService()
    const res = await service.getVendorBySlug(params.slug)
    const vendor = res.success ? res.data : null
    if (!vendor) {
      return {
        title: 'Vendor Not Found | Planr',
        description: 'The requested vendor could not be found.',
      }
    }
    return {
      title: `${vendor.businessName} | ${vendor.category} | Planr`,
      description: vendor.description,
      openGraph: {
        title: `${vendor.businessName} | ${vendor.category}`,
        description: vendor.description,
        images: Array.isArray(vendor.images) && vendor.images[0]?.url
          ? [{ url: vendor.images[0].url } as any]
          : undefined,
      },
    }
  } catch {
    return { title: 'Vendor | Planr' }
  }
}

export default async function VendorPage({ params }: VendorPageProps) {
  const service = new VendorService()
  const res = await service.getVendorBySlug(params.slug)
  if (!res.success || !res.data) {
    notFound()
  }
  return <ClientPage vendor={res.data} />
}
