"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Typography, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Pagination, Chip, CircularProgress, Snackbar, Alert } from '@mui/material'
import AdminToolbar from '@/components/admin/AdminToolbar'
import AuthClient from '@/lib/auth/client'

type Session = { id: string; userId: string; userEmail?: string|null; region?: string|null; country?: string|null; city?: string|null; ipHash?: string|null; uaHash?: string|null; createdAt: string; lastActiveAt: string; revokedAt?: string|null }

export default function AdminSessionsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Session[]>([])
  const [userId, setUserId] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity?: 'success'|'error' }>({ open: false, message: '', severity: 'success' })

  async function load() {
    setLoading(true)
    try {
      const token = AuthClient.getToken()
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
      const p = new URLSearchParams()
      p.set('page', String(page))
      p.set('pageSize', String(pageSize))
      if (userId.trim()) p.set('userId', userId.trim())
      if (activeOnly) p.set('activeOnly', 'true')
      const res = await fetch(`/api/admin/sessions?${p.toString()}`, { headers })
      if (!res.ok) throw new Error('Unauthorized')
      const j = await res.json()
      setRows(j?.data?.sessions || [])
      setTotal(j?.data?.total || 0)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  async function revoke(id: string) {
    try {
      const token = AuthClient.getToken()
      const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      const res = await fetch(`/api/admin/sessions/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ revoke: true }) })
      if (!res.ok) throw new Error('Failed')
      setSnack({ open: true, message: 'Session revoked', severity: 'success' })
      await load()
    } catch {
      setSnack({ open: true, message: 'Failed to revoke', severity: 'error' })
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Bodoni Moda", serif' }}>Sessions</Typography>
        <Box sx={{ flex: 1 }} />
        <Button onClick={()=>router.push('/admin')}>Overview</Button>
      </Box>
      <AdminToolbar />
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Filter by userId" value={userId} onChange={(e)=>{ setUserId(e.target.value) }} />
        <Button variant={activeOnly ? 'contained' : 'outlined'} onClick={()=>{ setActiveOnly(!activeOnly); setPage(1); load() }}>{activeOnly ? 'Active Only' : 'All'}</Button>
        <Button variant="outlined" onClick={()=>{ setPage(1); load() }}>Search</Button>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell>Geo</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.userId.slice(0,8)}…</TableCell>
                    <TableCell>{r.userEmail || ''}</TableCell>
                    <TableCell>{r.region || ''}</TableCell>
                    <TableCell>{[r.city, r.country].filter(Boolean).join(', ')}</TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{new Date(r.lastActiveAt).toLocaleString()}</TableCell>
                    <TableCell>{r.revokedAt ? 'Revoked' : 'Active'}</TableCell>
                    <TableCell align="right">
                      <Button size="small" disabled={Boolean(r.revokedAt)} onClick={()=>revoke(r.id)}>Revoke</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {total > pageSize && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Pagination page={page} count={Math.ceil(total/pageSize)} onChange={(e,p)=>setPage(p)} />
            </Box>
          )}
        </>
      )}
      <Snackbar open={snack.open} autoHideDuration={2500} onClose={()=>setSnack(s=>({ ...s, open: false }))}>
        <Alert severity={snack.severity || 'success'} onClose={()=>setSnack(s=>({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  )
}
