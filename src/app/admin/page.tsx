"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Grid, Card, CardContent, Typography, Chip, CircularProgress, Button } from '@mui/material'
import AdminToolbar from '@/components/admin/AdminToolbar'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'

export default function AdminOverviewPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<{ users: number; vendors: number; directoryVendors: number; regions: Array<{ region: string|null; _count: { _all: number } }> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string| null>(null)

  useEffect(() => {
    async function load() {
      try {
        const token = AuthClient.getToken()
        const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch('/api/admin/overview', { headers })
        if (!res.ok) {
          const j = await res.json().catch(()=>({}))
          throw new Error(j?.error?.message || 'Unauthorized')
        }
        const j = await res.json()
        setData(j?.data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    if (!isLoading && user) load()
  }, [user, isLoading])

  if (isLoading || loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Admin</Typography>
        <Typography variant="body2" color="error.main">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Bodoni Moda", serif' }}>Super Admin</Typography>
        <Chip label="Preview" size="small" />
        <Box sx={{ flex: 1 }} />
        <Button onClick={()=>router.push('/dashboard')}>Back to Dashboard</Button>
      </Box>
      <AdminToolbar />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="overline">Users</Typography>
            <Typography variant="h4">{data?.users ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="overline">Private Vendors</Typography>
            <Typography variant="h4">{data?.vendors ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="overline">Directory Vendors</Typography>
            <Typography variant="h4">{data?.directoryVendors ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12}>
          <Card><CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Regions</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(data?.regions || []).map((r, i) => (
                <Chip key={i} label={`${r.region || 'N/A'} • ${r._count?._all ?? 0}`} />
              ))}
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  )
}
