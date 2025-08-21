"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Script from 'next/script'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Box, Grid, Card, CardContent, Typography, Chip, Button, Rating, Divider, Skeleton, TextField, Snackbar, Alert } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import AuthClient from '@/lib/auth/client'

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
  description?: string
  photos?: string[]
  website?: string
  email?: string
  phone?: string
  address?: string
  tags?: string[]
}

export default function ClientVendorProfilePage({ initial }: { initial: DirVendor | null }) {
  const router = useRouter()
  const [vendor, setVendor] = useState<DirVendor | null>(initial)
  const [loading, setLoading] = useState(!initial)
  const [inq, setInq] = useState({ name: '', email: '', phone: '', message: '', eventDate: '', budget: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [similar, setSimilar] = useState<DirVendor[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity?: 'success'|'error'|'info' }>({ open: false, message: '', severity: 'success' })

  // Load similar based on initial vendor
  useEffect(() => {
    async function loadSimilar() {
      if (!vendor) return
      const qs = new URLSearchParams()
      if (vendor.category) qs.set('category', vendor.category)
      if (vendor.region) qs.set('region', vendor.region!)
      qs.set('pageSize', '6')
      const res = await fetch(`/api/public/vendors?${qs.toString()}`)
      const json = await res.json()
      const list: DirVendor[] = (json?.data?.vendors || []).filter((v: DirVendor) => v.id !== vendor.id)
      setSimilar(list)
    }
    loadSimilar()
  }, [vendor])

  // Pre-check saved status for profile if authenticated
  useEffect(() => {
    async function checkSaved() {
      try {
        if (!vendor) return
        const token = AuthClient.getToken()
        if (!token) return
        const qs = new URLSearchParams()
        qs.set('q', vendor.name)
        if (vendor.category) qs.set('category', vendor.category)
        const res = await fetch(`/api/vendors?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) return
        const ej = await res.json().catch(()=>null)
        const list: any[] = Array.isArray(ej?.data) ? ej.data : []
        const norm = (u?: string) => {
          const s = String(u || '').trim().toLowerCase()
          if (!s) return ''
          try { const url = new URL(s.startsWith('http') ? s : `https://${s}`); return url.hostname.replace(/^www\./,'') } catch { return s.replace(/^https?:\/\//,'').split('/')[0].replace(/^www\./,'') }
        }
        const dupe = list.find((it: any) => {
          const nameMatch = String(it.name || '').toLowerCase().trim() === vendor.name.toLowerCase().trim()
          const webMatch = norm(it.website) && norm(vendor.website) && norm(it.website) === norm(vendor.website)
          const phoneMatch = String(it.phone || '').replace(/[^0-9]/g, '') && String(vendor.phone || '').replace(/[^0-9]/g, '') && String(it.phone || '').replace(/[^0-9]/g, '') === String(vendor.phone || '').replace(/[^0-9]/g, '')
          return nameMatch || webMatch || phoneMatch
        })
        if (dupe) setSaved(true)
      } catch {}
    }
    checkSaved()
  }, [vendor])

  const canonical = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL || ''
    const id = vendor?.id
    return id ? `${base}/vendors/${id}` : undefined
  }, [vendor?.id])

  if (loading) {
    return (
      <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
        {canonical && (
          <Head>
            <link rel="canonical" href={canonical} />
          </Head>
        )}
        <Skeleton variant="rectangular" height={220} />
        <Box sx={{ mt: 3 }}>
          <Skeleton variant="text" width={320} />
          <Skeleton variant="text" width={180} />
        </Box>
      </Box>
    )
  }

  if (!vendor) {
    return (
      <Box sx={{ px: { xs: 2, md: 4 }, py: 6, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Vendor not found</Typography>
        <Button onClick={() => router.push('/vendors')} variant="outlined">Back to Directory</Button>
      </Box>
    )
  }

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      {canonical && (
        <Head>
          <link rel="canonical" href={canonical} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/` },
                  { '@type': 'ListItem', position: 2, name: 'Wedding Vendors', item: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/vendors` },
                  { '@type': 'ListItem', position: 3, name: vendor?.name || 'Vendor', item: canonical },
                ],
              }),
            }}
          />
        </Head>
      )}
      <Script id="schema-vendor-profile" type="application/ld+json">
        {JSON.stringify({ '@context': 'https://schema.org', '@type': 'LocalBusiness', name: vendor.name, url: typeof window !== 'undefined' ? window.location.href : undefined, address: vendor.address ? { '@type': 'PostalAddress', streetAddress: vendor.address, addressLocality: vendor.city, addressRegion: vendor.region } : undefined, telephone: vendor.phone, email: vendor.email, image: vendor.photos && vendor.photos.length ? vendor.photos : undefined, aggregateRating: vendor.averageRating ? { '@type': 'AggregateRating', ratingValue: vendor.averageRating, reviewCount: vendor.reviewCount || 0 } : undefined, areaServed: vendor.region, description: vendor.shortDescription || vendor.description })}
      </Script>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400 }}>{vendor.name}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Rating value={Number(vendor.averageRating || 0)} readOnly precision={0.5} />
          <Typography variant="body2" color="text.secondary">{vendor.reviewCount || 0} reviews</Typography>
          {vendor.priceBand && <Chip label={vendor.priceBand} size="small" sx={{ ml: 1 }} />}
          <Box sx={{ flex: 1 }} />
          <Chip label={vendor.category} size="small" variant="outlined" />
          {vendor.city && <Chip label={vendor.city} size="small" variant="outlined" />}
          {vendor.region && <Chip label={vendor.region} size="small" variant="outlined" />}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {similar && similar.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Similar Vendors</Typography>
                <Grid container spacing={2}>
                  {similar.map((s) => (
                    <Grid item xs={12} sm={6} md={4} key={s.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontFamily: '"Bodoni Moda", serif' }}>
                            <Link href={`/vendors/${s.id}`}>{s.name}</Link>
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Rating value={Number(s.averageRating || 0)} readOnly precision={0.5} size="small" />
                            <Typography variant="caption" color="text.secondary">{s.reviewCount || 0} reviews</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            <Chip label={s.category} size="small" variant="outlined" />
                            {s.city && <Chip label={s.city} size="small" variant="outlined" />}
                            {s.region && <Chip label={s.region} size="small" variant="outlined" />}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Gallery</Typography>
              {vendor.photos && vendor.photos.length > 0 ? (
                <Grid container spacing={1}>
                  {vendor.photos.slice(0, 8).map((src, i) => (
                    <Grid item xs={6} md={3} key={i}>
                      <Box sx={{ pt: '56.25%', backgroundColor: '#f5f5f5', backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">No photos yet.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>About</Typography>
              <Typography variant="body1" color="text.secondary">{vendor.description || vendor.shortDescription || 'This vendor has not added a description yet.'}</Typography>
              {vendor.tags && vendor.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                  {vendor.tags.map((t, i) => (<Chip key={i} label={t} size="small" variant="outlined" />))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Contact</Typography>
              {!sent ? (
                <Box sx={{ display: 'grid', gap: 1.5, mb: 2 }}>
                  <TextField required label="Your Name" size="small" value={inq.name} onChange={(e)=>setInq({...inq, name: e.target.value})} />
                  <TextField required label="Email" size="small" value={inq.email} onChange={(e)=>setInq({...inq, email: e.target.value})} />
                  <TextField label="Phone" size="small" value={inq.phone} onChange={(e)=>setInq({...inq, phone: e.target.value})} />
                  <TextField label="Event Date" type="date" size="small" InputLabelProps={{ shrink: true }} value={inq.eventDate} onChange={(e)=>setInq({...inq, eventDate: e.target.value})} />
                  <TextField label="Estimated Budget" type="number" size="small" value={inq.budget} onChange={(e)=>setInq({...inq, budget: e.target.value})} />
                  <TextField required label="Message" multiline minRows={3} size="small" value={inq.message} onChange={(e)=>setInq({...inq, message: e.target.value})} />
                  <Button disabled={sending || !inq.name.trim() || !inq.email.trim() || !inq.message.trim()} variant="contained" onClick={async ()=>{
                    try {
                      setSending(true)
                      const res = await fetch(`/api/public/vendors/${vendor.id}/inquire`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...inq, budget: inq.budget ? Number(inq.budget) : undefined }) })
                      if (res.ok) setSent(true)
                    } finally { setSending(false) }
                  }}>Request Quote</Button>
                </Box>
              ) : (
                <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>Thanks! Your request has been sent.</Typography>
              )}
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {vendor.website && (
                  <Button component={Link} href={vendor.website} target="_blank" rel="noopener" variant="outlined" startIcon={<OpenInNewIcon />}>Visit Website</Button>
                )}
                {vendor.email && (
                  <Button component={Link} href={`mailto:${vendor.email}`} variant="outlined" startIcon={<EmailIcon />}>Email</Button>
                )}
                {vendor.phone && (
                  <Button component={Link} href={`tel:${vendor.phone}`} variant="outlined" startIcon={<PhoneIcon />}>Call</Button>
                )}
              </Box>
              {(vendor.address || vendor.city || vendor.region) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {vendor.address ? `${vendor.address}` : ''}{(vendor.address && (vendor.city || vendor.region)) ? ', ' : ''}
                    {vendor.city || ''}{vendor.city && vendor.region ? ', ' : ''}{vendor.region || ''}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity || 'success'} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
