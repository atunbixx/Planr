"use client"

import { useMemo, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { GuestsClient, type LegacyGuest } from '@/lib/api/guests.client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useApiQuery } from '@/lib/api/useApiQuery'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export default function GuestsPage() {
  // Filters
  const [side, setSide] = useState<''|'bride'|'groom'>('')
  const [status, setStatus] = useState<''|'pending'|'accepted'|'declined'>('')
  const [category, setCategory] = useState<string>('')
  const [dietary, setDietary] = useState<string>('')

  const key = useMemo(() => `guests:list:${side}:${status}:${category}:${dietary}`, [side, status, category, dietary])

  const { data, error, isLoading, refetch } = useApiQuery(key, async () => {
    const params: any = { limit: 200 }
    if (side) params.side = side
    if (status) params.status = status
    if (category) params.category = category
    if (dietary) params.dietary = dietary
    const [{ guests }, gstats] = await Promise.all([
      GuestsClient.listGuests(params),
      GuestsClient.getStats(),
    ])
    return { guests, stats: { total: gstats.total, totalAttending: gstats.totalAttending } }
  })
  const guests = (data?.guests || []) as LegacyGuest[]
  const stats = data?.stats || null

  // Selection
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected])

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {}
    if (checked) guests.forEach(g => next[g.id] = true)
    setSelected(next)
  }

  const onBulkRsvp = async (newStatus: 'pending'|'accepted'|'declined') => {
    if (!selectedIds.length) return
    await GuestsClient.setRsvpStatusBulk(selectedIds, newStatus)
    setSelected({})
    await refetch()
  }

  const onBulkInvite = async (invited: boolean) => {
    if (!selectedIds.length) return
    await GuestsClient.setInvitationSentBulk(selectedIds, invited)
    setSelected({})
    await refetch()
  }

  // Create Guest Modal
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ firstName: string; lastName?: string; email?: string; phone?: string; side?: 'bride'|'groom'; plusOneAllowed?: boolean; plusOneName?: string; dietaryRestrictions?: string; relationshipCategory?: string }>({ firstName: '' })
  const canSubmit = useMemo(() => form.firstName.trim().length > 0, [form])
  const onAdd = () => { setForm({ firstName: '' }); setOpen(true) }
  const onSubmit = async () => {
    await GuestsClient.createGuest(form as any)
    setOpen(false)
    await refetch()
  }

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">Guests</h1>
            <p className="text-dark-6 dark:text-dark-4 mt-1">Manage your guest list and RSVPs</p>
          </div>
          <div className="flex items-center gap-3">
            {stats && (
              <>
                <Badge variant="outline">Total: {stats.total}</Badge>
                <Badge variant="success">Attending: {stats.totalAttending}</Badge>
              </>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={onAdd}>Add Guest</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Guest</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">First Name</label>
                    <Input value={form.firstName} onChange={e=>setForm(f=>({...f, firstName: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Last Name</label>
                    <Input value={form.lastName || ''} onChange={e=>setForm(f=>({...f, lastName: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Email</label>
                    <Input type="email" value={form.email || ''} onChange={e=>setForm(f=>({...f, email: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Phone</label>
                    <Input value={form.phone || ''} onChange={e=>setForm(f=>({...f, phone: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Side</label>
                    <Select value={form.side || ''} onValueChange={(v:any)=>setForm(f=>({...f, side: v}))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bride">Bride</SelectItem>
                        <SelectItem value="groom">Groom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Dietary</label>
                    <Input value={form.dietaryRestrictions || ''} onChange={e=>setForm(f=>({...f, dietaryRestrictions: e.target.value}))} />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                  <Button onClick={onSubmit} disabled={!canSubmit}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Side</label>
            <Select value={side || 'all'} onValueChange={(v:any)=>setSide(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="bride">Bride</SelectItem>
                <SelectItem value="groom">Groom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">RSVP</label>
            <Select value={status || 'all'} onValueChange={(v:any)=>setStatus(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Category</label>
            <Input className="w-48" value={category} onChange={e=>setCategory(e.target.value)} placeholder="e.g. family" />
          </div>
          <div>
            <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Dietary</label>
            <Input className="w-48" value={dietary} onChange={e=>setDietary(e.target.value)} placeholder="e.g. vegan" />
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={()=>onBulkRsvp('accepted')} disabled={!selectedIds.length}>Mark Accepted</Button>
            <Button variant="outline" onClick={()=>onBulkRsvp('declined')} disabled={!selectedIds.length}>Mark Declined</Button>
            <Button variant="outline" onClick={()=>onBulkRsvp('pending')} disabled={!selectedIds.length}>Mark Pending</Button>
            <Button onClick={()=>onBulkInvite(true)} disabled={!selectedIds.length}>Mark Invited</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-sm text-dark-6">Loading guests…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{String(error)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox checked={guests.length>0 && selectedIds.length===guests.length} onCheckedChange={(v:any)=>toggleAll(Boolean(v))} />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>RSVP</TableHead>
                <TableHead>Invited</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map(g => (
                <TableRow key={g.id}>
                  <TableCell>
                    <Checkbox checked={Boolean(selected[g.id])} onCheckedChange={(v:any)=>setSelected(s=>({...s,[g.id]: Boolean(v)}))} />
                  </TableCell>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="capitalize text-[#475569]">{g.side || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={g.rsvpStatus === 'accepted' ? 'success' : g.rsvpStatus === 'declined' ? 'error' : 'outline'}>
                      {g.rsvpStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{g.invitationSent ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PremiumDashboardLayout>
  )
}
