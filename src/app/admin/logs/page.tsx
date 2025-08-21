"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Typography, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Pagination, CircularProgress, Dialog, DialogTitle, DialogContent } from '@mui/material'
import AdminToolbar from '@/components/admin/AdminToolbar'
import AuthClient from '@/lib/auth/client'

type Log = { id: string; adminUserId: string; adminEmail?: string|null; action: string; targetType: string; targetId: string; details?: any; ip?: string; ua?: string; createdAt: string }

export default function AdminAuditLogsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Log[]>([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<Log | null>(null)

  async function load() {
    setLoading(true)
    try {
      const token = AuthClient.getToken()
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
      const p = new URLSearchParams()
      p.set('page', String(page))
      p.set('pageSize', String(pageSize))
      if (q.trim()) p.set('q', q.trim())
      const res = await fetch(`/api/admin/audit-logs?${p.toString()}`, { headers })
      if (!res.ok) throw new Error('Unauthorized')
      const j = await res.json()
      setRows(j?.data?.logs || [])
      setTotal(j?.data?.total || 0)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Bodoni Moda", serif' }}>Audit Logs</Typography>
        <Box sx={{ flex: 1 }} />
        <Button onClick={()=>router.push('/admin')}>Overview</Button>
      </Box>
      <AdminToolbar />
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField size="small" placeholder="Search action/target" value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter'){ setPage(1); load() } }} />
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
                  <TableCell>Time</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>IP</TableCell>
                  <TableCell>User-Agent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id} hover onClick={()=>{ setActive(r); setOpen(true) }} sx={{ cursor: 'pointer' }}>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{r.action}</TableCell>
                    <TableCell>{r.targetType}:{r.targetId}</TableCell>
                    <TableCell>{r.adminEmail || r.adminUserId}</TableCell>
                    <TableCell>{r.ip || ''}</TableCell>
                    <TableCell sx={{ maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.ua || ''}</TableCell>
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
      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent>
          {active && (
            <Box component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>
              {JSON.stringify({
                id: active.id,
                createdAt: active.createdAt,
                action: active.action,
                target: `${active.targetType}:${active.targetId}`,
                admin: active.adminEmail || active.adminUserId,
                ip: active.ip,
                ua: active.ua,
                details: active.details,
              }, null, 2)}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}
