import ClientRegionVendorsPage from './ClientPage'

export const revalidate = 3600

async function getInitial(region: string) {
  const qs = new URLSearchParams()
  qs.set('page', '1')
  qs.set('pageSize', '12')
  qs.set('region', region)
  const base = process.env.NEXT_PUBLIC_BASE_URL || ''
  const url = `${base}/api/public/vendors?${qs.toString()}`
  const res = await fetch(url, { next: { revalidate } }).catch(() => null as any)
  let vendors: any[] = []
  let total = 0
  if (res && (res as any).ok) {
    const j = await (res as any).json().catch(()=>null)
    vendors = j?.data?.vendors || []
    total = j?.data?.total || 0
  }
  return { vendors, total, pageSize: 12 }
}

export default async function RegionVendorsPage({ params }: { params: { region: string } }) {
  const region = decodeURIComponent(params.region || '')
  const initial = await getInitial(region)
  return <ClientRegionVendorsPage region={region} initial={initial} />
}
