"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'
import { Box, Typography, Grid, Card, CardContent, TextField, Button, List, ListItem, ListItemText } from '@mui/material'

export default function VendorPortalPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', category: '', city: '', region: '', priceBand: '', shortDescription: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (!isLoading && !user) router.push('/signin') }, [isLoading, user, router])

  async function load() {
    const token = AuthClient.getToken()
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
    const res = await fetch('/api/vendor-portal/vendors', { headers })
    const json = await res.json()
    setList(json?.data?.vendors || [])
  }

  useEffect(() => { if (!isLoading && user) load() }, [isLoading, user])

  async function create() {
    const token = AuthClient.getToken()
    const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    setSaving(true)
    try {
      const res = await fetch('/api/vendor-portal/vendors', { method: 'POST', headers, body: JSON.stringify(form) })
      if (res.ok) { setForm({ name: '', category: '', city: '', region: '', priceBand: '', shortDescription: '' }); await load() }
    } finally { setSaving(false) }
  }

  if (isLoading) return null

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Vendor Portal</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Your Directory Vendors</Typography>
                {list.length > 0 ? (
                  <List dense>
                    {list.map(v => (
                      <ListItem key={v.id} secondaryAction={<Button size="small" onClick={()=>router.push(`/vendors/${v.id}`)}>View</Button>}>
                        <ListItemText primary={`${v.name} (${v.category})`} secondary={[v.city, v.region].filter(Boolean).join(', ')} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">No vendors yet.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Create New Vendor</Typography>
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  <TextField label="Name" size="small" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
                  <TextField label="Category" size="small" value={form.category} onChange={(e)=>setForm({...form, category: e.target.value})} />
                  <TextField label="City" size="small" value={form.city} onChange={(e)=>setForm({...form, city: e.target.value})} />
                  <TextField label="Region" size="small" value={form.region} onChange={(e)=>setForm({...form, region: e.target.value})} />
                  <TextField label="Price Band ($, $$, $$$)" size="small" value={form.priceBand} onChange={(e)=>setForm({...form, priceBand: e.target.value})} />
                  <TextField label="Short Description" size="small" multiline minRows={2} value={form.shortDescription} onChange={(e)=>setForm({...form, shortDescription: e.target.value})} />
                  <Button variant="contained" disabled={saving || !form.name.trim() || !form.category.trim()} onClick={create}>Create</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  )
}
