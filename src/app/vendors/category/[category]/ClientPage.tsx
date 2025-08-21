"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Script from 'next/script'
import Link from 'next/link'
import { Box, Grid, Card, CardContent, Typography, TextField, MenuItem, InputAdornment, Chip, Rating, Pagination, Button } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

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
}

export default function ClientCategoryVendorsPage({ category, initial }: { category: string; initial: { vendors: DirVendor[]; total: number; pageSize: number } }) {
  const [vendors, setVendors] = useState<DirVendor[]>(initial?.vendors || [])
  const [total, setTotal] = useState(initial?.total || 0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(initial?.pageSize || 12)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [region, setRegion] = useState('')
  const [minRating, setMinRating] = useState('')
  const [sort, setSort] = useState('newest')

  const placeholderByCategory: Record<string, string> = {
    photographer: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop',
    photography: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop',
    venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop',
    catering: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
    florist: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?q=80&w=1200&auto=format&fit=crop',
    flowers: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?q=80&w=1200&auto=format&fit=crop',
    music: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop',
    videographer: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
  }

  async function load() {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    params.set('category', category)
    if (q.trim()) params.set('q', q.trim())
    if (region) params.set('region', region)
    if (minRating) params.set('minRating', minRating)
    if (sort) params.set('sort', sort)
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

  useEffect(() => { setPage(1); /* reset when category changes */ }, [category])
  useEffect(() => { load() }, [page, pageSize, category])
  useEffect(() => { setPage(1); load() }, [region, minRating, sort])

  const activeFilters = useMemo(() => {
    const arr: Array<{ label: string; onClear: () => void }> = []
    if (region) arr.push({ label: `Region: ${region}`, onClear: () => { setRegion(''); setPage(1); } })
    if (minRating) arr.push({ label: `Rating: ${minRating}+`, onClear: () => { setMinRating(''); setPage(1); } })
    if (sort && sort !== 'newest') arr.push({ label: `Sort: ${sort}`, onClear: () => { setSort('newest'); setPage(1); } })
    if (q.trim()) arr.push({ label: `Search: ${q}`, onClear: () => { setQ(''); setPage(1); load() } })
    return arr
  }, [region, minRating, sort, q])

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Head>
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/vendors/category/${encodeURIComponent(category)}`} />
      </Head>
      <Script id="schema-vendor-category-list" type="application/ld+json">
        {JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: vendors.map((v, idx) => ({ '@type': 'ListItem', position: (page - 1) * pageSize + idx + 1, url: `${typeof window !== 'undefined' ? window.location.origin : ''}/vendors/${v.id}`, name: v.name })) })}
      </Script>
      <Typography variant="h3" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, mb: 1.5 }}>{category.charAt(0).toUpperCase() + category.slice(1)} Vendors</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Browse {category} vendors. Filter by region, rating, or search.</Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5, alignItems: 'center' }}>
        <TextField placeholder="Search vendors…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load() } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} size="small" sx={{ minWidth: { xs: 260, sm: 320 }, flexGrow: 1 }} />
        <TextField select size="small" label="Region" value={region} onChange={(e) => { setRegion(e.target.value); setPage(1); }} sx={{ minWidth: { xs: 140, sm: 180 } }}>
          <MenuItem value="">All</MenuItem>
          {['NG','US','GB','CA'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Min Rating" value={minRating} onChange={(e) => { setMinRating(e.target.value); setPage(1); }} sx={{ minWidth: { xs: 140, sm: 180 } }}>
          <MenuItem value="">Any</MenuItem>
          {[5,4,3].map(n => <MenuItem key={n} value={String(n)}>{n}+</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Sort" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} sx={{ minWidth: { xs: 160, sm: 200 } }}>
          <MenuItem value="newest">Newest</MenuItem>
          <MenuItem value="rating_desc">Rating</MenuItem>
          <MenuItem value="reviews_desc">Most Reviews</MenuItem>
        </TextField>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{loading ? 'Loading vendors…' : total === 0 ? 'No vendors match your filters.' : `${total} result${total === 1 ? '' : 's'}`}</Typography>
      <Grid container spacing={2}>
        {activeFilters.length > 0 && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              {activeFilters.map((f, i) => (<Chip key={i} label={f.label} onDelete={f.onClear} />))}
              <Button size="small" onClick={() => { setRegion(''); setMinRating(''); setSort('newest'); setQ(''); setPage(1); load() }}>Clear All</Button>
            </Box>
          </Grid>
        )}
        {!loading && vendors.map(v => {
          const key = v.category.toLowerCase()
          const img = (v.photos && v.photos[0]) || placeholderByCategory[key] || 'linear-gradient(135deg, #fafafa 0%, #eee 100%)'
          return (
            <Grid item xs={12} sm={6} md={4} key={v.id}>
              <Card sx={{ borderRadius: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ height: 180, backgroundColor: '#F5F5F5', backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, lineHeight: 1.2 }}>
                      <Link href={`/vendors/${v.id}`}>{v.name}</Link>
                    </Typography>
                    {v.priceBand && <Chip label={v.priceBand} size="small" />}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={Number(v.averageRating || 0)} readOnly precision={0.5} size="small" />
                    <Typography variant="caption" color="text.secondary">{v.reviewCount || 0} reviews</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto', flexWrap: 'wrap' }}>
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
    </Box>
  )
}

