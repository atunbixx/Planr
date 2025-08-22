"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Script from 'next/script'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, Star } from 'lucide-react'
import AuthClient from '@/lib/auth/client'
import { normalizeCategory } from '@/lib/vendors/categories'

type DirVendor = {
  id: string
  name: string
  category: string
  city?: string
  region?: string
  priceBand?: string
  averageRating?: number
  reviewCount?: number
  shortDescription?: string
  photos?: string[]
  website?: string
  phone?: string
}

export default function PublicVendorsPage() {
  const [vendors, setVendors] = useState<DirVendor[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [region, setRegion] = useState('')
  const [minRating, setMinRating] = useState('')
  const [tags, setTags] = useState('')
  const [sort, setSort] = useState('newest')
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [myVendors, setMyVendors] = useState<any[]>([])
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity?: 'success'|'error'|'info' }>({ open: false, message: '', severity: 'success' })

  const categories = ['venue','photographer','videographer','catering','florist','music']
  const regions = ['NG','US','GB','CA']
  const placeholderByCategory: Record<string, string> = {
    photographer: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop',
    videographer: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
    venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop',
    catering: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
    florist: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?q=80&w=1200&auto=format&fit=crop',
    music: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop',
  }

  async function load() {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (q.trim()) params.set('q', q.trim())
    if (category) params.set('category', category)
    if (region) params.set('region', region)
    if (minRating) params.set('minRating', minRating)
    if (sort) params.set('sort', sort)
    if (tags.trim()) params.set('tags', tags.split(',').map(s=>s.trim()).filter(Boolean).join(','))
    setLoading(true)
    try {
      const res = await fetch(`/api/public/vendors?${params.toString()}`)
      const json = await res.json()
      setVendors(json?.data?.vendors || [])
      setTotal(json?.data?.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, pageSize])

  // Load when filters change (except search which loads on Enter or Clear All)
  useEffect(() => {
    setPage(1)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, region, minRating, sort, tags])

  // Default region from user preferences if available; else from browser locale
  useEffect(() => {
    async function initRegion() {
      if (region) return
      try {
        const token = AuthClient.getToken()
        if (token) {
          const res = await fetch('/api/preferences', { headers: { Authorization: `Bearer ${token}` } })
          if (res.ok) {
            const pj = await res.json()
            const prefRegion = pj?.data?.region
            if (prefRegion && typeof prefRegion === 'string') {
              setRegion(prefRegion)
              return
            }
          }
        }
      } catch {}
      try {
        const lang = typeof navigator !== 'undefined' ? navigator.language : ''
        const locRegion = lang && lang.includes('-') ? lang.split('-')[1].toUpperCase() : ''
        if (locRegion && ['NG','US','GB','CA'].includes(locRegion)) {
          setRegion(locRegion)
        }
      } catch {}
    }
    initRegion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load user's vendors (to pre-mark saved) if authenticated
  useEffect(() => {
    async function loadMine() {
      try {
        const token = AuthClient.getToken()
        if (!token) return
        const res = await fetch('/api/vendors', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) return
        const json = await res.json().catch(()=>null)
        setMyVendors(Array.isArray(json?.data) ? json.data : [])
      } catch {}
    }
    loadMine()
  }, [])

  // Compute saved map from myVendors and current vendors list
  useEffect(() => {
    if (!vendors.length) return
    const mineKeys = new Set<string>()
    const mineWeb = new Set<string>()
    const minePhone = new Set<string>()
    const normWeb = (u?: string) => {
      const s = String(u || '').trim().toLowerCase()
      if (!s) return ''
      try {
        const withProto = s.startsWith('http://') || s.startsWith('https://') ? s : `https://${s}`
        const url = new URL(withProto)
        return url.hostname.replace(/^www\./, '')
      } catch {
        const noScheme = s.replace(/^https?:\/\//, '')
        return noScheme.split('/')[0].replace(/^www\./, '')
      }
    }
    for (const mv of myVendors) {
      const name = String(mv?.name || '').toLowerCase().trim()
      const cat = normalizeCategory(String(mv?.category || ''))
      if (name) mineKeys.add(`${name}|${cat}`)
      const w = normWeb(mv?.website)
      if (w) mineWeb.add(w)
      const p = String(mv?.phone || '').replace(/[^0-9]/g, '')
      if (p) minePhone.add(p)
    }
    const nextSaved: Record<string, boolean> = {}
    for (const v of vendors) {
      const key = `${v.name.toLowerCase().trim()}|${normalizeCategory(String(v.category||''))}`
      const w = normWeb((v as any).website)
      const p = String((v as any).phone || '').replace(/[^0-9]/g, '')
      if (mineKeys.has(key) || (w && mineWeb.has(w)) || (p && minePhone.has(p))) nextSaved[v.id] = true
    }
    if (Object.keys(nextSaved).length) setSaved(prev => ({ ...prev, ...nextSaved }))
  }, [vendors, myVendors])

  const activeFilters = useMemo(() => {
    const arr: Array<{ label: string; onClear: () => void }> = []
    if (category) arr.push({ label: `Category: ${category}`, onClear: () => { setCategory(''); setPage(1); } })
    if (region) arr.push({ label: `Region: ${region}`, onClear: () => { setRegion(''); setPage(1); } })
    if (minRating) arr.push({ label: `Rating: ${minRating}+`, onClear: () => { setMinRating(''); setPage(1); } })
    if (sort && sort !== 'newest') arr.push({ label: `Sort: ${sort}`, onClear: () => { setSort('newest'); setPage(1); } })
    if (tags.trim()) arr.push({ label: `Tags: ${tags}`, onClear: () => { setTags(''); setPage(1); } })
    if (q.trim()) arr.push({ label: `Search: ${q}`, onClear: () => { setQ(''); setPage(1); load() } })
    return arr
  }, [category, region, minRating, sort, tags, q])

  async function saveToMyVendors(v: DirVendor) {
    const token = AuthClient.getToken()
    if (!token) {
      if (typeof window !== 'undefined') window.location.href = '/signin'
      return
    }
    setSaving(prev => ({ ...prev, [v.id]: true }))
    try {
      // Duplicate guard: check if vendor with same name/category exists
      const qs = new URLSearchParams()
      qs.set('q', v.name)
      if (v.category) qs.set('category', v.category)
      const existingRes = await fetch(`/api/vendors?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      if (existingRes.ok) {
        const ej = await existingRes.json().catch(()=>null)
        const list: any[] = Array.isArray(ej?.data) ? ej.data : []
        const dupe = list.find((it: any) => {
          const nameMatch = String(it.name || '').toLowerCase().trim() === v.name.toLowerCase().trim()
          const norm = (u?: string) => {
            const s = String(u || '').trim().toLowerCase();
            if (!s) return ''
            try { const url = new URL(s.startsWith('http') ? s : `https://${s}`); return url.hostname.replace(/^www\./,'') } catch { return s.replace(/^https?:\/\//,'').split('/')[0].replace(/^www\./,'') }
          }
          const webMatch = norm(it.website) && norm((v as any).website) && norm(it.website) === norm((v as any).website)
          const phoneMatch = String(it.phone || '').replace(/[^0-9]/g, '') && String((v as any).phone || '').replace(/[^0-9]/g, '') && String(it.phone || '').replace(/[^0-9]/g, '') === String((v as any).phone || '').replace(/[^0-9]/g, '')
          return nameMatch || webMatch || phoneMatch
        })
        if (dupe) {
          setSaved(prev => ({ ...prev, [v.id]: true }))
          setSnack({ open: true, message: 'Already in My Vendors', severity: 'info' })
          return
        }
      }
      // Also check against locally loaded myVendors in case API filter missed
      const normLocal = (u?: string) => {
        const s = String(u || '').trim().toLowerCase()
        if (!s) return ''
        try { const url = new URL(s.startsWith('http') ? s : `https://${s}`); return url.hostname.replace(/^www\./,'') } catch { return s.replace(/^https?:\/\//,'').split('/')[0].replace(/^www\./,'') }
      }
      const webSig = normLocal((v as any).website)
      if (webSig && myVendors.some(mv => normLocal(mv?.website) === webSig)) {
        setSaved(prev => ({ ...prev, [v.id]: true }))
        setSnack({ open: true, message: 'Already in My Vendors', severity: 'info' })
        return
      }
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: v.name, category: v.category, website: (v as any).website || undefined })
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(prev => ({ ...prev, [v.id]: true }))
      setSnack({ open: true, message: 'Saved to My Vendors', severity: 'success' })
    } catch (e) {
      setSnack({ open: true, message: 'Could not save vendor', severity: 'error' })
    } finally {
      setSaving(prev => ({ ...prev, [v.id]: false }))
    }
  }

  return (
    <div className="px-4 md:px-8 py-8">
      <Head>
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/vendors`} />
      </Head>
      {/* SEO Schema.org ItemList for directory */}
      <Script id="schema-vendor-list" type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: vendors.map((v, idx) => ({
            '@type': 'ListItem',
            position: (page - 1) * pageSize + idx + 1,
            url: `${typeof window !== 'undefined' ? window.location.origin : ''}/vendors/${v.id}`,
            name: v.name,
          })),
        })}
      </Script>
      <h1 className="text-3xl font-normal mb-6" style={{ fontFamily: '"Bodoni Moda", serif' }}>
        Vendor Directory
      </h1>

      {/* Quick links to landing pages */}
      <div className="flex gap-2 flex-wrap mb-2">
        {['venue','photographer','videographer','catering','florist','music'].map(c => (
          <Link key={c} href={`/vendors/category/${encodeURIComponent(c)}`}>
            <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">
              {c.charAt(0).toUpperCase()+c.slice(1)}
            </Badge>
          </Link>
        ))}
        {region && (
          <Link href={`/vendors/region/${encodeURIComponent(region)}`}>
            <Badge className="cursor-pointer">
              Region: {region}
            </Badge>
          </Link>
        )}
      </div>

      <div className="flex gap-4 flex-wrap mb-4 items-center">
        <div className="relative flex-grow min-w-64 sm:min-w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search vendors…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load() } }}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={(value) => { setCategory(value); setPage(1); }}>
          <SelectTrigger className="w-40 sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={region} onValueChange={(value) => { setRegion(value); setPage(1); }}>
          <SelectTrigger className="w-36 sm:w-44">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={minRating} onValueChange={(value) => { setMinRating(value); setPage(1); }}>
          <SelectTrigger className="w-36 sm:w-44">
            <SelectValue placeholder="Min Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            {[5,4,3].map(n => <SelectItem key={n} value={String(n)}>{n}+</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => { setSort(value); setPage(1); }}>
          <SelectTrigger className="w-40 sm:w-48">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="rating_desc">Rating</SelectItem>
            <SelectItem value="reviews_desc">Most Reviews</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Subtle region info chip */}
      {region && (
        <div className="mb-4">
          <Badge variant="outline" className="text-xs">
            Using region: {region}
            <button 
              onClick={() => { setRegion(''); setPage(1); load() }}
              className="ml-2 hover:bg-gray-200 rounded-full p-1"
            >
              ×
            </button>
          </Badge>
        </div>
      )}

      <p className="text-sm text-gray-600 mb-2">
        {loading ? 'Loading vendors…' : total === 0 ? 'No vendors match your filters.' : `${total} result${total === 1 ? '' : 's'}`}
      </p>
      <div className="space-y-4">
        {activeFilters.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {activeFilters.map((f, i) => (
              <Badge key={i} variant="secondary" className="cursor-pointer" onClick={f.onClear}>
                {f.label} ×
              </Badge>
            ))}
            <Button size="sm" variant="outline" onClick={() => { setCategory(''); setRegion(''); setMinRating(''); setSort('newest'); setTags(''); setQ(''); setPage(1); load() }}>Clear All</Button>
          </div>
        )}
        <div>
          <Input placeholder="Tags (comma-separated)" value={tags} onChange={(e)=>{ setTags(e.target.value); setPage(1); }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {!loading && vendors.map(v => {
            const img = (v.photos && v.photos[0]) || placeholderByCategory[v.category] || 'linear-gradient(135deg, #fafafa 0%, #eee 100%)'
            return (
              <Card key={v.id} className="h-full flex flex-col">
                {/* Image header fixed height */}
                <div 
                  className="h-44 bg-gray-100 bg-cover bg-center" 
                  style={{ backgroundImage: `url(${img})` }}
                />
                <CardContent className="flex flex-col gap-2 flex-grow p-4">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="font-normal text-lg leading-tight" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                      <Link href={`/vendors/${v.id}`} className="hover:underline">{v.name}</Link>
                    </h3>
                    <div className="flex items-center gap-2">
                      {v.priceBand && <Badge variant="secondary" className="text-xs">{v.priceBand}</Badge>}
                      <Button size="sm" variant="outline" onClick={() => saveToMyVendors(v)} disabled={Boolean(saving[v.id]) || Boolean(saved[v.id])}>
                        {saved[v.id] ? 'Saved' : (saving[v.id] ? 'Saving…' : 'Save')}
                      </Button>
                      {saved[v.id] && (
                        <Button size="sm" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/dashboard/vendors' }}>
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className={`h-4 w-4 ${star <= (v.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">{v.reviewCount || 0} reviews</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2 min-h-10">
                    {v.shortDescription || '\u00A0'}
                  </p>
                  <div className="flex gap-2 flex-wrap mt-auto">
                    <Badge variant="outline" className="text-xs">{v.category}</Badge>
                    {v.city && <Badge variant="outline" className="text-xs">{v.city}</Badge>}
                    {v.region && <Badge variant="outline" className="text-xs">{v.region}</Badge>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {total > pageSize && (
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm">Page {page} of {Math.ceil(total / pageSize)}</span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      {snack.open && (
        <Alert className="fixed bottom-4 right-4 w-auto">
          <AlertDescription>
            {snack.message}
            <Button 
              size="sm" 
              variant="ghost" 
              className="ml-2" 
              onClick={() => { if (typeof window !== 'undefined') window.location.href = '/dashboard/vendors' }}
            >
              View
            </Button>
            <button 
              onClick={() => setSnack(s => ({ ...s, open: false }))}
              className="ml-2 hover:bg-gray-200 rounded-full p-1"
            >
              ×
            </button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
