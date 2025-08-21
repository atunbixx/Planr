"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Script from 'next/script'
import Link from 'next/link'
import {
  Box, Grid, Card, CardContent, Typography, TextField, MenuItem, InputAdornment, Chip, Rating, Pagination, Button, Snackbar, Alert
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
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
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity?: 'success'|'error' }>({ open: false, message: '', severity: 'success' })

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
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
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
      <Typography variant="h3" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, mb: 3 }}>
        Vendor Directory
      </Typography>

      {/* Quick links to landing pages */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        {['venue','photographer','videographer','catering','florist','music'].map(c => (
          <Chip key={c} label={`${c.charAt(0).toUpperCase()+c.slice(1)}`} component={Link as any} href={`/vendors/category/${encodeURIComponent(c)}`} clickable />
        ))}
        {region && (
          <Chip color="primary" label={`Region: ${region}`} component={Link as any} href={`/vendors/region/${encodeURIComponent(region)}`} clickable />
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5, alignItems: 'center' }}>
        <TextField
          placeholder="Search vendors…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load() } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          size="small"
          sx={{ minWidth: { xs: 260, sm: 320 }, flexGrow: 1 }}
        />
        <TextField select size="small" label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          sx={{ minWidth: { xs: 160, sm: 200 } }}>
          <MenuItem value="">All</MenuItem>
          {categories.map(c => <MenuItem key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Region" value={region} onChange={(e) => { setRegion(e.target.value); setPage(1); }}
          sx={{ minWidth: { xs: 140, sm: 180 } }}>
          <MenuItem value="">All</MenuItem>
          {regions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Min Rating" value={minRating} onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
          sx={{ minWidth: { xs: 140, sm: 180 } }}>
          <MenuItem value="">Any</MenuItem>
          {[5,4,3].map(n => <MenuItem key={n} value={String(n)}>{n}+</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Sort" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
          sx={{ minWidth: { xs: 160, sm: 200 } }}>
          <MenuItem value="newest">Newest</MenuItem>
          <MenuItem value="rating_desc">Rating</MenuItem>
          <MenuItem value="reviews_desc">Most Reviews</MenuItem>
        </TextField>
      </Box>
      {/* Subtle region info chip */}
      {region && (
        <Box sx={{ mb: 2 }}>
          <Chip size="small" variant="outlined" label={`Using region: ${region}`} onDelete={() => { setRegion(''); setPage(1); load() }} />
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {loading ? 'Loading vendors…' : total === 0 ? 'No vendors match your filters.' : `${total} result${total === 1 ? '' : 's'}`}
      </Typography>
      <Grid container spacing={2}>
        {activeFilters.length > 0 && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              {activeFilters.map((f, i) => (
                <Chip key={i} label={f.label} onDelete={f.onClear} />
              ))}
              <Button size="small" onClick={() => { setCategory(''); setRegion(''); setMinRating(''); setSort('newest'); setTags(''); setQ(''); setPage(1); load() }}>Clear All</Button>
            </Box>
          </Grid>
        )}
        <Grid item xs={12}>
          <TextField fullWidth size="small" label="Tags (comma-separated)" placeholder="editorial, outdoor" value={tags} onChange={(e)=>{ setTags(e.target.value); setPage(1); }} />
        </Grid>
        {!loading && vendors.map(v => {
          const img = (v.photos && v.photos[0]) || placeholderByCategory[v.category] || 'linear-gradient(135deg, #fafafa 0%, #eee 100%)'
          return (
            <Grid item xs={12} sm={6} md={4} key={v.id}>
              <Card sx={{ borderRadius: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Image header fixed height */}
                <Box sx={{ height: 180, backgroundColor: '#F5F5F5', backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, lineHeight: 1.2 }}>
                      <Link href={`/vendors/${v.id}`}>{v.name}</Link>
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {v.priceBand && <Chip label={v.priceBand} size="small" />}
                      <Button size="small" variant="outlined" onClick={() => saveToMyVendors(v)} disabled={Boolean(saving[v.id]) || Boolean(saved[v.id])}>
                        {saved[v.id] ? 'Saved' : (saving[v.id] ? 'Saving…' : 'Save')}
                      </Button>
                      {saved[v.id] && (
                        <Button size="small" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/dashboard/vendors' }}>
                          View
                        </Button>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={Number(v.averageRating || 0)} readOnly precision={0.5} size="small" />
                    <Typography variant="caption" color="text.secondary">{v.reviewCount || 0} reviews</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{
                    mb: 0.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '3em',
                  }}>
                    {v.shortDescription || '\u00A0'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                    <Chip label={v.category} size="small" variant="outlined" />
                    {v.city && <Chip label={v.city} size="small" variant="outlined" />}
                    {v.region && <Chip label={v.region} size="small" variant="outlined" />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {total > pageSize && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <Pagination count={Math.ceil(total / pageSize)} page={page} onChange={(e, p) => setPage(p)} color="primary" />
        </Box>
      )}
      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          severity={snack.severity || 'success'}
          variant="filled"
          sx={{ width: '100%' }}
          action={
            <Button size="small" color="inherit" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/dashboard/vendors' }}>View</Button>
          }
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
