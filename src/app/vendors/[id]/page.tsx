import ClientVendorProfilePage from './ClientPage'

export const revalidate = 3600

export default async function VendorProfilePage({ params }: { params: { id: string } }) {
  const id = params.id
  let initial: any = null
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || ''
    const res = await fetch(`${base}/api/public/vendors/${id}`, { next: { revalidate } })
    if (res.ok) {
      const j = await res.json()
      initial = j?.data || null
    }
  } catch {}
  return <ClientVendorProfilePage initial={initial} />
}

