'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'
import { GuestsClient } from '@/lib/api/guests.client'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Checkbox,
  CircularProgress,
} from '@mui/material'
import Pagination from '@mui/material/Pagination'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GuestsIcon,
  CheckCircle as AcceptedIcon,
  HourglassEmpty as PendingIcon,
  Cancel as DeclinedIcon,
  ArrowBack as BackIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Snackbar from '@mui/material/Snackbar'

interface Guest {
  id: string
  name: string
  rsvpStatus: 'pending' | 'accepted' | 'declined'
  mealPreference?: string
  side?: 'bride' | 'groom'
  invitationSent: boolean
  plusOneAllowed?: boolean
  plusOneName?: string | null
  householdId?: string | null
  tags?: string[]
}

const rsvpStatuses = [
  { id: 'all', name: 'All', icon: <PendingIcon fontSize="small" /> },
  { id: 'pending', name: 'Pending', icon: <PendingIcon fontSize="small" /> },
  { id: 'accepted', name: 'Accepted', icon: <AcceptedIcon fontSize="small" /> },
  { id: 'declined', name: 'Declined', icon: <DeclinedIcon fontSize="small" /> },
] as const

const sides = [
  { id: 'all', name: 'All Sides' },
  { id: 'bride', name: "Bride's side" },
  { id: 'groom', name: "Groom's side" },
] as const

