"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'
import { Box, Typography, Grid, Card, CardContent, TextField, Button, List, ListItem, ListItemText, Divider } from '@mui/material'

export default function VendorPortalPage() {
  const { user, isLoading } = useAuth()
  const { themeMode } = useCustomTheme()
  const router = useRouter()
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', category: '', city: '', region: '', priceBand: '', shortDescription: '' })
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ name: '', category: '', city: '', region: '', priceBand: '', shortDescription: '', tags: '' })

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

  async function update() {
    if (!editing) return
    const token = AuthClient.getToken()
    const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    setSaving(true)
    try {
      const payload: any = { ...editForm }
      if (payload.tags) payload.tags = payload.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      const res = await fetch(`/api/vendor-portal/vendors/${editing.id}`, { method: 'PUT', headers, body: JSON.stringify(payload) })
      if (res.ok) { await load(); setEditing(null) }
    } finally { setSaving(false) }
  }

  if (isLoading) return null

  const Layout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Vendor Portal</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Your Directory Vendors</Typography>
                {list.length > 0 ? (
                  <List dense>
                    {list.map(v => (
                      <ListItem key={v.id} onClick={()=>{ setEditing(v); setEditForm({ name: v.name||'', category: v.category||'', city: v.city||'', region: v.region||'', priceBand: v.priceBand||'', shortDescription: v.shortDescription||'', tags: Array.isArray(v.tags)? v.tags.join(', ') : '' }) }} sx={{ cursor: 'pointer' }} secondaryAction={<Button size="small" onClick={()=>router.push(`/vendors/${v.id}`)}>View</Button>}>
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
          <Grid size={{ xs: 12, md: 6 }}>
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

          {editing && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Edit Vendor</Typography>
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    <TextField label="Name" size="small" value={editForm.name} onChange={(e)=>setEditForm({...editForm, name: e.target.value})} />
                    <TextField label="Category" size="small" value={editForm.category} onChange={(e)=>setEditForm({...editForm, category: e.target.value})} />
                    <TextField label="City" size="small" value={editForm.city} onChange={(e)=>setEditForm({...editForm, city: e.target.value})} />
                    <TextField label="Region" size="small" value={editForm.region} onChange={(e)=>setEditForm({...editForm, region: e.target.value})} />
                    <TextField label="Price Band ($, $$, $$$)" size="small" value={editForm.priceBand} onChange={(e)=>setEditForm({...editForm, priceBand: e.target.value})} />
                    <TextField label="Short Description" size="small" multiline minRows={2} value={editForm.shortDescription} onChange={(e)=>setEditForm({...editForm, shortDescription: e.target.value})} />
                    <TextField label="Tags (comma-separated)" size="small" value={editForm.tags} onChange={(e)=>setEditForm({...editForm, tags: e.target.value})} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" disabled={saving} onClick={update}>Save Changes</Button>
                      <Button onClick={()=>setEditing(null)}>Cancel</Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </Layout>
  )
}
