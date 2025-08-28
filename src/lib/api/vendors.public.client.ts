import { DirectoryVendorListItem, DirectoryVendorListResponseDto } from '@/contracts/vendors-public'

export async function listDirectoryVendors(params?: {
  category?: string
  region?: string
  limit?: number
  offset?: number
}): Promise<DirectoryVendorListItem[]> {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.region) qs.set('region', params.region)
  if (params?.limit != null) qs.set('limit', String(params.limit))
  if (params?.offset != null) qs.set('offset', String(params.offset))

  const url = `/api/vendors/directory${qs.toString() ? `?${qs.toString()}` : ''}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to fetch vendors: HTTP ${res.status} ${text}`)
  }
  const json = await res.json()
  if (!json?.success) {
    throw new Error(json?.error?.message || 'Failed to load directory vendors')
  }
  const parsed = DirectoryVendorListResponseDto.safeParse(json.data)
  if (!parsed.success) {
    throw new Error('Invalid vendor directory response shape')
  }
  return parsed.data
}