export default function GuestsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [guests, setGuests] = useState<Guest[]>([])
  const [filtered, setFiltered] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [openDialog, setOpenDialog] = useState(false)
  const [editing, setEditing] = useState<Guest | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all')
  const [side, setSide] = useState<'all' | '' | 'bride' | 'groom'>('all')
  const [dietary, setDietary] = useState('')
  const [relationship, setRelationship] = useState<''|'sibling'|'parent'|'relative'|'friend'|'neighbour'|'colleague'|'vendor'|'other'>('')
  const [tagQuery, setTagQuery] = useState('')
  const [form, setForm] = useState({
    name: '',
    rsvpStatus: 'pending' as const,
    mealPreference: '',
    side: '' as 'bride' | 'groom' | '',
    invitationSent: false,
    plusOneAllowed: false,
    plusOneName: '',
    householdId: '',
    relationshipCategory: '' as '' | 'sibling'|'parent'|'relative'|'friend'|'neighbour'|'colleague'|'vendor'|'other',
    tags: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [snack, setSnack] = useState<{open: boolean, msg: string}>({ open: false, msg: '' })
  const [serverStats, setServerStats] = useState<{ total: number; bridesSide: number; groomsSide: number } | null>(null)
  // CSV import state
  const [importOpen, setImportOpen] = useState(false)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [updateExisting, setUpdateExisting] = useState(true)

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin')
    }
  }, [user, isLoading, router])

  const getAuthHeaders = useMemo(() => {
    const token = AuthClient.getToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }, [])

  const fetchGuests = useCallback(async () => {
    try {
      const { guests, total } = await GuestsClient.listGuests({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        side: side !== 'all' ? (side as any) : undefined,
        status: status !== 'all' ? (status as any) : undefined,
        category: relationship || undefined,
        dietary: dietary.trim() || undefined,
      })
      setGuests(guests || [])
      if (typeof total === 'number') setTotal(total)
    } catch (e) {
      console.error('Error loading guests:', e)
    } finally {
      setLoading(false)
    }
  }, [side, status, dietary, page, pageSize, relationship])

  useEffect(() => {
    if (!isLoading && user) fetchGuests()
  }, [isLoading, user, fetchGuests])

  useEffect(() => {
    async function loadStats() {
      try {
        const s = await GuestsClient.getStats()
        setServerStats({ total: s.total, bridesSide: s.bridesSide, groomsSide: s.groomsSide })
      } catch (e) {
        // non-blocking
        console.warn('Guests stats unavailable', e)
      }
    }
    if (!isLoading && user) loadStats()
  }, [isLoading, user])

  // Reset to first page when filters/search change
  useEffect(() => { setPage(1) }, [side, status, dietary, search, relationship, tagQuery])

  useEffect(() => {
    let list = guests
    if (status !== 'all') list = list.filter((g) => g.rsvpStatus === status)
    if (side !== 'all') list = list.filter((g) => (g.side || '') === side)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) || (g.mealPreference || '').toLowerCase().includes(q)
      )
    }
    if (relationship) {
      list = (list as any).filter((g: any) => (g.relationshipCategory || '') === relationship)
    }
    if (tagQuery.trim()) {
      const tq = tagQuery.trim().toLowerCase()
      list = list.filter((g) => Array.isArray(g.tags) && g.tags!.some(t => (t || '').toLowerCase().includes(tq)))
    }
    setFiltered(list)
  }, [guests, status, side, search, relationship, tagQuery])

  const getLastInvited = (id: string): string | null => {
    if (typeof window === 'undefined') return null
    const ts = window.localStorage.getItem(`guest_last_invited_${id}`)
    return ts ? new Date(Number(ts)).toLocaleString() : null
  }

  const stats = useMemo(() => {
    const total = guests.length
    const accepted = guests.filter((g) => g.rsvpStatus === 'accepted').length
    const pending = guests.filter((g) => g.rsvpStatus === 'pending').length
    const declined = guests.filter((g) => g.rsvpStatus === 'declined').length
    return { total, accepted, pending, declined }
  }, [guests])

  const dietaryCounts = useMemo(() => {
    const m: Record<string, number> = {}
    guests.forEach((g) => {
      const key = (g.mealPreference || '').trim().toLowerCase()
      if (key) m[key] = (m[key] || 0) + 1
    })
    return m
  }, [guests])

  // --- CSV utils ---
  function parseCsv(text: string): { headers: string[]; rows: string[][] } {
    // Simple CSV parser supporting quoted fields
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.length > 0)
    if (lines.length === 0) return { headers: [], rows: [] }
    const parseLine = (line: string): string[] => {
      const out: string[] = []
      let cur = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuotes && line[i+1] === '"') { cur += '"'; i++ } else { inQuotes = !inQuotes }
        } else if (ch === ',' && !inQuotes) { out.push(cur); cur=''} else { cur += ch }
      }
      out.push(cur)
      return out.map(s => s.trim())
    }
    const headers = parseLine(lines[0])
    const rows = lines.slice(1).map(parseLine).filter(r => r.some(c => c && c.length > 0))
    return { headers, rows }
  }

  function normalizeRow(row: string[], headers: string[], map: Record<string,string>) {
    const get = (field: string) => {
      const col = map[field]
      if (!col) return undefined
      const idx = headers.indexOf(col)
      return idx >= 0 ? row[idx] : undefined
    }
    const b = (v: any) => typeof v === 'string' ? ['yes','true','1','y'].includes(v.toLowerCase()) : Boolean(v)
    const vName = (get('name') || '').toString().trim()
    return {
      name: vName,
      rsvpStatus: (get('rsvpStatus') || '').toString().toLowerCase() as any,
      side: (get('side') || '').toString().toLowerCase() as any,
      mealPreference: (get('mealPreference') || '').toString(),
      invitationSent: b(get('invitationSent')),
      plusOneAllowed: b(get('plusOneAllowed')),
      plusOneName: (get('plusOneName') || '').toString(),
      householdId: (get('householdId') || '').toString(),
      relationshipCategory: (get('relationshipCategory') || '').toString().toLowerCase(),
    }
  }

  function validateCsv() {
    const errs: string[] = []
    if (!mapping['name']) errs.push('Map the name field')
    const allowedStatus = new Set(['','pending','accepted','declined'])
    const allowedSide = new Set(['','bride','groom'])
    const allowedRel = new Set(['','sibling','parent','relative','friend','neighbour','colleague','vendor','other'])
    csvRows.forEach((row, idx) => {
      const obj = normalizeRow(row, csvHeaders, mapping)
      if (!obj.name) errs.push(`Row ${idx+2}: name is required`)
      if (!allowedStatus.has(obj.rsvpStatus || '')) errs.push(`Row ${idx+2}: invalid rsvpStatus`)
      if (!allowedSide.has(obj.side || '')) errs.push(`Row ${idx+2}: invalid side`)
      if (!allowedRel.has((obj as any).relationshipCategory || '')) errs.push(`Row ${idx+2}: invalid relationshipCategory`)
    })
    setImportErrors(errs)
    if (errs.length === 0) setSnack({ open: true, msg: 'Validation passed' })
  }

  async function importCsv() {
    setImporting(true)
    try {
      let created = 0, updated = 0, failed = 0
      // Build a quick lookup by name+household from currently loaded guests (best-effort)
      const key = (n?: string, h?: string) => `${(n||'').toLowerCase()}__${(h||'').toLowerCase()}`
      const index = new Map<string, Guest>()
      guests.forEach(g => index.set(key(g.name, (g as any).householdId || ''), g))
      for (const row of csvRows) {
        const o = normalizeRow(row, csvHeaders, mapping)
        if (!o.name) { failed++; continue }
        const payload: any = {
          name: o.name,
          rsvpStatus: o.rsvpStatus || undefined,
          mealPreference: o.mealPreference || undefined,
          side: o.side || undefined,
          invitationSent: o.invitationSent || undefined,
          plusOneAllowed: o.plusOneAllowed || undefined,
          plusOneName: o.plusOneName || undefined,
          householdId: o.householdId || undefined,
          relationshipCategory: (o as any).relationshipCategory || undefined,
        }
        try {
          let res
          if (updateExisting) {
            const existing = index.get(key(o.name, o.householdId))
            if (existing) {
              try { await GuestsClient.updateGuest(existing.id, payload); updated++; continue } catch { failed++; continue }
            }
          }
          try { await GuestsClient.createGuest(payload); created++ } catch { failed++ }
        } catch { failed++ }
      }
      setSnack({ open: true, msg: `Import complete: ${created} created, ${updated} updated, ${failed} failed` })
      await fetchGuests()
      setImportOpen(false)
    } finally { setImporting(false) }
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', rsvpStatus: 'pending' as const, mealPreference: '', side: '', invitationSent: false, plusOneAllowed: false, plusOneName: '', householdId: '', relationshipCategory: '', tags: '' })
    setErrors({})
    setOpenDialog(true)
  }

  const openEdit = (g: Guest) => {
    setEditing(g)
    setForm({
      name: g.name,
      rsvpStatus: g.rsvpStatus,
      mealPreference: g.mealPreference || '',
      side: g.side || '',
      invitationSent: g.invitationSent,
      plusOneAllowed: !!g.plusOneAllowed,
      plusOneName: g.plusOneName || '',
      householdId: g.householdId || '',
      relationshipCategory: ((g as any).relationshipCategory || '') as any,
      tags: ((g as any).tags || []).join(', '),
    })
    setErrors({})
    setOpenDialog(true)
  }

  const handleDelete = async (g: Guest) => {
    if (!confirm(`Delete ${g.name}?`)) return
    try {
      await GuestsClient.deleteGuest(g.id)
      setGuests((prev) => prev.filter((x) => x.id !== g.id))
    } catch (e) {
      console.error('Delete guest error:', e)
    }
  }

  const handleSave = async () => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    setErrors(newErrors)
    if (Object.keys(newErrors).length) return

    const isEdit = Boolean(editing)
    const payload: any = {
      name: form.name.trim(),
      rsvpStatus: form.rsvpStatus,
      mealPreference: form.mealPreference || undefined,
      side: form.side || undefined,
      invitationSent: form.invitationSent,
      plusOneAllowed: form.plusOneAllowed,
      plusOneName: form.plusOneName || undefined,
      householdId: form.householdId || undefined,
      relationshipCategory: (form as any).relationshipCategory || undefined,
      tags: (form as any).tags ? (form as any).tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
    }
    try {
      if (isEdit) {
        const updated = await GuestsClient.updateGuest(editing!.id, payload)
        setGuests((prev) => prev.map((x) => (x.id === editing!.id ? updated : x)))
      } else {
        const created = await GuestsClient.createGuest(payload)
        setGuests((prev) => [created, ...prev])
      }
      setOpenDialog(false)
    } catch (error: any) {
      setErrors({ submit: error?.message || `Failed to ${isEdit ? 'update' : 'add'} guest` })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.push('/dashboard')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            <GuestsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Guests
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            Add Guest
          </Button>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Accepted
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.accepted}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Declined
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.declined}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        {serverStats && (
          <Box sx={{ px: 1, mb: 3 }}>
            <Card>
              <CardContent sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="overline" sx={{ mr: 1 }}>Server Stats:</Typography>
                <Chip label={`Total ${serverStats.total}`} size="small" />
                <Chip label={`Bride ${serverStats.bridesSide}`} size="small" />
                <Chip label={`Groom ${serverStats.groomsSide}`} size="small" />
              </CardContent>
            </Card>
          </Box>
        )}
        {Object.keys(dietaryCounts).length > 0 && (
          <Box sx={{ px: 1, mb: 3 }}>
            <Card>
              <CardContent sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="overline" sx={{ mr: 1 }}>Dietary:</Typography>
                {Object.entries(dietaryCounts).map(([k, v]) => (
                  <Chip key={k} label={`${k} (${v})`} size="small" />
                ))}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              const rows = filtered.map((g) => ({
                name: g.name,
                rsvpStatus: g.rsvpStatus,
                side: g.side || '',
                mealPreference: g.mealPreference || '',
                invitationSent: g.invitationSent ? 'yes' : 'no',
                plusOneAllowed: g.plusOneAllowed ? 'yes' : 'no',
                plusOneName: g.plusOneName || '',
                householdId: g.householdId || '',
              }) as Record<string, string>)
              const headers = Object.keys(rows[0] || { name: '', rsvpStatus: '', side: '', mealPreference: '', invitationSent: '', plusOneAllowed: '', plusOneName: '', householdId: '' })
              const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'guests.csv'
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Export CSV
          </Button>
          <TextField
            placeholder="Dietary contains…"
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            sx={{ minWidth: 180 }}
            size="small"
          />
          <TextField
            placeholder="Tag contains…"
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value)}
            sx={{ minWidth: 180 }}
            size="small"
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setImportOpen(true)
              setCsvHeaders([]); setCsvRows([]); setMapping({}); setImportErrors([])
            }}
          >
            Import CSV
          </Button>
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            sx={{ minWidth: 120 }}
            size="small"
            SelectProps={{ native: true }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </TextField>
          <TextField
            select
            label="Side"
            value={side}
            onChange={(e) => setSide(e.target.value as any)}
            sx={{ minWidth: 120 }}
            size="small"
            SelectProps={{ native: true }}
          >
            <option value="all">All Sides</option>
            <option value="bride">Bride</option>
            <option value="groom">Groom</option>
          </TextField>
          <TextField
            select
            label="Relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value as any)}
            sx={{ minWidth: 180 }}
            size="small"
            SelectProps={{ native: true }}
          >
            <option value="">All relationships</option>
            <option value="sibling">Sibling</option>
            <option value="parent">Parent</option>
            <option value="relative">Relative</option>
            <option value="friend">Friend</option>
            <option value="neighbour">Neighbour</option>
            <option value="colleague">Colleague</option>
            <option value="vendor">Vendor</option>
            <option value="other">Other</option>
          </TextField>
        </Box>
        {selectedIds.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body2">{selectedIds.length} selected</Typography>
              <TextField
                select size="small" label="Set RSVP"
                onChange={async (e) => {
                  const newStatus = e.target.value as 'pending'|'accepted'|'declined'
                  await GuestsClient.setRsvpStatusBulk(selectedIds, newStatus)
                  setGuests(prev => prev.map(g => selectedIds.includes(g.id) ? { ...g, rsvpStatus: newStatus } : g))
                }}
                SelectProps={{ native: true }}
              >
                <option value="">Choose…</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </TextField>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox onChange={async (e) => {
                  const val = e.target.checked
                  await GuestsClient.setInvitationSentBulk(selectedIds, val)
                  setGuests(prev => prev.map(g => selectedIds.includes(g.id) ? { ...g, invitationSent: val } : g))
                }} />
                <Typography variant="body2">Mark invited</Typography>
              </Box>
              <TextField
                size="small"
                label="Household"
                placeholder="household id/name"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value
                    await GuestsClient.setHouseholdBulk(selectedIds, val || null)
                    setGuests(prev => prev.map(g => selectedIds.includes(g.id) ? { ...g, householdId: val || null } : g))
                    ;(e.target as HTMLInputElement).value=''
                  }
                }}
              />
              <Button size="small" variant="text" onClick={() => setSelectedIds([])}>Clear selection</Button>
            </CardContent>
          </Card>
        )}

        {/* Guests List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {filtered.map((guest) => (
              <Card key={guest.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                          size="small"
                          checked={selectedIds.includes(guest.id)}
                          onChange={(e) => {
                            setSelectedIds(prev => e.target.checked ? [...new Set([...prev, guest.id])] : prev.filter(id => id !== guest.id))
                          }}
                        />
                        <Typography variant="h6" sx={{ m: 0 }}>{guest.name}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {guest.side ? `${guest.side}'s side` : 'No side specified'}
                      </Typography>
                      {guest.mealPreference && (
                        <Typography variant="body2" color="text.secondary">
                          Meal: {guest.mealPreference}
                        </Typography>
                      )}
                      {(guest as any).relationshipCategory && (
                        <Typography variant="body2" color="text.secondary">
                          Relationship: {(guest as any).relationshipCategory}
                        </Typography>
                      )}
                      {guest.plusOneAllowed && (
                        <Typography variant="body2" color="text.secondary">
                          Plus one{guest.plusOneName ? `: ${guest.plusOneName}` : ''}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        select
                        size="small"
                        value={guest.rsvpStatus}
                        onChange={async (e) => {
                          const newStatus = e.target.value as 'pending'|'accepted'|'declined'
                          try {
                            await GuestsClient.updateGuest(guest.id, { rsvpStatus: newStatus })
                            setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, rsvpStatus: newStatus } : g))
                          } catch {}
                        }}
                        SelectProps={{ native: true }}
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                      </TextField>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox
                          checked={guest.invitationSent}
                          onChange={async (e) => {
                            const val = e.target.checked
                            try {
                              await GuestsClient.updateGuest(guest.id, { invitationSent: val })
                              setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, invitationSent: val } : g))
                            } catch {}
                          }}
                          size="small"
                        />
                        <Typography variant="caption">Invited</Typography>
                      </Box>
                      <IconButton onClick={async () => {
                        try {
                          const origin = typeof window !== 'undefined' ? window.location.origin : ''
                          const url = `${origin}/invite/${guest.id}`
                          await navigator.clipboard.writeText(url)
                        } catch {}
                      }} title="Copy invite link">
                        <CopyIcon />
                      </IconButton>
                      <IconButton onClick={() => openEdit(guest)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(guest)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {total > pageSize && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <Pagination
              count={Math.ceil(total / pageSize)}
              page={page}
              onChange={(e, p) => setPage(p)}
              color="primary"
            />
          </Box>
        )}
        <Snackbar
          open={snack.open}
          message={snack.msg}
          autoHideDuration={2000}
          onClose={() => setSnack({ open: false, msg: '' })}
        />

        {/* Import CSV Dialog */}
        <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Import Guests from CSV</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  const { headers, rows } = parseCsv(text)
                  setCsvHeaders(headers)
                  setCsvRows(rows)
                  // naive auto-map by header names
                  const lower = (s: string) => s.toLowerCase().trim()
                  const auto: Record<string,string> = {}
                  const targets = ['name','rsvpStatus','side','mealPreference','invitationSent','plusOneAllowed','plusOneName','householdId','relationshipCategory']
                  targets.forEach(t => {
                    const idx = headers.findIndex(h => lower(h) === lower(t) || lower(h) === lower(t.replace(/([A-Z])/g,' $1')))
                    if (idx >= 0) auto[t] = headers[idx]
                  })
                  setMapping(auto)
                }}
              />
              {csvHeaders.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Map columns to fields</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 1 }}>
                    {['name','rsvpStatus','side','mealPreference','invitationSent','plusOneAllowed','plusOneName','householdId','relationshipCategory'].map((field) => (
                      <React.Fragment key={field}>
                        <Typography variant="body2" sx={{ alignSelf: 'center' }}>{field}</Typography>
                        <TextField
                          select
                          size="small"
                          value={mapping[field] || ''}
                          onChange={(e) => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                          SelectProps={{ native: true }}
                        >
                          <option value="">(none)</option>
                          {csvHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </TextField>
                      </React.Fragment>
                    ))}
                  </Box>
                </Box>
              )}
              {csvRows.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Preview (first 5 rows)</Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                    <table style={{ width: '100%', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {csvHeaders.map(h => (<th key={h} style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid #eee' }}>{h}</th>))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.slice(0,5).map((r,i) => (
                          <tr key={i}>
                            {r.map((c,j) => (<td key={j} style={{ padding: 6, borderBottom: '1px solid #fafafa' }}>{c}</td>))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              )}
              {importErrors.length > 0 && (
                <Box sx={{ color: 'error.main' }}>
                  {importErrors.map((e,i) => (<Typography key={i} variant="body2">• {e}</Typography>))}
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} />
                <Typography variant="body2">Update existing guests by name + household</Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImportOpen(false)}>Close</Button>
            <Button disabled={csvHeaders.length === 0 || importing} onClick={() => validateCsv()}>
              Validate
            </Button>
            <Button variant="contained" disabled={csvRows.length === 0 || importing || importErrors.length > 0} onClick={() => importCsv()}>
              {importing ? 'Importing…' : 'Import'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editing ? 'Edit Guest' : 'Add Guest'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                select
                label="RSVP Status"
                name="rsvpStatus"
                value={form.rsvpStatus}
                onChange={handleChange}
                sx={{ mb: 2 }}
                SelectProps={{ native: true }}
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </TextField>
              <TextField
                fullWidth
                select
                label="Side"
                name="side"
                value={form.side}
                onChange={handleChange}
                sx={{ mb: 2 }}
                SelectProps={{ native: true }}
              >
                <option value="">Select side</option>
                <option value="bride">Bride</option>
                <option value="groom">Groom</option>
              </TextField>
              <TextField
                fullWidth
                label="Meal Preference"
                name="mealPreference"
                value={form.mealPreference}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                select
                label="Relationship"
                name="relationshipCategory"
                value={(form as any).relationshipCategory || ''}
                onChange={handleChange}
                sx={{ mb: 2 }}
                SelectProps={{ native: true }}
              >
                <option value="">Select relationship</option>
                <option value="sibling">Sibling</option>
                <option value="parent">Parent</option>
                <option value="relative">Relative</option>
                <option value="friend">Friend</option>
                <option value="neighbour">Neighbour</option>
                <option value="colleague">Colleague</option>
                <option value="vendor">Vendor</option>
                <option value="other">Other</option>
              </TextField>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                name="tags"
                value={(form as any).tags || ''}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Checkbox
                  checked={form.plusOneAllowed}
                  onChange={(e) => setForm({ ...form, plusOneAllowed: e.target.checked, plusOneName: e.target.checked ? form.plusOneName : '' })}
                  name="plusOneAllowed"
                />
                <Typography>Allow plus one</Typography>
              </Box>
              {form.plusOneAllowed && (
                <TextField
                  fullWidth
                  label="Plus one name (optional)"
                  name="plusOneName"
                  value={form.plusOneName}
                  onChange={(e) => setForm({ ...form, plusOneName: e.target.value })}
                  sx={{ mb: 2 }}
                />
              )}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={form.invitationSent}
                  onChange={handleChange}
                  name="invitationSent"
                />
                <Typography>Invitation sent</Typography>
              </Box>
              {errors.submit && (
                <Typography color="error" variant="body2">
                  {errors.submit}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">
              {editing ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  )
}
// Snackbar renderer appended after component (Note: must be inside return; adjust placement)
