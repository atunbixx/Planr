"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Box, Typography, Card, CardContent, Grid, Chip, CircularProgress, Button, Snackbar, Alert, TextField, MenuItem } from '@mui/material'
import AdminToolbar from '@/components/admin/AdminToolbar'
import AuthClient from '@/lib/auth/client'

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity?: 'success'|'error' }>({ open: false, message: '', severity: 'success' })
  const [role, setRole] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const token = AuthClient.getToken()
        const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch(`/api/admin/users/${params.id}`, { headers })
        if (!res.ok) throw new Error('Unauthorized')
        const j = await res.json()
        setData(j?.data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally { setLoading(false) }
    }
    if (params?.id) load()
  }, [params?.id])

  if (loading) {
    return <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>
  }
  if (error || !data) {
    return <Box sx={{ p: 4 }}><Typography color="error">{error || 'Not found'}</Typography></Box>
  }

  const u = data.user
  const currentRole = (u?.role || '')
  const s = data.stats || {}

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Bodoni Moda", serif' }}>User Detail</Typography>
        <Chip label={u.role} size="small" />
        {u.onboardingCompleted ? <Chip label="Onboarded" size="small" color="success" /> : <Chip label="Not Onboarded" size="small" />}
        <Box sx={{ flex: 1 }} />
        <Button onClick={()=>router.push('/admin/users')}>Back to Users</Button>
      </Box>
      <AdminToolbar />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="overline">Email</Typography>
              <Typography variant="h6">{u.email}</Typography>
              <Typography variant="overline" sx={{ display: 'block', mt: 2 }}>Created</Typography>
              <Typography>{new Date(u.createdAt).toLocaleString()}</Typography>
              <Typography variant="overline" sx={{ display: 'block', mt: 2 }}>Updated</Typography>
              <Typography>{new Date(u.updatedAt).toLocaleString()}</Typography>
              <Typography variant="overline" sx={{ display: 'block', mt: 2 }}>Role</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField size="small" select value={role || currentRole} onChange={(e)=>setRole(e.target.value)} sx={{ minWidth: 160 }}>
                  {['couple','planner','vendor'].map(r => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </TextField>
                <Button size="small" variant="outlined" disabled={!role || role === currentRole} onClick={async ()=>{
                  try {
                    const token = AuthClient.getToken()
                    const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', headers, body: JSON.stringify({ role }) })
                    if (!res.ok) throw new Error('Update failed')
                    setSnack({ open: true, message: 'Role updated', severity: 'success' })
                    // Reload details
                    const j = await fetch(`/api/admin/users/${u.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r=>r.json())
                    setData(j?.data)
                    setRole('')
                  } catch {
                    setSnack({ open: true, message: 'Update failed', severity: 'error' })
                  }
                }}>Save</Button>
              </Box>
              <Typography variant="overline" sx={{ display: 'block', mt: 2 }}>Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={(u as any).isActive === false ? 'Deactivated' : 'Active'} size="small" color={(u as any).isActive === false ? 'warning' : 'success'} />
                <Button size="small" variant="outlined" onClick={async ()=>{
                  try {
                    const token = AuthClient.getToken()
                    const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', headers, body: JSON.stringify({ isActive: !((u as any).isActive !== false) }) })
                    if (!res.ok) throw new Error('Update failed')
                    setSnack({ open: true, message: 'Status updated', severity: 'success' })
                    // Reload details
                    const j = await fetch(`/api/admin/users/${u.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r=>r.json())
                    setData(j?.data)
                  } catch {
                    setSnack({ open: true, message: 'Update failed', severity: 'error' })
                  }
                }}>{(u as any).isActive === false ? 'Reactivate' : 'Deactivate'}</Button>
                <Button size="small" onClick={async ()=>{
                  try {
                    const token = AuthClient.getToken()
                    const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                    const res = await fetch(`/api/admin/users/${u.id}/impersonate`, { method: 'POST', headers })
                    const j = await res.json()
                    if (!res.ok || !j?.success) throw new Error(j?.error?.message || 'Failed')
                    // Warning: this will replace current token.
                    AuthClient.backupCurrentSession()
                    AuthClient.setToken(j.data.token)
                    AuthClient.setUser(j.data.user)
                    setSnack({ open: true, message: 'Impersonating… redirecting', severity: 'success' })
                    setTimeout(()=>{ window.location.href = '/dashboard' }, 600)
                  } catch (e:any) {
                    setSnack({ open: true, message: e?.message || 'Impersonation failed', severity: 'error' })
                  }
                }}>Impersonate</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="overline">Stats</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Private Vendors</Typography>
                  <Typography variant="h6">{s.vendors ?? 0}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Directory Vendors</Typography>
                  <Typography variant="h6">{s.directoryVendors ?? 0}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Guests</Typography>
                  <Typography variant="h6">{s.guests ?? 0}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Budgets</Typography>
                  <Typography variant="h6">{s.budgets ?? 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Snackbar open={snack.open} autoHideDuration={2500} onClose={()=>setSnack(s=>({ ...s, open: false }))}>
        <Alert severity={snack.severity || 'success'} onClose={()=>setSnack(s=>({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  )
}
