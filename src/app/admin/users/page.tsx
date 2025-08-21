"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Typography, TextField, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Pagination, CircularProgress, Button } from '@mui/material'
import AdminToolbar from '@/components/admin/AdminToolbar'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'

type User = { id: string; email: string; role: string; onboardingCompleted: boolean; createdAt: string }

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [rows, setRows] = useState<User[]>([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const token = AuthClient.getToken()
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
      const p = new URLSearchParams()
      p.set('page', String(page))
      p.set('pageSize', String(pageSize))
      if (q.trim()) p.set('q', q.trim())
      const res = await fetch(`/api/admin/users?${p.toString()}`, { headers })
      if (!res.ok) throw new Error('Unauthorized')
      const j = await res.json()
      setRows(j?.data?.users || [])
      setTotal(j?.data?.total || 0)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (!isLoading && user) load() }, [user, isLoading, page])

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Bodoni Moda", serif' }}>Users</Typography>
        <Box sx={{ flex: 1 }} />
        <Button onClick={()=>router.push('/admin')}>Overview</Button>
      </Box>
      <AdminToolbar />
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField size="small" placeholder="Search email" value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter'){ setPage(1); load() } }} />
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
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Onboarded</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.role}</TableCell>
                    <TableCell>{r.onboardingCompleted ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
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
    </Box>
  )
}
