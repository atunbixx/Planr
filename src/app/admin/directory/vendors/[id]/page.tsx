"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Box, Grid, Card, CardContent, Typography, Chip, Button, CircularProgress, TextField, Snackbar, Alert } from '@mui/material'
import AdminToolbar from '@/components/admin/AdminToolbar'
import AuthClient from '@/lib/auth/client'

export default function AdminDirectoryVendorDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity?: 'success'|'error' }>({ open: false, message: '', severity: 'success' })
  const [dupOf, setDupOf] = useState('')

  async function load() {
    setLoading(true)
    try {
      const token = AuthClient.getToken()
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`/api/admin/directory/vendors/${params.id}`, { headers })
      if (!res.ok) throw new Error('Unauthorized')
      const j = await res.json()
      setData(j?.data)
    } catch (e:any) {
      setError(e?.message || 'Failed to load')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (params?.id) load() }, [params?.id])

  async function patch(body: any) {
    try {
      const token = AuthClient.getToken()
      const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      const res = await fetch(`/api/admin/directory/vendors/${params.id}`, { method: 'PATCH', headers, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Update failed')
      setSnack({ open: true, message: 'Updated', severity: 'success' })
      await load()
    } catch {
      setSnack({ open: true, message: 'Update failed', severity: 'error' })
    }
  }

  if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
  if (error || !data) return <Box sx={{ p: 4 }}><Typography color="error">{error || 'Not found'}</Typography></Box>

  const v = data.vendor
  const owner = data.owner
  const inquiries = data.inquiries || []
  const similar = data.similar || []
  const candidates = data.candidates || []

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Bodoni Moda", serif' }}>Vendor Detail</Typography>
        <Chip label={v.category} size="small" />
        {v.isSuspended ? <Chip label="Suspended" size="small" color="warning" /> : null}
        <Box sx={{ flex: 1 }} />
        <Button onClick={()=>router.push('/admin/directory/vendors')}>Back</Button>
      </Box>
      <AdminToolbar />
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card><CardContent>
            <Typography variant="h5" sx={{ mb: 1 }}>{v.name}</Typography>
            <Typography variant="body2" color="text.secondary">{[v.city, v.region].filter(Boolean).join(', ')}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {v.website && <Chip label={v.website} size="small" />}
              {v.email && <Chip label={v.email} size="small" />}
              {v.phone && <Chip label={v.phone} size="small" />}
              {(v.fraudFlags || []).map((f:string, i:number)=>(<Chip key={i} label={f} size="small" color="warning" />))}
            </Box>
          </CardContent></Card>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button variant="outlined" onClick={()=>patch({ isSuspended: !v.isSuspended })}>{v.isSuspended ? 'Unsuspend' : 'Suspend'}</Button>
            {(v.fraudFlags||[]).length > 0 && <Button variant="outlined" onClick={()=>patch({ resolveFlags: true })}>Resolve Flags</Button>}
          </Box>
          <Card sx={{ mt: 2 }}><CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Recent Inquiries</Typography>
            {inquiries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No inquiries.</Typography>
            ) : (
              <Box sx={{ display: 'grid', gap: 1 }}>
                {inquiries.map((q:any) => (
                  <Box key={q.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{q.name} &lt;{q.email}&gt;</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(q.createdAt).toLocaleString()}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="overline">Owner</Typography>
            <Typography variant="body1">{owner?.email || 'Unclaimed'}</Typography>
          </CardContent></Card>
          <Card sx={{ mt: 2 }}><CardContent>
            <Typography variant="overline">Duplicate Handling</Typography>
            <TextField fullWidth size="small" label="Mark duplicate of Vendor ID" value={dupOf} onChange={(e)=>setDupOf(e.target.value)} sx={{ mt: 1 }} />
            <Button size="small" variant="outlined" sx={{ mt: 1 }} disabled={!dupOf.trim()} onClick={()=>patch({ duplicateOfId: dupOf.trim() })}>Mark Duplicate</Button>
          </CardContent></Card>
          <Card sx={{ mt: 2 }}><CardContent>
            <Typography variant="overline">Similar by Name</Typography>
            {(similar||[]).length === 0 ? (
              <Typography variant="body2" color="text.secondary">None</Typography>
            ) : (
              <Box sx={{ display: 'grid', gap: 0.5 }}>
                {similar.map((s:any)=> (
                  <Button key={s.id} size="small" onClick={()=>router.push(`/admin/directory/vendors/${s.id}`)}>{s.name} ({Math.round((s.similarity||0)*100)}%)</Button>
                ))}
              </Box>
            )}
          </CardContent></Card>
          <Card sx={{ mt: 2 }}><CardContent>
            <Typography variant="overline">Candidates (same contact)</Typography>
            {(candidates||[]).length === 0 ? (
              <Typography variant="body2" color="text.secondary">None</Typography>
            ) : (
              <Box sx={{ display: 'grid', gap: 0.5 }}>
                {candidates.map((c:any)=> (
                  <Button key={c.id} size="small" onClick={()=>router.push(`/admin/directory/vendors/${c.id}`)}>{c.name}</Button>
                ))}
              </Box>
            )}
          </CardContent></Card>
        </Grid>
      </Grid>
      <Snackbar open={snack.open} autoHideDuration={2500} onClose={()=>setSnack(s=>({ ...s, open: false }))}>
        <Alert severity={snack.severity || 'success'} onClose={()=>setSnack(s=>({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  )
}

