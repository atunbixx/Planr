"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Typography, TextField, MenuItem, Button, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Pagination, Chip, CircularProgress, Snackbar, Alert } from '@mui/material'
import AdminToolbar from '@/components/admin/AdminToolbar'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'

type DirVendor = { id: string; name: string; category: string; region?: string|null; website?: string|null; email?: string|null; phone?: string|null; isSuspended?: boolean; fraudFlags?: string[]; updatedAt: string }

export default function AdminDirectoryVendorsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [rows, setRows] = useState<DirVendor[]>([])
  const [q, setQ] = useState('')
  const [flag, setFlag] = useState('')
  const [isSuspended, setIsSuspended] = useState('')
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
      if (q.trim()) p.set('q', q.trim())
      if (flag) p.set('flag', flag)
      if (isSuspended) p.set('isSuspended', isSuspended)
      const res = await fetch(`/api/admin/directory/vendors?${p.toString()}`, { headers })
      if (!res.ok) throw new Error('Unauthorized')
      const j = await res.json()
      setRows(j?.data?.vendors || [])
      setTotal(j?.data?.total || 0)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (!isLoading && user) load() }, [user, isLoading, page])

  async function updateRow(id: string, patch: any) {
    try {
      const token = AuthClient.getToken()
      const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      const res = await fetch(`/api/admin/directory/vendors/${id}`, { method: 'PATCH', headers, body: JSON.stringify(patch) })
      if (!res.ok) throw new Error('Update failed')
      setSnack({ open: true, message: 'Updated', severity: 'success' })
      await load()
    } catch {
      setSnack({ open: true, message: 'Update failed', severity: 'error' })
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Bodoni Moda", serif' }}>Directory Vendors</Typography>
        <Box sx={{ flex: 1 }} />
        <Button onClick={()=>router.push('/admin')}>Overview</Button>
      </Box>
      <AdminToolbar />
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search name, website, email, phone" value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter'){ setPage(1); load() } }} />
        <TextField size="small" select label="Flag" value={flag} onChange={(e)=>{ setFlag(e.target.value); setPage(1); load() }} sx={{ minWidth: 180 }}>
          <MenuItem value="">All</MenuItem>
          {['similar_name'].map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
        </TextField>
        <TextField size="small" select label="Suspended" value={isSuspended} onChange={(e)=>{ setIsSuspended(e.target.value); setPage(1); load() }} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="true">Yes</MenuItem>
          <MenuItem value="false">No</MenuItem>
        </TextField>
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
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell>Website</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Flags</TableCell>
                  <TableCell>Suspended</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id} hover onClick={()=>router.push(`/admin/directory/vendors/${r.id}`)} sx={{ cursor: 'pointer' }}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.category}</TableCell>
                    <TableCell>{r.region || ''}</TableCell>
                    <TableCell>{r.website || ''}</TableCell>
                    <TableCell>{r.email || ''}</TableCell>
                    <TableCell>{r.phone || ''}</TableCell>
                    <TableCell>{(r.fraudFlags||[]).map((f,i)=>(<Chip key={i} size="small" label={f} sx={{ mr: 0.5 }} />))}</TableCell>
                    <TableCell>{r.isSuspended ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{new Date(r.updatedAt).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={()=>updateRow(r.id, { isSuspended: !r.isSuspended })}>{r.isSuspended ? 'Unsuspend' : 'Suspend'}</Button>
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
