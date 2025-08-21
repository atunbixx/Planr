import ClientCategoryVendorsPage from './ClientPage'

export const revalidate = 3600

async function getInitial(category: string) {
  const params = new URLSearchParams()
  params.set('page', '1')
  params.set('pageSize', '12')
  params.set('category', category)
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ? process.env.NEXT_PUBLIC_BASE_URL : ''}/api/public/vendors?${params.toString()}`, { next: { revalidate } }).catch(()=>null as any)
  let vendors: any[] = []
  let total = 0
  if (res && res.ok) {
    const j = await res.json().catch(()=>null)
    vendors = j?.data?.vendors || []
    total = j?.data?.total || 0
  }
  return { vendors, total, pageSize: 12 }
}

export default async function CategoryVendorsPage({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category || '')
  const initial = await getInitial(category)
  return <ClientCategoryVendorsPage category={category} initial={initial} />
}
