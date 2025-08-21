"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'
import { SeatingClient } from '@/lib/api/seating.client'
import { GuestsClient } from '@/lib/api/guests.client'
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, IconButton, Checkbox,
  List, ListItem, ListItemText, Divider
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext'

type Guest = { id: string; name: string; side?: 'bride'|'groom'; rsvpStatus: 'pending'|'accepted'|'declined'; mealPreference?: string; invitationSent: boolean; relationshipCategory?: string }
type Table = { id: string; name: string; capacity: number; guestIds: string[] }

export default function SeatingPlannerPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { themeMode } = useCustomTheme()
  const [guests, setGuests] = useState<Guest[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([])
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [relFilter, setRelFilter] = useState<string>('')
  const [groupByRelationship, setGroupByRelationship] = useState<boolean>(false)
  const [newTable, setNewTable] = useState({ name: '', capacity: 8 })

  useEffect(() => {
    if (!isLoading && !user) router.push('/signin')
  }, [isLoading, user, router])

  const headers = useMemo(() => {
    // Retained only for guests API call; Seating calls use SeatingClient
    const token = AuthClient.getToken()
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
  }, [])

  async function loadData() {
    try {
      const [{ guests }, tables] = await Promise.all([
        GuestsClient.listGuests({ limit: 1000 }),
        SeatingClient.listTables()
      ])
      setGuests(guests || [])
      setTables(tables)
    } catch (e) {
      console.error('Failed loading seating data', e)
    } finally { setLoading(false) }
  }

  useEffect(() => { if (!isLoading && user) loadData() }, [isLoading, user])

  const unassignedGuests = useMemo(() => {
    const assigned = new Set<string>(tables.flatMap(t => t.guestIds))
    let list = guests.filter(g => !assigned.has(g.id))
    if (relFilter) list = list.filter(g => (g as any).relationshipCategory === relFilter)
    return list
  }, [guests, tables, relFilter])

  const tableGuest = (id: string) => guests.find(g => g.id === id)

  async function createTable() {
    try {
      await SeatingClient.createTable(newTable.name || 'Table', newTable.capacity)
      setNewTable({ name: '', capacity: 8 })
      await loadData()
    } catch (e) { console.error('Create table failed', e) }
  }

  async function updateTable(id: string, data: Partial<{ name: string; capacity: number }>) {
    try {
      await SeatingClient.updateTable(id, data)
      await loadData()
    } catch (e) { console.error('Update table failed', e) }
  }

  async function deleteTable(id: string) {
    try {
      await SeatingClient.deleteTable(id)
      await loadData()
    } catch (e) { console.error('Delete table failed', e) }
  }

  async function assignSelected() {
    if (!selectedTableId || selectedGuestIds.length === 0) return
    try {
      await SeatingClient.assignGuests(selectedTableId, selectedGuestIds)
      setSelectedGuestIds([])
      await loadData()
    } catch (e) { console.error('Assign guests failed', e) }
  }

  async function unassign(guestId: string) {
    try {
      await SeatingClient.unassignGuest(guestId)
      await loadData()
    } catch (e) { console.error('Unassign guest failed', e) }
  }

  async function autoAssign() {
    try {
      await SeatingClient.autoAssign(groupByRelationship)
      await loadData()
    } catch (e) { console.error('Auto-assign failed', e) }
  }

  if (isLoading || loading) {
    const LoadingLayout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout
    return (
      <LoadingLayout>
        <Box sx={{ p: 3 }}>
          <Typography>Loading...</Typography>
        </Box>
      </LoadingLayout>
    )
  }

  const Layout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>Seating Planner</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              select size="small" label="Relationship filter" slotProps={{ select: { native: true } }}
              value={relFilter} onChange={e => setRelFilter(e.target.value)} sx={{ minWidth: 180 }}
            >
              <option value="">All</option>
              <option value="sibling">Sibling</option>
              <option value="parent">Parent</option>
              <option value="relative">Relative</option>
              <option value="friend">Friend</option>
              <option value="neighbour">Neighbour</option>
              <option value="colleague">Colleague</option>
              <option value="vendor">Vendor</option>
              <option value="other">Other</option>
            </TextField>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox checked={groupByRelationship} onChange={e => setGroupByRelationship(e.target.checked)} />
              <Typography variant="body2">Group by relationship (optional)</Typography>
            </Box>
            <Button variant="outlined" onClick={autoAssign}>Auto-assign</Button>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Unassigned Guests ({unassignedGuests.length})</Typography>
                <TextField select size="small" label="Assign to table" slotProps={{ select: { native: true } }} value={selectedTableId} onChange={e => setSelectedTableId(e.target.value)} sx={{ mb: 1, minWidth: 220 }}>
                  <option value="">Select table</option>
                  {tables.map(t => (<option key={t.id} value={t.id}>{t.name} ({t.guestIds.length}/{t.capacity})</option>))}
                </TextField>
                <List dense sx={{ maxHeight: 360, overflow: 'auto', border: '1px solid #eee' }}>
                  {unassignedGuests.map(g => (
                    <ListItem key={g.id} sx={{ py: 0 }}>
                      <Checkbox checked={selectedGuestIds.includes(g.id)} onChange={e => setSelectedGuestIds(prev => e.target.checked ? [...prev, g.id] : prev.filter(id => id !== g.id))} />
                      <ListItemText primary={g.name} secondary={(g as any).relationshipCategory ? `Relationship: ${(g as any).relationshipCategory}` : undefined} />
                    </ListItem>
                  ))}
                </List>
                <Button variant="contained" sx={{ mt: 1 }} disabled={!selectedTableId || selectedGuestIds.length === 0} onClick={assignSelected}>Assign selected</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TextField size="small" label="Table name" value={newTable.name} onChange={e => setNewTable({ ...newTable, name: e.target.value })} />
                  <TextField size="small" type="number" label="Capacity" value={newTable.capacity} onChange={e => setNewTable({ ...newTable, capacity: Number(e.target.value || 0) })} sx={{ width: 120 }} />
                  <Button startIcon={<AddIcon />} variant="outlined" onClick={createTable}>Add table</Button>
                </Box>
                <Grid container spacing={2}>
                  {tables.map(t => (
                    <Grid size={{ xs: 12, md: 6 }} key={t.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <TextField size="small" value={t.name} onChange={e => updateTable(t.id, { name: e.target.value })} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TextField size="small" type="number" label="Cap" value={t.capacity} onChange={e => updateTable(t.id, { capacity: Number(e.target.value || 0) })} sx={{ width: 90 }} />
                              <IconButton onClick={() => deleteTable(t.id)}><DeleteIcon /></IconButton>
                            </Box>
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          <List dense sx={{ maxHeight: 220, overflow: 'auto' }}>
                            {t.guestIds.map(id => {
                              const g = tableGuest(id)
                              return (
                                <ListItem key={id} secondaryAction={<Button size="small" onClick={() => unassign(id)}>Unassign</Button>}>
                                  <ListItemText primary={g ? g.name : id} secondary={(g as any)?.relationshipCategory ? `Relationship: ${(g as any).relationshipCategory}` : undefined} />
                                </ListItem>
                              )
                            })}
                            {t.guestIds.length === 0 && (
                              <ListItem><ListItemText primary="No guests at this table yet" /></ListItem>
                            )}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  )
}
