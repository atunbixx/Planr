"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Grid, Card, CardContent, Typography, Chip, CircularProgress, Button } from '@mui/material'
import AuthClient from '@/lib/auth/client'
import AdminToolbar from '@/components/admin/AdminToolbar'

type Data = { newVendors7: number; newVendors30: number; flagged: number; suspended: number; inquiries7: number; inquiries30: number }

export default function AdminVendorPanelPage() {
  const router = useRouter()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const token = AuthClient.getToken()
        const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch('/api/admin/vendor-panel/overview', { headers })
        if (!res.ok) throw new Error('Unauthorized')
        const j = await res.json()
        setData(j?.data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
  if (error) return <Box sx={{ p: 4 }}><Typography color="error">{error}</Typography></Box>

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Bodoni Moda", serif' }}>Vendor Panel</Typography>
        <Chip label="Beta" size="small" />
        <Box sx={{ flex: 1 }} />
        <Button onClick={()=>router.push('/admin')}>Overview</Button>
      </Box>
      <AdminToolbar />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Card><CardContent>
            <Typography variant="overline">New Vendors (7d)</Typography>
            <Typography variant="h4">{data?.newVendors7 ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card><CardContent>
            <Typography variant="overline">New Vendors (30d)</Typography>
            <Typography variant="h4">{data?.newVendors30 ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card><CardContent>
            <Typography variant="overline">Flagged Vendors</Typography>
            <Typography variant="h4">{data?.flagged ?? 0}</Typography>
            <Button size="small" sx={{ mt: 1 }} onClick={()=>router.push('/admin/directory/vendors')}>Review</Button>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card><CardContent>
            <Typography variant="overline">Suspended Vendors</Typography>
            <Typography variant="h4">{data?.suspended ?? 0}</Typography>
            <Button size="small" sx={{ mt: 1 }} onClick={()=>router.push('/admin/directory/vendors?isSuspended=true')}>Manage</Button>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card><CardContent>
            <Typography variant="overline">Inquiries (7d)</Typography>
            <Typography variant="h4">{data?.inquiries7 ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card><CardContent>
            <Typography variant="overline">Inquiries (30d)</Typography>
            <Typography variant="h4">{data?.inquiries30 ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  )
}
